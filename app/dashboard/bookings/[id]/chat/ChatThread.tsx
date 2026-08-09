"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SubPage } from "@/components/dashboard/SubPage";
import { Card } from "@/components/dashboard/primitives";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useChatSocket } from "@/hooks/useChatSocket";
import { api } from "@/lib/api/client";
import { errorMessage, isApiError } from "@/lib/api/errors";
import { messageTime, serviceLabel } from "@/lib/api/adapters";
import type { ApiBooking, ApiChatMessage, ChatHistoryResponse } from "@/lib/api/types";
import { CHAT_ALLOWED_STATUSES } from "@/lib/api/types";

/**
 * Booking chat.
 *
 * Realtime over Socket.io, with polling kept as the safety net.
 *
 * The socket delivers `new_message` instantly and carries typing indicators and
 * read receipts. It is NOT trusted as the only delivery path: a refused
 * handshake, an expired token, a dropped Redis emit, or a laptop waking with a
 * silently dead connection would each lose messages. So the poll stays — fast
 * (5s) when the socket is down, slow (30s) when it is up.
 *
 * Sending still goes over REST rather than the socket's `send_message`. Both
 * exist and both persist, but the REST call returns the stored record, so the
 * message that lands in the thread has a real id and timestamp instead of a
 * local echo that the next poll would duplicate.
 */

/** Fast poll when realtime is unavailable, slow heartbeat when it is up. */
const POLL_MS_OFFLINE = 5000;
const POLL_MS_REALTIME = 30000;
const MAX_LENGTH = 1000;

function senderId(message: ApiChatMessage): string {
  return typeof message.senderId === "string" ? message.senderId : message.senderId._id;
}

function senderName(message: ApiChatMessage): string {
  if (typeof message.senderId === "string") return "Provider";
  return message.senderId.name || "Provider";
}

