"use client";

import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import { isAccountEvent, staleMatcher } from "@/lib/live/account-events";
import { refreshAll, refreshMatching } from "@/lib/live/query-registry";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
/** Several notifications often land together (a payment and its booking); refresh once for them. */
const COALESCE_MS = 300;

/**
 * One realtime connection per signed-in session, listening for `account_event`
 * (spec 0003 E, backend 0020). Mounted once, by the dashboard shell.
 *
 * - An event refreshes only the queries it makes stale (`staleMatcher`). The payload is never
 *   rendered, and the refetch goes through the BFF like any other.
 * - After a reconnect, every query on screen refreshes exactly once, because missed events
 *   are not replayed.
 * - The token comes from /api/auth/socket-token on every (re)connect and is held in this
 *   closure only (see that route for why). Access tokens last 15 minutes, so a reconnect
 *   after an hour still authenticates.
 *
 * Chat keeps its own connection (useChatSocket). Sharing one socket means reworking chat's
 * room handling, and is left for when chat is next changed.
 */
export function useAccountEvents(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !SOCKET_URL) return;

    let socket: Socket | null = null;
    let connectedBefore = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let pending: Array<(path: string) => boolean> = [];

    const flush = () => {
      timer = null;
      const matchers = pending;
      pending = [];
      refreshMatching((path) => matchers.some((m) => m(path)));
    };

    socket = io(SOCKET_URL, {
      auth: (cb) => {
        fetch("/api/auth/socket-token", { credentials: "same-origin" })
          .then((res) => (res.ok ? res.json() : Promise.reject(new Error("no token"))))
          .then((body: { token: string }) => cb({ token: body.token }))
          .catch(() => cb({}));
      },
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnectionDelayMax: 30_000,
    });

    socket.on("connect", () => {
      if (connectedBefore) refreshAll();
      connectedBefore = true;
    });

    socket.on("account_event", (payload: unknown) => {
      if (!isAccountEvent(payload)) return;
      pending.push(staleMatcher(payload));
      if (!timer) timer = setTimeout(flush, COALESCE_MS);
    });

    return () => {
      if (timer) clearTimeout(timer);
      socket?.removeAllListeners();
      socket?.disconnect();
    };
  }, [enabled]);
}
