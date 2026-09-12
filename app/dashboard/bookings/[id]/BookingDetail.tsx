"use client";

import Link from "next/link";
import { SubPage } from "@/components/dashboard/SubPage";
import { Card, StatusPill } from "@/components/dashboard/primitives";
import {
  CalendarIcon,
  ChatIcon,
  ClockIcon,
  InvoiceIcon,
  PinFill,
  ShieldFill,
  StarFill,
  UserIcon,
} from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import { adaptBooking, dutyStartsAt } from "@/lib/api/adapters";
import type { ApiBooking } from "@/lib/api/types";
import { PayNowButton } from "./PayNowButton";
import { CancelBookingButton } from "./CancelBookingButton";
import { SafetyActions } from "./SafetyActions";
import { RepeatBookingButton } from "./RepeatBookingButton";
import { KeyIcon } from "@/components/dashboard/icons";
import { DOCS_ALLOWED_STATUSES, INVOICE_STATUSES, PAID_STATUSES } from "@/lib/api/types";
import { ONGOING_STATUSES, statusStyle } from "@/lib/dashboard-data";
import { formatPaise } from "@/lib/money";
import { refundNotice } from "@/lib/cancellation-policy";
import { quoteFromBooking, quoteTotalPaise } from "@/lib/api/pricing";
import { QuoteBreakdown } from "@/app/book/PriceSummary";

/** Duty lifecycle, in order. Reached steps are derived from the current status. */
const TIMELINE = [
  { key: "pending", label: "Requested", body: "Sent to the provider" },
  { key: "provider_accepted", label: "Accepted", body: "Provider confirmed" },
  { key: "payment_done", label: "Paid", body: "Payment captured" },
  { key: "duty_started", label: "Duty started", body: "Start OTP verified on site" },
  { key: "duty_ended", label: "Duty ended", body: "End OTP verified" },
  { key: "completed", label: "Completed", body: "Booking closed" },
] as const;

const ORDER: Record<string, number> = {
  pending: 0,
  provider_accepted: 1,
  payment_pending: 1,
  payment_done: 2,
  duty_started: 3,
  duty_ended: 4,
  completed: 5,
  disputed: 4,
  cancelled: -1,
  provider_rejected: -1,
};

