"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "../BookingContext";
import { StepFooter, StepHeading } from "../BookingShell";
import { CheckCircleFill, StarFill } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import type { ApiProviderCard, ProviderSearchResponse } from "@/lib/api/types";
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
 */
function ProviderDetail({
  providerId,
  card,
}: {
  providerId: string;
  card: ApiProviderCard;
}) {
  const { data, loading, error } = useApiQuery<Record<string, unknown>>(
    `client/providers/${providerId}`,
  );

  const profile = (data?.provider ?? data) as
    | {
        businessName?: string;
        description?: string;
        yearsExperience?: number;
        serviceCategories?: string[];
        languages?: string[];
        psaraLicense?: { licenseNumber?: string; verified?: boolean } | null;
        trustBadges?: string[];
      }
    | undefined;

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
    <div className="mt-4 grid grid-cols-1 gap-4 pb-2 sm:grid-cols-2">
      <div>
        <Label>About</Label>
        <p className="text-[13.5px] leading-relaxed text-slate-400">
          {profile?.description || "This provider hasn't added a description yet."}
        </p>
        {profile?.yearsExperience ? (
          <p className="mt-2 text-[13px] text-slate-500">
            {profile.yearsExperience} years experience
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

        {(card.trustBadges ?? profile?.trustBadges ?? []).length > 0 ? (
          <div>
            <Label>Trust badges</Label>
            <div className="flex flex-wrap gap-1.5">
              {(card.trustBadges ?? profile?.trustBadges ?? []).map((b) => (
                <span
                  key={b}
                  className="rounded-full bg-green-500/12 px-2.5 py-1 text-[12px] text-green-400"
                >
                  {b.replace(/_/g, " ")}
                </span>
              ))}
            </div>
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
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[1px] text-slate-600">
      {children}
    </p>
  );
}
