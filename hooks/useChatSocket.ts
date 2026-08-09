"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { ApiChatMessage } from "@/lib/api/types";

/**
 * Realtime chat over Socket.io.
 *
 * The token is fetched from /api/auth/socket-token and held **in this closure
 * only** — never localStorage, never a cookie readable by script. See that
 * route for why the token has to leave the cookie at all and what the residual
 * risk is.
 *
 * Polling is not removed. The socket is an accelerator, and the caller keeps a
 * slow poll as the safety net: if the handshake is refused, Redis drops an
 * emit, or a laptop wakes from sleep with a silently dead connection, messages
 * still arrive. `connected` tells the caller how hard to poll.
 *
 * NOTE — the socket's `join_room` only checks that you are a participant; it
 * does NOT enforce the payment gate that the REST endpoints do (verified: a
 * cancelled booking's room joins successfully while GET /chat/:id returns 403).
 * The caller must therefore gate on booking status itself, which ChatThread
 * does. Do not rely on the socket to refuse a closed chat.
 */

type Options = {
  bookingId: string;
  enabled: boolean;
  onMessage: (message: ApiChatMessage) => void;
  /** Fired when the other party reads the thread — carries who read it. */
  onRead?: (readBy: string | undefined) => void;
};

export type ChatSocket = {
  /** True once the handshake succeeded and the booking room was joined. */
  connected: boolean;
  /** Set when realtime is unavailable — the caller falls back to polling. */
  error: string | null;
  /** Emits a typing indicator to the other participant. Safe to call often. */
  setTyping: (isTyping: boolean) => void;
  /** Tells the server we've seen the thread, which flips the sender's ticks. */
  markRead: () => void;
  /** True while the other party is typing. */
  peerTyping: boolean;
};

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

export function useChatSocket({
  bookingId,
  enabled,
  onMessage,
  onRead,
}: Options): ChatSocket {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peerTyping, setPeerTyping] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  // Callbacks change identity on every render; holding them in refs keeps the
  // effect from tearing down and rebuilding the connection each time.
  const onMessageRef = useRef(onMessage);
  const onReadRef = useRef(onRead);
  onMessageRef.current = onMessage;
  onReadRef.current = onRead;

  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !bookingId) return;

    if (!SOCKET_URL) {
      setError("Realtime is not configured.");
      return;
    }

    let cancelled = false;
    let socket: Socket | null = null;

    (async () => {
      let token: string;
      try {
        const res = await fetch("/api/auth/socket-token", { credentials: "same-origin" });
        if (!res.ok) throw new Error("no token");
        token = (await res.json()).token;
      } catch {
        if (!cancelled) setError("Couldn't start a realtime connection.");
        return;
      }
      if (cancelled) return;

      socket = io(SOCKET_URL, {
        auth: { token },
        // Prefer websocket, but allow the polling fallback so a proxy that
        // blocks upgrades still gets realtime rather than nothing.
        transports: ["websocket", "polling"],
        withCredentials: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        setError(null);
        socket?.emit("join_room", { bookingId });
      });

      socket.on("room_joined", () => {
        if (!cancelled) setConnected(true);
      });

      socket.on("new_message", (message: ApiChatMessage) => {
        onMessageRef.current(message);
      });

      socket.on("messages_read", ({ readBy }: { readBy?: string } = {}) =>
        onReadRef.current?.(readBy),
      );

      socket.on("user_typing", ({ isTyping }: { isTyping?: boolean }) => {
        setPeerTyping(Boolean(isTyping));
      });

      socket.on("chat_error", ({ message }: { message?: string }) => {
        setError(message ?? "Realtime chat error.");
      });

      socket.on("disconnect", () => setConnected(false));

      socket.on("connect_error", (err: Error) => {
        setConnected(false);
        // AUTH_REQUIRED / AUTH_INVALID mean the token expired between fetch and
        // handshake. Reconnecting with the same one would loop, so stop and let
        // polling carry it until the page is revisited.
        if (err.message?.startsWith("AUTH")) {
          socket?.disconnect();
          setError("Realtime session expired — messages will still refresh.");
        }
      });
    })();

    return () => {
      cancelled = true;
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (socket) {
        socket.emit("leave_room", { bookingId });
        socket.removeAllListeners();
        socket.disconnect();
      }
      socketRef.current = null;
      setConnected(false);
      setPeerTyping(false);
    };
  }, [bookingId, enabled]);

  const setTyping = useCallback(
    (isTyping: boolean) => {
      const socket = socketRef.current;
      if (!socket?.connected) return;
      socket.emit("typing", { bookingId, isTyping });

      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (isTyping) {
        // Auto-clear so a user who stops mid-sentence doesn't appear to type
        // forever to the other side.
        typingTimer.current = setTimeout(() => {
          socketRef.current?.emit("typing", { bookingId, isTyping: false });
        }, 3000);
      }
    },
    [bookingId],
  );

  const markRead = useCallback(() => {
    socketRef.current?.emit("mark_read", { bookingId });
  }, [bookingId]);

  return { connected, error, setTyping, markRead, peerTyping };
}
