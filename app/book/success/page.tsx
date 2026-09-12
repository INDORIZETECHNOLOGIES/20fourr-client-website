"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircleFill, ShieldFill } from "@/components/dashboard/icons";
import { Notice } from "@/components/ui/Notice";
import { useBooking } from "../BookingContext";

/**
 * Request sent — not "booked, paid and done".
 *
 * This screen used to show a duty start OTP (a hardcoded "418702"). That was
 * wrong twice over: the booking is `pending` at this point, and duty OTPs are
 * issued by the API when duty actually starts, not at request time. Showing a
 * fabricated code would have had clients reading it out to a guard on site.
 */
export default function BookingSuccessPage() {
  const { reset } = useBooking();
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    setBookingId(new URLSearchParams(window.location.search).get("id"));
    // Cleared here rather than on the confirm step: dropping furthestStep to 0
    // while still on a gated route lets the shell's guard bounce the user back
    // to step 1. This route short-circuits that guard.
    reset();
  }, [reset]);

  return (
    <div className="mx-auto max-w-[620px] text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-panel-raised text-live">
        <CheckCircleFill size={40} />
      </div>

      <h1 className="mt-6 font-sans text-h2 font-semibold tracking-[-0.5px] text-fg">
        Request sent
      </h1>
      <p className="mt-2.5 text-body leading-relaxed text-fg-faint">
        Your booking request is with the provider. You&apos;ll be notified as soon as
        they accept.
      </p>

      <div className="mt-7 text-left">
        <Notice>
          <strong className="text-fg">Nothing has been charged.</strong> Payment
          opens once the provider accepts — the booking will show{" "}
          <span className="font-medium text-fg">Pay now</span> and you can settle
          it from Bookings. If nobody accepts, you are not charged at all.
        </Notice>
      </div>

      <div className="mt-6 rounded-lg border border-hairline bg-panel p-5 text-left">
        <p className="flex items-center gap-2 text-body-sm font-semibold text-fg-mid">
          <span className="text-fg">
            <ShieldFill size={15} />
          </span>
          What happens next
        </p>
        <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-body-sm leading-relaxed text-fg-faint">
          <li>The provider reviews and accepts the request.</li>
          <li>You pay, and the booking is confirmed.</li>
          <li>
            On the day, you share a start OTP with the guard on site — issued then, not
            now.
          </li>
        </ol>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href={bookingId ? `/dashboard/bookings/${bookingId}` : "/dashboard/bookings"}
          className="rounded-sm bg-brand text-brand-ink px-7 py-3 text-body font-semibold"
        >
          View booking
        </Link>
        <Link
          href="/dashboard"
          className="rounded-sm border border-hairline px-7 py-3 text-body font-semibold text-fg-mid transition-colors hover:bg-panel-raised"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