export function BookingDetail({ id }: { id: string }) {
  // Keyed by Mongo _id — /bookings/:bookingId resolves with findById, so the
  // human "BK-2847" reference will not work here.
  const { data, loading, error, refetch } = useApiQuery<{ booking: ApiBooking }>(
    `bookings/${id}`,
  );
  // Unread badge on the chat action, the way the app shows it.
  const { data: unreadData } = useApiQuery<{ unreadCount: number }>("chat/unread", {
    query: { bookingId: id },
  });
  const unread = unreadData?.unreadCount ?? 0;

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[180px] animate-pulse rounded-lg border border-hairline bg-panel"
          />
        ))}
      </div>
    );
  }

  if (error || !data?.booking) {
    return (
      <div className="rounded-lg border border-fault bg-transparent px-6 py-12 text-center">
        <p role="alert" className="text-body text-fault">
          {error ?? "This booking could not be found."}
        </p>
        <Link
          href="/dashboard/bookings"
          className="mt-4 inline-block rounded-sm border border-edge px-6 py-2.5 text-body font-medium text-fg"
        >
          Back to bookings
        </Link>
      </div>
    );
  }

  const bk = adaptBooking(data.booking);
  const quote = quoteFromBooking(data.booking);
  const style = statusStyle(bk.status);
  const reached = ORDER[bk.status] ?? -1;
  const terminated = bk.status === "cancelled" || bk.status === "provider_rejected";

  const cancellation = data.booking.cancellation;
  const refundAmountPaise = cancellation?.refundAmount ?? 0;
  const refund =
    refundAmountPaise > 0
      ? refundNotice(
          // A v1 booking has no refundState; map its coarse status onto the
          // same vocabulary so one component serves both engines.
          cancellation?.refundState ??
            (cancellation?.refundStatus === "processed"
              ? "settled"
              : cancellation?.refundStatus === "failed"
                ? "failed"
                : cancellation?.refundStatus === "pending"
                  ? "pending"
                  : null),
          formatPaise(refundAmountPaise),
          data.booking.billingEngine === "v6" ? "v6" : "v1",
          cancellation?.refundSettledAt,
        )
      : null;
  const live = bk.status === "duty_started";
  const ongoing = ONGOING_STATUSES.includes(bk.status);

  return (
    <SubPage
      title={bk.service}
      subtitle={`${bk.ref ?? bk.id} · ${bk.date}`}
      backHref="/dashboard/bookings"
      backLabel="Bookings"
    >
      {/* Status hero — the app tints this band by status. */}
      <div className={`rounded-lg border p-6 ${style.className}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-eyebrow text-fg-faint">
              {live ? (
                <span className="animate-pulse-dot inline-block h-2 w-2 rounded-full bg-live" />
              ) : null}
              Status
            </p>
            <p className="mt-1.5 text-h2 text-fg">{style.label}</p>
          </div>
          <div className="min-w-[220px] text-left sm:text-right">
            <p className="mb-2 text-eyebrow font-semibold uppercase tracking-[1.2px] text-fg-faint">
              Amount
            </p>
            {quote ? (
              <QuoteBreakdown quote={quote} compact className="sm:ml-auto sm:max-w-[280px]" />
            ) : (
              <p className="text-mono-lg tabular-nums text-fg">{formatPaise(bk.amountPaise)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Refund state on a cancelled booking (SecureConnect spec 0009). Shown
          only once a refund exists — a <12h cancellation owes nothing and gets
          no block rather than a "₹0 refund" line. */}
      {refund ? (
        <div
          className={`mt-4 rounded-lg border p-4 ${
            refund.tone === "done"
              ? "border-live"
              : refund.tone === "attention"
                ? "border-attention"
                : "border-hairline"
          }`}
        >
          <p className="text-eyebrow font-semibold uppercase tracking-[1.2px] text-fg-faint">
            Refund
          </p>
          <p className="mt-1.5 text-body text-fg">{refund.text}</p>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h3 className="mb-4 font-sans text-body font-semibold text-fg">
              Details
            </h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Detail icon={<CalendarIcon size={14} />} label="Date" value={bk.date} />
              <Detail icon={<ClockIcon size={14} />} label="Start time" value={bk.time} />
              <Detail icon={<PinFill size={14} />} label="Location" value={bk.location} />
              <Detail icon={<UserIcon size={14} />} label="Provider" value={bk.guard} />
            </dl>
          </Card>

          <Card className="p-5">
            <h3 className="mb-5 font-sans text-body font-semibold text-fg">
              Timeline
            </h3>

            {terminated ? (
              <p className="text-body text-fg-faint">
                This booking was {style.label.toLowerCase()}. No duty took place.
              </p>
            ) : (
              <ol className="flex flex-col gap-0">
                {TIMELINE.map((step, i) => {
                  const done = i <= reached;
                  const current = i === reached;
                  return (
                    <li key={step.key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span
                          className={[
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-eyebrow font-semibold",
                            current
                              ? "border border-brand text-brand"
                              : done
                                ? "border border-hairline bg-panel-raised text-fg"
                                : "border border-hairline bg-page text-fg-faint",
                          ].join(" ")}
                        >
                          {i + 1}
                        </span>
                        {i < TIMELINE.length - 1 ? (
                          <span
                            className={[
                              "w-px flex-1",
                              i < reached ? "bg-edge" : "bg-hairline",
                            ].join(" ")}
                          />
                        ) : null}
                      </div>
                      <div className={i < TIMELINE.length - 1 ? "pb-6" : ""}>
                        <p
                          className={[
                            "text-body font-semibold",
                            done ? "text-fg" : "text-fg-faint",
                          ].join(" ")}
                        >
                          {step.label}
                          {current ? (
                            <span className="ml-2 text-label font-semibold text-brand">
                              current
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-body-sm text-fg-faint">{step.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>

        <aside className="flex h-fit flex-col gap-3">
          {/* Both statuses can pay: `provider_accepted` is the first moment the
              API will open an order, and `payment_pending` is a previous
              attempt that didn't complete. */}
          {/* The main thing a client does on the day. Available from payment
              until duty ends — the screen itself decides start vs end code. */}
          {["payment_done", "duty_started"].includes(bk.status) ? (
            <ActionLink
              icon={<KeyIcon size={16} />}
              label={bk.status === "duty_started" ? "Share end code" : "Share start code"}
              href={`/dashboard/bookings/${id}/duty`}
              tone="warning"
            />
          ) : null}

          {bk.status === "provider_accepted" || bk.status === "payment_pending" ? (
            <PayNowButton
              bookingId={data.booking._id}
              amountPaise={bk.amountPaise}
              billingEngine={data.booking.billingEngine}
              onPaid={refetch}
            />
          ) : null}

          {bk.awaitingRating ? (
            <Link
              href={`/dashboard/bookings/${bk.id}/rate`}
              className="flex items-center justify-center gap-2 rounded-sm bg-brand text-brand-ink px-6 py-3 text-body font-semibold"
            >
              <StarFill size={15} />
              Rate provider
            </Link>
          ) : null}

          <ActionLink
            icon={<ChatIcon size={16} />}
            label={
              unread > 0 ? `Message provider (${unread})` : "Message provider"
            }
            href={`/dashboard/bookings/${id}/chat`}
          />
          {DOCS_ALLOWED_STATUSES.includes(bk.status) ? (
            <ActionLink
              icon={<ShieldFill size={16} />}
              label="Provider documents"
              href={`/dashboard/bookings/${id}/documents`}
            />
          ) : (
            <ActionLink
              icon={<ShieldFill size={16} />}
              label="Provider documents"
              pending
            />
          )}
          {/* An invoice only exists from payment_done onward; before that the
              API returns 400. Offering it earlier would be a dead click. */}
          {INVOICE_STATUSES.includes(bk.status) ? (
            <ActionLink
              icon={<InvoiceIcon size={16} />}
              label="View invoice"
              href={`/dashboard/bookings/${id}/invoice`}
            />
          ) : (
            <ActionLink
              icon={<InvoiceIcon size={16} />}
              label="View invoice"
              pending
            />
          )}

          {ongoing ? (
            <CancelBookingButton
              bookingId={data.booking._id}
              onCancelled={refetch}
              totalPaise={quote ? quoteTotalPaise(quote) : data.booking.totalAmount}
              dutyStartsAt={dutyStartsAt(data.booking)}
              paid={PAID_STATUSES.includes(data.booking.status)}
              engine={data.booking.billingEngine === "v6" ? "v6" : "v1"}
            />
          ) : null}

          <RepeatBookingButton booking={data.booking} />

          <SafetyActions
            bookingId={data.booking._id}
            status={bk.status}
            onChanged={refetch}
          />
        </aside>
      </div>
    </SubPage>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-eyebrow font-semibold uppercase tracking-[1px] text-fg-faint">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-body text-fg">{value}</dd>
    </div>
  );
}

function ActionLink({
  icon,
  label,
  href,
  tone,
  pending,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  tone?: "warning" | "danger";
  /**
   * Not wired to an endpoint yet. Renders disabled and says so, because an
   * enabled-looking control that does nothing reads as a broken app — and on
   * this screen one of them was "Cancel booking".
   */
  pending?: boolean;
}) {
  const cls = [
    "flex items-center gap-3 rounded-lg border px-4 py-3 text-body font-semibold transition-colors",
    pending
      ? "cursor-not-allowed border-hairline text-fg-faint"
      : tone === "danger"
        ? "border-fault text-fault hover:bg-panel-raised"
        : tone === "warning"
          ? "border-attention text-attention hover:bg-transparent"
          : "border-hairline text-fg-mid hover:bg-panel-raised",
  ].join(" ");

  if (pending) {
    return (
      <button type="button" disabled className={cls} title="Not available yet">
        {icon}
        <span className="flex-1 text-left">{label}</span>
        <span className="text-eyebrow font-normal text-fg-faint">Soon</span>
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} className={cls}>
        {icon}
        {label}
      </Link>
    );
  }
  return (
    <button type="button" className={cls}>
      {icon}
      {label}
    </button>
  );
}
