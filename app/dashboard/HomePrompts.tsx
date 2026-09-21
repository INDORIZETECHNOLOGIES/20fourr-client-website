"use client";

import Link from "next/link";
import { PinFill, StarFill } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import type { ApiClientProfile, RatingRequiredResponse } from "@/lib/api/types";

/**
 * The two nudges the app's home screen carries: rate a finished booking, and
 * finish your profile.
 *
 * A NOTE ON THE RATING FIELDS. The app reads `data.bookings` and
 * `data.total ?? data.count` from `/client/rating-required`. The endpoint
 * returns none of those — it returns `ratingRequired`, `pendingBookingCount`
 * and `pendingBookingIds` (client.controller.ts → checkRatingRequired), so the
 * app's "To Rate" tile reads 0 forever and its prompt never appears. The real
 * field names are used here, which means this surface will show pending ratings
 * the app currently hides. That is the endpoint working as written.
 *
 * Neither prompt blocks anything. The API does not refuse new bookings over an
 * unrated one, so making the website refuse would invent a rule.
 */
export function HomePrompts() {
  const { data: rating } = useApiQuery<RatingRequiredResponse>("client/rating-required");
  const { data: profileData } = useApiQuery<{ profile: ApiClientProfile }>("client/profile");

  const pending = rating?.pendingBookingCount ?? 0;
  const firstUnrated = rating?.pendingBookingIds?.[0];

  // Mirrors the API's requireClientProfileComplete: a booking is accepted with
  // either a primary address that has a city or at least one saved address.
  // Checking only the primary one kept this banner up for people who had added
  // an address under Saved addresses.
  const address = profileData?.profile?.address;
  const hasSavedAddress = (profileData?.profile?.savedAddresses?.length ?? 0) > 0;
  const needsAddress = Boolean(profileData) && !address?.city && !hasSavedAddress;

  if (!pending && !needsAddress) return null;

  return (
    <div className="mb-[22px] flex flex-col gap-3">
      {pending > 0 && firstUnrated ? (
        <Prompt
          href={`/dashboard/bookings/${firstUnrated}/rate`}
          icon={<StarFill size={17} />}
          tint="bg-panel-raised text-fg"
          title={`Rate ${pending} completed ${pending === 1 ? "booking" : "bookings"}`}
          body="Your rating is what keeps good providers visible to other clients."
          cta="Rate now"
        />
      ) : null}

      {needsAddress ? (
        <Prompt
          href="/dashboard/profile/addresses"
          icon={<PinFill size={17} />}
          tint="bg-panel-raised text-fg-mid"
          title="Add your address"
          body="Bookings need a service address. Saving one now means you won't be asked mid-booking."
          cta="Add address"
        />
      ) : null}
    </div>
  );
}

function Prompt({
  href,
  icon,
  tint,
  title,
  body,
  cta,
}: {
  href: string;
  icon: React.ReactNode;
  tint: string;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-wrap items-center gap-4 rounded-lg border border-hairline bg-panel px-5 py-4 transition-colors hover:border-edge"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tint}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold text-fg">{title}</p>
        <p className="mt-0.5 text-body-sm leading-relaxed text-fg-faint">{body}</p>
      </div>
      <span className="shrink-0 rounded-sm border border-edge px-4 py-1.5 text-body-sm font-medium text-fg">
        {cta}
      </span>
    </Link>
  );
}
