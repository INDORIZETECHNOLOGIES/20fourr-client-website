"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SubPage } from "@/components/dashboard/SubPage";
import { Card } from "@/components/dashboard/primitives";
import { AlertCircleIcon, CheckCircleFill, ShieldFill } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { serviceLabel } from "@/lib/api/adapters";
import type { ApiBooking, DutyOtpResponse, DutyStatusResponse } from "@/lib/api/types";

/**
 * Duty start and end OTP — how a shift is actually verified on site.
 *
 * The client generates a code and reads it to the guard; the guard enters it in
 * the provider app. Verification is `restrictTo('provider')`, so this screen
 * only ever calls the two `generate-*` endpoints.
 *
 * Order is enforced by the API and mirrored here: a start code requires
 * `payment_done`, an end code requires `duty_started`. The codes are NOT stored
 * — they are returned once, held in memory, and lost on reload, which is why
 * regenerating is a first-class action rather than an error path.
 *
 * The security warning is the point of the screen, not decoration. A start OTP
 * shared before the guard is physically present lets duty be marked started
 * with nobody on site; an end OTP shared early closes a shift that is still
 * running. Both are how this system gets defrauded.
 */

type Stage = "start" | "end";

export function DutyOtp({ bookingId }: { bookingId: string }) {
  const { data: bookingData, loading: bookingLoading } = useApiQuery<{
    booking: ApiBooking;
  }>(`bookings/${bookingId}`);

  const { data: status, loading: statusLoading, refetch: refetchStatus } =
    useApiQuery<DutyStatusResponse>(`duty/${bookingId}/status`);

  const [otp, setOtp] = useState<string | null>(null);
  const [otpStage, setOtpStage] = useState<Stage | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const booking = bookingData?.booking;
  const session = status?.dutySession;

  const dutyStarted = Boolean(session?.startOtpVerified);
  const dutyEnded = Boolean(session?.endOtpVerified);
  const stage: Stage = dutyStarted ? "end" : "start";

  // Tick from the absolute expiry rather than decrementing a counter, so a
  // backgrounded tab that wakes up shows the true remaining time.
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRemaining(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const generate = useCallback(
    async (which: Stage) => {
      setBusy(true);
      setError(null);
      try {
        const res = await api<DutyOtpResponse>(
          `duty/${bookingId}/generate-${which}-otp`,
          { method: "POST" },
        );
        setOtp(res.otp);
        setOtpStage(which);
        setExpiresAt(Date.now() + (res.expiresIn ?? 1800) * 1000);
        refetchStatus();
      } catch (cause) {
        setError(errorMessage(cause));
      } finally {
        setBusy(false);
      }
    },
    [bookingId, refetchStatus],
  );

  const loading = bookingLoading || statusLoading;

  if (loading) {
    return (
      <Shell bookingId={bookingId} booking={booking}>
        <div className="h-[380px] animate-pulse rounded-lg bg-panel" />
      </Shell>
    );
  }

  // Before payment there is no duty to verify, and the API returns 400.
  if (booking && booking.status === "pending") {
    return (
      <Shell bookingId={bookingId} booking={booking}>
        <Card className="px-6 py-12 text-center">
          <p className="text-body text-fg-mid">
            Duty codes appear once the booking is paid.
          </p>
          <p className="mx-auto mt-2 max-w-[420px] text-body-sm leading-relaxed text-fg-faint">
            The provider needs to accept the request first, then you complete payment.
          </p>
        </Card>
      </Shell>
    );
  }

  if (dutyEnded) {
    return (
      <Shell bookingId={bookingId} booking={booking}>
        <Card className="px-6 py-12 text-center">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-panel-raised text-live">
            <CheckCircleFill size={28} />
          </span>
          <p className="text-body font-semibold text-fg">Duty complete</p>
          <p className="mx-auto mt-2 max-w-[420px] text-body-sm leading-relaxed text-fg-faint">
            Both codes have been verified. Nothing further is needed here.
          </p>
          <Link
            href={`/dashboard/bookings/${bookingId}/rate`}
            className="mt-5 inline-block rounded-sm bg-brand text-brand-ink px-7 py-2.5 text-body font-semibold"
          >
            Rate the provider
          </Link>
        </Card>
      </Shell>
    );
  }

  const expired = otp !== null && remaining <= 0;
  const showingCurrentStage = otpStage === stage;

  return (
    <Shell bookingId={bookingId} booking={booking}>
      {/* Where we are in the shift */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Step done label="Paid" />
        <Step done={dutyStarted} label="Duty started" current={!dutyStarted} />
        <Step done={dutyEnded} label="Duty ended" current={dutyStarted && !dutyEnded} />
      </div>

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-fault bg-transparent px-4 py-3 text-body text-fault"
        >
          {error}
        </p>
      ) : null}

      <Card className="p-6 text-center sm:p-8">
        <p className="text-label font-semibold uppercase tracking-[1.2px] text-fg-faint">
          {stage === "start" ? "Start-of-duty code" : "End-of-duty code"}
        </p>
        <p className="mx-auto mt-2 max-w-[460px] text-body-sm leading-relaxed text-fg-faint">
          {stage === "start"
            ? "Read this to the guard in person once they are physically at the site. Nothing is texted. They enter it to begin the shift."
            : "Read this to the guard in person only when the shift is genuinely finished. Nothing is texted. It closes the booking."}
        </p>

        {otp && showingCurrentStage ? (
          <>
            <p
              className={[
                "mt-6 font-mono text-h1 font-semibold tracking-[0.32em] sm:text-h1",
                expired ? "text-fg-faint line-through" : "text-fg",
              ].join(" ")}
            >
              {otp}
            </p>
            <p
              aria-live="polite"
              className={[
                "mt-1 text-body-sm font-semibold",
                expired ? "text-fault" : "text-fg-mid",
              ].join(" ")}
            >
              {expired ? "Expired — generate a new one" : `Expires in ${formatCountdown(remaining)}`}
            </p>
          </>
        ) : (
          <p className="mt-6 font-mono text-h1 font-semibold tracking-[0.32em] text-fg-faint sm:text-h1">
            ••••••
          </p>
        )}

        <button
          type="button"
          onClick={() => generate(stage)}
          disabled={busy}
          className="mt-6 rounded-sm bg-brand text-brand-ink px-8 py-3 text-body font-semibold transition-opacity   disabled:opacity-60"
        >
          {busy
            ? "Generating…"
            : otp && showingCurrentStage
              ? "Generate a new code"
              : stage === "start"
                ? "Show start code"
                : "Show end code"}
        </button>

        <p className="mt-4 flex items-center justify-center gap-2 text-body-sm font-semibold text-attention">
          <AlertCircleIcon size={15} />
          {stage === "start"
            ? "Don't share this until the guard is at the site"
            : "Don't share this until the shift has actually ended"}
        </p>
      </Card>

      <Card className="mt-4 p-5">
        <p className="flex items-center gap-2 text-body-sm font-semibold text-fg-mid">
          <span className="text-fg">
            <ShieldFill size={15} />
          </span>
          Why this matters
        </p>
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-body-sm leading-relaxed text-fg-faint">
          <li>
            Sharing the start code early lets duty be marked as started with nobody on
            site — and starts the clock on what you are paying for.
          </li>
          <li>
            Sharing the end code early closes a shift that is still running.
          </li>
          <li>20fourr will never ask you for either code over a call or in chat.</li>
          <li>
            Codes are shown once and not stored. Reloading this page clears the code —
            generate a fresh one, which is free and unlimited.
          </li>
        </ul>
      </Card>
    </Shell>
  );
}

function Shell({
  bookingId,
  booking,
  children,
}: {
  bookingId: string;
  booking?: ApiBooking;
  children: React.ReactNode;
}) {
  return (
    <SubPage
      title="Duty Verification"
      subtitle={
        booking ? `${serviceLabel(booking.serviceCategory)} · ${booking.bookingId}` : undefined
      }
      backHref={`/dashboard/bookings/${bookingId}`}
      backLabel="Booking"
      width={620}
    >
      {children}
    </SubPage>
  );
}

function Step({
  label,
  done,
  current,
}: {
  label: string;
  done?: boolean;
  current?: boolean;
}) {
  return (
    <span
      className={[
        "rounded-full px-3.5 py-1.5 text-body-sm font-semibold",
        done
          ? "bg-panel-raised text-live"
          : current
            ? "bg-panel-raised text-fg"
            : "bg-panel-raised text-fg-faint",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

/** "29:58" — mm:ss, because a 30-minute window in seconds is unreadable. */
function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
