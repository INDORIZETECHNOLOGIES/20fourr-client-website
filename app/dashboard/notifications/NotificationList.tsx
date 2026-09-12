"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/dashboard/primitives";
import { BellIcon, ChevronRightIcon, TrashIcon } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { adaptNotification } from "@/lib/api/adapters";
import type { NotificationListResponse } from "@/lib/api/types";
import { notificationMeta } from "@/lib/support-data";

export function NotificationList() {
  const { data, loading, error, refetch } = useApiQuery<NotificationListResponse>(
    "notifications",
    { query: { limit: 50 } },
  );

  /**
   * Ids marked read locally so the row updates the instant it is clicked,
   * without waiting for a refetch. Reconciled on the next load.
   */
  const [readLocally, setReadLocally] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const items = (data?.notifications ?? [])
    .map(adaptNotification)
    .map((n) => (readLocally.has(n.id) ? { ...n, read: true } : n));
  const unread = items.filter((n) => !n.read).length;

  async function markRead(id: string) {
    if (readLocally.has(id)) return;
    setReadLocally((prev) => new Set(prev).add(id));
    try {
      await api(`notifications/${id}/read`, { method: "PUT" });
    } catch {
      // Losing a read receipt is not worth interrupting navigation for — the
      // next load will show it unread again, which is the honest state.
      setReadLocally((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function markAllRead() {
    setBusy(true);
    setActionError(null);
    try {
      await api("notifications/read-all", { method: "PUT" });
      refetch();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setActionError(null);
    try {
      await api(`notifications/${id}`, { method: "DELETE" });
      refetch();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Card className="overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border-b border-hairline px-5 py-4 last:border-b-0">
            <div className="h-[52px] animate-pulse rounded-lg bg-panel-raised" />
          </div>
        ))}
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="px-6 py-14 text-center">
        <p role="alert" className="text-body text-fault">
          {error}
        </p>
        <button
          type="button"
          onClick={refetch}
          className="mt-4 rounded-sm border border-edge px-6 py-2.5 text-body-sm font-medium text-fg"
        >
          Try again
        </button>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-body-sm text-fg-faint">
          {unread > 0 ? `${unread} unread` : "All caught up"}
        </p>
        {unread > 0 ? (
          <button
            type="button"
            onClick={markAllRead}
            disabled={busy}
            className="text-body-sm font-semibold text-fg underline-offset-2 hover:underline disabled:opacity-50"
          >
            Mark all read
          </button>
        ) : null}
      </div>

      {actionError ? (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-fault bg-transparent px-4 py-3 text-body text-fault"
        >
          {actionError}
        </p>
      ) : null}

      {items.length === 0 ? (
        <Card className="px-6 py-14 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-panel-raised text-fg-faint">
            <BellIcon size={20} />
          </span>
          <p className="text-body text-fg-faint">Nothing here yet.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {items.map((n, i) => {
            const meta = notificationMeta(n.kind);
            const body = (
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <span
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.tint}`}
                >
                  <BellIcon size={17} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-body font-semibold text-fg">
                      {n.title}
                    </span>
                    {!n.read ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
                    ) : null}
                  </div>
                  <p className="mt-1 text-body-sm leading-relaxed text-fg-faint">{n.body}</p>
                  <p className="mt-1.5 text-label text-fg-faint">
                    {meta.label} · {n.at}
                  </p>
                </div>

                {n.href ? (
                  <span className="mt-1 shrink-0 text-fg-faint group-hover:text-fg-mid">
                    <ChevronRightIcon size={16} />
                  </span>
                ) : null}
              </div>
            );

            return (
              <div
                key={n.id}
                className={[
                  "group flex items-start gap-2 px-5 py-4 transition-colors",
                  n.href ? "hover:bg-panel-raised" : "",
                  i < items.length - 1 ? "border-b border-hairline" : "",
                  n.read ? "" : "bg-panel-raised",
                ].join(" ")}
              >
                {n.href ? (
                  <Link href={n.href} onClick={() => void markRead(n.id)} className="flex min-w-0 flex-1">
                    {body}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => void markRead(n.id)}
                    className="flex min-w-0 flex-1 text-left"
                  >
                    {body}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => remove(n.id)}
                  disabled={busy}
                  aria-label={`Delete notification: ${n.title}`}
                  className="mt-0.5 shrink-0 rounded-full p-2 text-fg-faint opacity-0 transition-opacity hover:bg-panel-raised hover:text-fault focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-30"
                >
                  <TrashIcon size={15} />
                </button>
              </div>
            );
          })}
        </Card>
      )}
    </>
  );
}
