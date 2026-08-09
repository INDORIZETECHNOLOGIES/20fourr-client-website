"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "../BookingContext";
import { StepFooter, StepHeading } from "../BookingShell";
import { CheckCircleFill, StarFill } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import type {
  ApiProviderCard,
  ProviderProfileResponse,
  ProviderSearchResponse,
  RatingListResponse,
} from "@/lib/api/types";
import { TRUST_BADGE_LABELS } from "@/lib/api/types";
import { relativeTime } from "@/lib/api/adapters";
import { formatPaiseRounded } from "@/lib/money";

/** Mirrors ALLOWED_SORTS on the discovery service. */
const SORTS = [
  { id: "relevance", label: "Best match" },
  { id: "rating", label: "Top rated" },
  { id: "price", label: "Lowest price" },
  { id: "experience", label: "Most experienced" },
] as const;

export default function ProviderStep() {
  const { draft, update } = useBooking();
  const router = useRouter();
  const [sortBy, setSortBy] = useState<string>("relevance");
  const [hourlyOnly, setHourlyOnly] = useState(false);

  /**
   * `ignoreCity` drops the city filter after it has been shown to return
   * nothing.
   *
   * The API matches city against a derived `serviceCitiesNorm` array which is
   * empty on the current provider records, so *every* city returns zero while
   * the unfiltered search returns dozens. Rather than dead-ending the funnel on
   * a server-side data gap, the widened search is offered explicitly — never
   * applied silently, because a client who asked for Pune must not be shown
   * Chennai providers without being told.
   */
  const [ignoreCity, setIgnoreCity] = useState(false);
  const cityApplied = Boolean(draft.city) && !ignoreCity;

  const { data, loading, error, refetch } = useApiQuery<ProviderSearchResponse>(
    "client/providers/search",
    {
      query: {
        limit: 12,
        sortBy,
        // The API rejects anything outside its four-value enum, so an unset
        // category is omitted rather than sent as an empty string.
        ...(draft.serviceCategory ? { category: draft.serviceCategory } : {}),
        ...(cityApplied ? { city: draft.city } : {}),
        ...(hourlyOnly ? { hourlyEnabled: true } : {}),
        ...(draft.exServicemanOnly ? { exServiceman: true } : {}),
      },
      enabled: Boolean(draft.serviceCategory),
    },
  );

  const providers = data?.providers ?? [];

  return (
    <>
      <StepHeading
        title="Choose a provider"
        subtitle={[draft.serviceName, draft.city].filter(Boolean).join(" · ")}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={sortBy === s.id}
            onClick={() => setSortBy(s.id)}
            className={[
              "rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors",
              sortBy === s.id
                ? "border-app-gold bg-app-gold/12 text-app-gold"
                : "border-app-border text-slate-400 hover:border-app-gold/40",
            ].join(" ")}
          >
            {s.label}
          </button>
        ))}

        <label className="ml-auto flex cursor-pointer items-center gap-2 text-[13px] text-slate-400">
          <input
            type="checkbox"
            checked={hourlyOnly}
            onChange={(e) => setHourlyOnly(e.target.checked)}
            className="h-4 w-4 accent-app-gold"
          />
          Hourly booking available
        </label>
      </div>

      {!cityApplied && draft.city ? (
        <p className="mb-5 rounded-xl border border-app-gold/30 bg-app-gold/8 px-4 py-3 text-[13.5px] text-app-gold">
          Showing providers from all cities — none matched {draft.city}. Confirm coverage
          with the provider before booking.{" "}
          <button
            type="button"
            onClick={() => setIgnoreCity(false)}
            className="font-semibold underline"
          >
            Back to {draft.city} only
          </button>
        </p>
      ) : null}

      {draft.exServicemanOnly ? (
        <p className="mb-5 rounded-xl border border-violet-400/30 bg-violet-400/8 px-4 py-3 text-[13.5px] text-violet-300">
          Showing only providers with a verified ex-serviceman certificate.{" "}
          <button
            type="button"
            onClick={() => update({ exServicemanOnly: false })}
            className="font-semibold underline"
          >
            Remove filter
          </button>
        </p>
      ) : null}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[124px] animate-pulse rounded-2xl border border-app-border bg-app-card"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/8 px-6 py-10 text-center">
          <p role="alert" className="text-[15px] text-red-300">
            {error}
          </p>
          <button
            type="button"
            onClick={refetch}
            className="mt-4 rounded-full border border-app-gold px-6 py-2.5 text-[14px] font-bold text-app-gold"
          >
            Try again
          </button>
        </div>
      ) : providers.length === 0 ? (
        <div className="rounded-2xl border border-app-border bg-app-card px-6 py-12 text-center">
          <p className="text-[15px] text-slate-300">
            No {draft.serviceName?.toLowerCase() ?? "providers"} available
            {cityApplied ? ` in ${draft.city}` : ""} with these filters.
          </p>
          <p className="mt-2 text-[13.5px] text-slate-500">
            {cityApplied
              ? "Search every city instead, or change the filters."
              : "Try another sort, or turn off the hourly and ex-serviceman filters."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {cityApplied ? (
              <button
                type="button"
                onClick={() => setIgnoreCity(true)}
                className="rounded-full bg-app-gold-gradient px-6 py-2.5 text-[14px] font-bold text-black"
              >
                Search all cities
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => router.push("/book/service")}
              className="rounded-full border border-app-gold px-6 py-2.5 text-[14px] font-bold text-app-gold"
            >
              Change service or city
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {providers.map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              selected={draft.providerId === p.id}
              onSelect={() =>
                update({
                  providerId: p.id,
                  providerName: p.businessName || p.user?.fullName || "Provider",
                  providerMinimumHours: p.pricing?.minimumHours ?? null,
                })
              }
            />
          ))}

          {data?.pagination && data.pagination.pages > 1 ? (
            <p className="mt-1 text-center text-[12.5px] text-slate-600">
              Showing {providers.length} of {data.pagination.total} providers
            </p>
          ) : null}
        </div>
      )}

      <StepFooter
        disabled={!draft.providerId}
        hint={draft.providerId ? undefined : "Select a provider to continue."}
        onContinue={() => router.push("/book/purpose")}
      />
    </>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function ProviderCard({
  provider,
  selected,
  onSelect,
}: {
  provider: ApiProviderCard;
  selected: boolean;
  onSelect: () => void;
}) {
  const [open, setOpen] = useState(false);
  const name = provider.businessName || provider.user?.fullName || "Security provider";
  const hourly = provider.pricing?.hourlyRate ?? null;
  const daily = provider.pricing?.dailyRate ?? null;

  return (
    <div
      className={[
        "rounded-2xl border transition-colors",
        selected ? "border-app-gold bg-app-gold/6" : "border-app-border bg-app-card",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-app-gold-gradient text-[18px] font-extrabold text-black">
          {initialsOf(name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[16px] font-bold text-slate-100">{name}</span>
            {provider.isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[11.5px] font-bold text-green-500">
                <CheckCircleFill size={12} />
                Verified
              </span>
            ) : null}
            {provider.verificationTier && provider.verificationTier !== "none" ? (
              <span className="rounded-full bg-app-gold/15 px-2 py-0.5 text-[11.5px] font-bold capitalize text-app-gold">
                {provider.verificationTier}
              </span>
            ) : null}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate-500">
            {provider.averageRating ? (
              <span className="flex items-center gap-1 text-app-gold">
                <StarFill size={13} />
                {provider.averageRating.toFixed(1)}{" "}
                <span className="text-slate-500">({provider.totalRatings ?? 0})</span>
              </span>
            ) : (
              <span className="text-slate-600">No ratings yet</span>
            )}
            {provider.serviceCity ? <span>{provider.serviceCity}</span> : null}
            {provider.isHourlyAvailable ? <span>Hourly available</span> : null}
            {provider.offersVehicle ? <span>Vehicle</span> : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <span className="text-[15px] font-bold text-app-gold">
            {/* "From" — the discovery service returns the minimum across all of
                this provider's priced categories, not the rate for the one
                being searched. The exact figure comes from the price preview. */}
            {hourly
              ? `From ${formatPaiseRounded(hourly)}/hr`
              : daily
                ? `From ${formatPaiseRounded(daily)}/day`
                : "Rates on request"}
          </span>
          <button
            type="button"
            onClick={onSelect}
            className={[
              "rounded-full px-5 py-2.5 text-[13.5px] font-bold transition-colors",
              selected
                ? "bg-app-gold text-black"
                : "border border-app-gold/40 text-app-gold hover:bg-app-gold/10",
            ].join(" ")}
          >
            {selected ? "Selected" : "Select"}
          </button>
        </div>
      </div>

      <div className="border-t border-white/6 px-5 py-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="text-[13px] font-semibold text-slate-400 hover:text-slate-200"
        >
          {open ? "Hide details" : "View details"}
        </button>

        {open ? <ProviderDetail providerId={provider.id} card={provider} /> : null}
      </div>
    </div>
  );
}

/**
 * The detail panel is fetched on demand rather than with the list — the search
 * response is a deliberately masked summary, and pulling full profiles for
 * twelve cards to show one would be wasteful.
 *
 * The card and the profile disagree on shape in one place worth knowing: the
 * card's `pricing` is a single flattened "from" rate across all categories,
 * while the profile's is an array of per-category rates. The per-category rates
 * are what actually gets charged, so they win here.
 */
function ProviderDetail({
  providerId,
  card,
}: {
  providerId: string;
  card: ApiProviderCard;
}) {
  const { data, loading, error } = useApiQuery<ProviderProfileResponse>(
    `client/providers/${providerId}`,
  );
  // Only reviews written by clients — a provider's ratings *of* clients are on
  // the same endpoint and would otherwise be mixed in.
  const { data: reviewData } = useApiQuery<RatingListResponse>(
    `ratings/user/${providerId}`,
    { query: { role: "client", limit: 5 } },
  );

  const profile = data?.provider;
  const reviews = reviewData?.ratings ?? [];
  const badges = profile?.trustBadges ?? card.trustBadges ?? [];

  if (loading) {
    return <div className="mt-4 h-24 animate-pulse rounded-xl bg-white/4" />;
  }

  if (error) {
    return (
      <p role="alert" className="mt-4 text-[13px] text-red-300">
        {error}
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-5 pb-2">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label>About</Label>
          <p className="text-[13.5px] leading-relaxed text-slate-400">
            {profile?.description || "This provider hasn't added a description yet."}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-slate-500">
            {profile?.yearsExperience ? (
              <span>{profile.yearsExperience} years experience</span>
            ) : null}
            {profile?.completedBookings ? (
              <span>{profile.completedBookings} bookings completed</span>
            ) : null}
            {profile?.responseTime ? <span>Responds {profile.responseTime}</span> : null}
            {profile?.numberOfPersonnel ? (
              <span>{profile.numberOfPersonnel} personnel</span>
            ) : null}
          </div>

          {/* Service record — only individuals carry these. */}
          {profile?.isExServiceman || profile?.isPoliceVeteran ? (
            <p className="mt-3 text-[13px] text-slate-400">
              {profile.isPoliceVeteran ? "Police veteran" : "Ex-serviceman"}
              {profile.rankAtRetirement ? ` · ${profile.rankAtRetirement}` : ""}
              {profile.regiment ? ` · ${profile.regiment}` : ""}
              {profile.previousOrganization ? ` · ${profile.previousOrganization}` : ""}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <Label>Services offered</Label>
            <div className="flex flex-wrap gap-1.5">
              {(profile?.serviceCategories ?? card.serviceCategories ?? []).map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-white/6 px-2.5 py-1 text-[12px] capitalize text-slate-300"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {badges.length > 0 ? (
            <div>
              <Label>Trust badges</Label>
              <div className="flex flex-wrap gap-1.5">
                {badges.map((b) => (
                  <span
                    key={b}
                    className="rounded-full bg-green-500/12 px-2.5 py-1 text-[12px] text-green-400"
                  >
                    {TRUST_BADGE_LABELS[b] ?? b.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {profile?.specializations?.length ? (
            <div>
              <Label>Specialisations</Label>
              <p className="text-[13.5px] text-slate-400">
                {profile.specializations.join(" · ")}
              </p>
            </div>
          ) : null}

          {profile?.languages?.length ? (
            <div>
              <Label>Languages</Label>
              <p className="text-[13.5px] text-slate-400">{profile.languages.join(" · ")}</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Per-category rates — the exact figure still comes from the price
          preview, which applies GST, the platform fee and any vehicle option. */}
      {profile?.pricing?.length ? (
        <div>
          <Label>Rates</Label>
          <div className="flex flex-col gap-1.5">
            {profile.pricing.map((rate) => (
              <div
                key={rate.category}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-white/6 bg-white/3 px-3 py-2"
              >
                <span className="text-[13px] font-semibold capitalize text-slate-200">
                  {rate.category}
                </span>
                <span className="text-[13px] text-slate-400">
                  {rate.dailyRate ? `${formatPaiseRounded(rate.dailyRate)}/day` : null}
                  {rate.hourlyEnabled && rate.hourlyRate
                    ? ` · ${formatPaiseRounded(rate.hourlyRate)}/hr`
                    : null}
                  {rate.minimumHours ? ` · min ${rate.minimumHours}h` : null}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <Label>Reviews {profile?.rating?.count ? `(${profile.rating.count})` : ""}</Label>
        {reviews.length === 0 ? (
          <p className="text-[13px] text-slate-600">
            No written reviews yet for this provider.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {reviews.map((r) => (
              <div key={r._id} className="rounded-lg border border-white/6 bg-white/3 px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-[12.5px] font-bold text-app-gold">
                    <StarFill size={12} />
                    {r.rating.toFixed(1)}
                  </span>
                  <span className="text-[12.5px] text-slate-400">
                    {r.fromUserId?.name ?? "Client"}
                  </span>
                  {r.createdAt ? (
                    <span className="text-[12px] text-slate-600">
                      {relativeTime(r.createdAt)}
                    </span>
                  ) : null}
                </div>
                {r.review ? (
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-400">
                    {r.review}
                  </p>
                ) : null}
                {r.response?.message ? (
                  <p className="mt-2 border-l-2 border-app-gold/40 pl-3 text-[12.5px] leading-relaxed text-slate-500">
                    <strong className="text-slate-400">Provider replied:</strong>{" "}
                    {r.response.message}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[1px] text-slate-600">
      {children}
    </p>
  );
}