export function ChatThread({ bookingId }: { bookingId: string }) {
  const { data: bookingData, loading: bookingLoading } = useApiQuery<{
    booking: ApiBooking;
  }>(`bookings/${bookingId}`);

  const booking = bookingData?.booking;
  const chatOpen = booking ? CHAT_ALLOWED_STATUSES.includes(booking.status) : false;

  const [messages, setMessages] = useState<ApiChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  /** Merge without duplicating: the socket and a poll can deliver the same id. */
  const upsert = useCallback((incoming: ApiChatMessage) => {
    setMessages((prev) =>
      prev.some((m) => m._id === incoming._id) ? prev : [...prev, incoming],
    );
  }, []);

  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  /** Don't yank the view down if the user has scrolled up to read history. */
  const pinnedToBottom = useRef(true);

  const load = useCallback(async () => {
    try {
      const data = await api<ChatHistoryResponse>(`chat/${bookingId}`, {
        query: { limit: 100 },
      });
      // The API sorts ASCENDING (`.sort({ createdAt: 1 })`) — oldest first,
      // which is already the order the thread renders. An earlier `.reverse()`
      // here displayed history backwards; it looked fine only because the
      // thread had a single message. The mobile client renders the response
      // directly for exactly this reason.
      setMessages(data.messages ?? []);
      setLoadError(null);
    } catch (cause) {
      // A 403 here is the "not paid yet" gate, which the shell already
      // explains — don't repeat it as an error.
      if (!(isApiError(cause) && cause.status === 403)) {
        setLoadError(errorMessage(cause));
      }
    } finally {
      setLoaded(true);
    }
  }, [bookingId]);

  const clientId = booking ? clientIdOf(booking) : null;

  const socket = useChatSocket({
    bookingId,
    enabled: chatOpen,
    onMessage: (message) => {
      upsert(message);
      // Anything addressed to us is seen the moment it lands, since the thread
      // is on screen. Without this the provider's ticks never turn.
      if (clientId && message.recipientId === clientId) socket.markRead();
    },
    onRead: (readBy) => {
      // Someone else read the thread — flip the ticks on our own messages
      // rather than refetching the whole history for one boolean.
      if (readBy && clientId && readBy === clientId) return;
      setMessages((prev) =>
        prev.map((m) =>
          senderId(m) === clientId ? { ...m, isRead: true } : m,
        ),
      );
    },
  });

  useEffect(() => {
    if (!chatOpen) return;
    void load();
  }, [chatOpen, load]);

  // Poll only while the chat is usable and the tab is actually being looked at.
  useEffect(() => {
    if (!chatOpen) return;

    const interval = socket.connected ? POLL_MS_REALTIME : POLL_MS_OFFLINE;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer === null) timer = setInterval(() => void load(), interval);
    };
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        void load();
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [chatOpen, load, socket.connected]);

  // Opening the thread is itself "seen" — the REST history call marks them read
  // server-side, but only the socket event turns the other party's ticks.
  useEffect(() => {
    if (socket.connected) socket.markRead();
  }, [socket.connected, socket]);

  useEffect(() => {
    if (pinnedToBottom.current) {
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messages]);

  function onScroll() {
    const el = listRef.current;
    if (!el) return;
    pinnedToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  }

  async function send() {
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    setSendError(null);
    try {
      const { message } = await api<{ message: ApiChatMessage }>(`chat/${bookingId}`, {
        method: "POST",
        body: { content },
      });
      setDraft("");
      pinnedToBottom.current = true;
      socket.setTyping(false);
      // The server's own record — real id and timestamp. `upsert` guards against
      // the socket echoing the same message back to us.
      upsert(message);
    } catch (cause) {
      setSendError(errorMessage(cause));
    } finally {
      setSending(false);
    }
  }

  const title = booking ? `Chat · ${serviceLabel(booking.serviceCategory)}` : "Chat";

  if (bookingLoading) {
    return (
      <SubPage title="Chat" backHref={`/dashboard/bookings/${bookingId}`} backLabel="Booking" width={720}>
        <div className="h-[420px] animate-pulse rounded-2xl bg-app-card" />
      </SubPage>
    );
  }

  if (!booking) {
    return (
      <SubPage title="Chat" backHref="/dashboard/bookings" backLabel="Bookings" width={720}>
        <Card className="px-6 py-12 text-center">
          <p role="alert" className="text-[15px] text-red-300">
            This booking could not be found.
          </p>
        </Card>
      </SubPage>
    );
  }

  if (!chatOpen) {
    return (
      <SubPage
        title={title}
        subtitle={booking.bookingId}
        backHref={`/dashboard/bookings/${bookingId}`}
        backLabel="Booking"
        width={720}
      >
        <Card className="px-6 py-12 text-center">
          <p className="text-[15px] text-slate-300">
            Chat opens once the booking is paid.
          </p>
          <p className="mx-auto mt-2 max-w-[420px] text-[13.5px] leading-relaxed text-slate-500">
            Provider contact is released after payment — until then, use Support if you
            need to ask something about this booking.
          </p>
          <Link
            href="/dashboard/support/new"
            className="mt-5 inline-block rounded-full border border-app-gold px-6 py-2.5 text-[14px] font-bold text-app-gold"
          >
            Contact support
          </Link>
        </Card>
      </SubPage>
    );
  }

  return (
    <SubPage
      title={title}
      subtitle={booking.bookingId}
      backHref={`/dashboard/bookings/${bookingId}`}
      backLabel="Booking"
      width={720}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold",
            socket.connected
              ? "bg-green-500/12 text-green-500"
              : "bg-white/6 text-slate-500",
          ].join(" ")}
        >
          <span
            className={[
              "inline-block h-1.5 w-1.5 rounded-full",
              socket.connected ? "animate-pulse-dot bg-green-500" : "bg-slate-600",
            ].join(" ")}
          />
          {socket.connected ? "Live" : "Reconnecting — messages still refresh"}
        </span>
      </div>

      {loadError ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-[14px] text-red-300"
        >
          {loadError}
        </p>
      ) : null}

      <Card className="flex h-[min(62vh,560px)] flex-col overflow-hidden">
        <div
          ref={listRef}
          onScroll={onScroll}
          className="flex flex-1 flex-col gap-3 overflow-y-auto p-5"
        >
          {!loaded ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-2xl bg-white/4" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <p className="m-auto max-w-[380px] text-center text-[13.5px] leading-relaxed text-slate-500">
              No messages yet. Say hello, confirm the site address, or share anything the
              guard should know before arriving.
            </p>
          ) : (
            messages.map((m) => <Bubble key={m._id} message={m} clientId={clientId} />)
          )}
          {socket.peerTyping ? (
            <p className="text-[12.5px] italic text-slate-500">Typing…</p>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-white/8 p-4">
          {sendError ? (
            <p role="alert" className="mb-2 text-[13px] text-red-300">
              {sendError}
            </p>
          ) : null}
          <div className="flex items-end gap-2.5">
            <label htmlFor="chat-input" className="sr-only">
              Message
            </label>
            <textarea
              id="chat-input"
              rows={1}
              value={draft}
              maxLength={MAX_LENGTH}
              placeholder="Write a message…"
              onChange={(e) => {
                setDraft(e.target.value);
                socket.setTyping(e.target.value.trim().length > 0);
              }}
              onKeyDown={(e) => {
                // Enter sends, Shift+Enter makes a new line — the convention
                // everywhere else people chat.
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              className="max-h-32 min-h-[46px] flex-1 resize-none rounded-xl border border-app-border bg-white/4 px-4 py-3 text-[14.5px] text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-app-gold/60"
            />
            <button
              type="button"
              onClick={send}
              disabled={!draft.trim() || sending}
              className={[
                "h-[46px] shrink-0 rounded-full px-6 text-[14px] font-bold transition-colors",
                draft.trim() && !sending
                  ? "bg-app-gold-gradient text-black"
                  : "cursor-not-allowed bg-app-disabled text-slate-500",
              ].join(" ")}
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
          <p className="mt-2 text-[11.5px] text-slate-600">
            {draft.length}/{MAX_LENGTH} · Messages are retained with the booking record.
            Never share OTPs here.
          </p>
        </div>
      </Card>
    </SubPage>
  );
}

function clientIdOf(booking: ApiBooking): string | null {
  const c = booking.clientId;
  if (!c) return null;
  return typeof c === "string" ? c : c._id;
}

function Bubble({
  message,
  clientId,
}: {
  message: ApiChatMessage;
  clientId: string | null;
}) {
  // System messages are the platform talking, not either party.
  if (message.messageType === "system") {
    return (
      <p className="mx-auto max-w-[80%] rounded-full bg-white/5 px-4 py-1.5 text-center text-[12px] text-slate-500">
        {message.content}
      </p>
    );
  }

  const mine = clientId !== null && senderId(message) === clientId;

  return (
    <div className={["flex", mine ? "justify-end" : "justify-start"].join(" ")}>
      <div
        className={[
          "max-w-[78%] rounded-2xl px-4 py-3",
          mine
            ? "rounded-br-md bg-app-gold/12 text-slate-100"
            : "rounded-bl-md border border-app-border bg-app-card text-slate-200",
        ].join(" ")}
      >
        {!mine ? (
          <p className="mb-1 text-[11.5px] font-bold text-slate-400">
            {senderName(message)}
          </p>
        ) : null}

        {message.fileUrl ? (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-1.5 block text-[13.5px] font-semibold text-app-gold underline"
          >
            {message.fileName ?? "Attachment"}
          </a>
        ) : null}

        <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{message.content}</p>

        <p className="mt-1.5 flex items-center justify-end gap-1.5 text-[11px] text-slate-600">
          {messageTime(message.createdAt)}
          {mine && message.isRead ? <span className="text-app-info">Read</span> : null}
        </p>
      </div>
    </div>
  );
}
