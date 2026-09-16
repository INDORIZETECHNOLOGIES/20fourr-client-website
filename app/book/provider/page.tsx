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
import { maskPublicProvider } from "@/lib/provider-display";

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
   * `ignoreLocation` drops BOTH the city and the deployment-state filter after
   * they have been shown to return nothing.
   *
   * The API matches city against a derived `serviceCitiesNorm` array and state
   * against `serviceState`, both of which are empty on the current provider
   * records — so every location returns zero while the unfiltered search
   * returns dozens. Rather than dead-ending the funnel on a server-side data
   * gap, the widened search is offered explicitly, never applied silently: a
   * client who asked for Pune must not be shown Chennai providers unasked.
   *
   * The state filter is here because architecture v6.0 §W.2-17 requires the
   * provider list to be restricted to providers licensed for the deployment
   * state. Once `REQUIRE_PSARA_STATE_MATCH` is on, a provider outside it is
   * rejected at booking with SC_1414 — so widening is a real choice with a real
   * consequence, and the notice below says so.
   */
  const [ignoreLocation, setIgnoreLocation] = useState(false);
  const locationApplied = Boolean(draft.city) && !ignoreLocation;
  const stateApplied = Boolean(draft.deployment.stateName) && !ignoreLocation;

  const { data, loading, error, refetch } = useApiQuery<ProviderSearchResponse>(
    "client/providers/search",
    {
      query: {
        limit: 12,
        sortBy,
        // The API rejects anything outside its four-value enum, so an unset
        // category is omitted rather than sent as an empty string.
        ...(draft.serviceCategory ? { category: draft.serviceCategory } : {}),
        ...(locationApplied ? { city: draft.city } : {}),
        ...(stateApplied ? { state: draft.deployment.stateName } : {}),
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
        subtitle={[draft.serviceName, draft.city, draft.deployment.stateName]
          .filter(Boolean)
          .join(" · ")}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={sortBy === s.id}
            onClick={() => setSortBy(s.id)}
            className={[
              "rounded-sm border px-4 py-2 text-body-sm font-semibold transition-colors",
              sortBy === s.id
                ? "border-brand bg-panel-raised text-brand"
                : "border-hairline text-fg-mid hover:border-edge",
            ].join(" ")}
          >
            {s.label}
          </button>
        ))}

        <label className="ml-auto flex cursor-pointer items-center gap-2 text-body-sm text-fg-mid">
          <input
            type="checkbox"
            checked={hourlyOnly}
            onChange={(e) => setHourlyOnly(e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
          Hourly booking available
        </label>
      </div>

      {!locationApplied && draft.city ? (
        <p className="mb-5 rounded-lg border border-attention bg-panel-raised px-4 py-3 text-body-sm text-fg">
          Showing providers everywhere — none matched {draft.city}
          {draft.deployment.stateName ? `, ${draft.deployment.stateName}` : ""}. Confirm the
          provider is licensed to work in {draft.deployment.stateName || "your deployment state"}{" "}
          before booking.{" "}
          <button
            type="button"
            onClick={() => setIgnoreLocation(false)}
            className="font-semibold underline"
          >
            Back to {draft.city} only
          </button>
        </p>
      ) : null}

      {draft.exServicemanOnly ? (
        <p className="mb-5 rounded-lg border border-hairline bg-panel-raised px-4 py-3 text-body-sm text-fg-mid">
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
              className="h-[124px] animate-pulse rounded-lg border border-hairline bg-panel"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-fault bg-transparent px-6 py-10 text-center">
          <p role="alert" className="text-body text-fault">
            {error}
          </p>
          <button
            type="button"
            onClick={refetch}
            className="mt-4 rounded-sm border border-edge px-6 py-2.5 text-body font-medium text-fg"
          >
            Try again
          </button>
        </div>
      ) : providers.length === 0 ? (
        <div className="rounded-lg border border-hairline bg-panel px-6 py-12 text-center">
          <p className="text-body text-fg-mid">
            No {draft.serviceName?.toLowerCase() ?? "providers"} available
            {locationApplied ? ` in ${draft.city}` : ""} with these filters.
          </p>
          <p className="mt-2 text-body-sm text-fg-faint">
            {locationApplied
              ? "Search everywhere instead, or change the filters."
              : "Try another sort, or turn off the hourly and ex-serviceman filters."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {locationApplied ? (
              <button
                type="button"
                onClick={() => setIgnoreLocation(true)}
                className="rounded-sm bg-brand text-brand-ink px-6 py-2.5 text-body font-semibold"
              >
                Search everywhere
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => router.push("/book/service")}
              className="rounded-sm border border-edge px-6 py-2.5 text-body font-medium text-fg"
            >
              Change service or city
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {providers.map((p) => {
            const masked = maskPublicProvider(p);
            const label = masked ? `${masked.title} ${masked.code}` : "Licensed professional";
            return (
            <ProviderCard
              key={p.id}
              provider={p}
              selected={draft.providerId === p.id}
              onSelect={() =>
                update({
                  providerId: p.id,
                  providerName: label,
                  providerMinimumHours: p.pricing?.minimumHours ?? null,
                })
              }
            />
            );
          })}

          {data?.pagination && data.pagination.pages > 1 ? (
            <p className="mt-1 text-center text-body-sm text-fg-faint">
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
  const masked = maskPublicProvider(provider);
  const title = masked?.title ?? "Licensed professional";
  const hourly = provider.pricing?.hourlyRate ?? null;
  const daily = provider.pricing?.dailyRate ?? null;

  return (
    <div
      className={[
        "rounded-lg border transition-colors",
        selected ? "border-brand bg-panel-raised" : "border-hairline bg-panel",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-panel-raised text-h3 font-semibold text-fg">
          {masked?.initials ?? "LP"}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-body font-semibold text-fg">{title}</span>
            {masked ? (
              <span className="text-mono text-fg-faint">{masked.code}</span>
            ) : null}
            {provider.isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-sm border border-live px-2 py-0.5 text-label font-medium text-live">
                <CheckCircleFill size={12} />
                Verified
              </span>
            ) : null}
            {provider.verificationTier && provider.verificationTier !== "none" ? (
              <span className="rounded-full bg-panel-raised px-2 py-0.5 text-label font-medium capitalize text-fg-mid">
                {provider.verificationTier}
              </span>
            ) : null}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-fg-faint">
            {provider.averageRating ? (
              <span className="flex items-center gap-1 text-fg">
                <StarFill size={13} />
                {provider.averageRating.toFixed(1)}{" "}
                <span className="text-fg-faint">({provider.totalRatings ?? 0})</span>
              </span>
            ) : (
              <span className="text-fg-faint">No ratings yet</span>
            )}
            {provider.serviceCity ? <span>{provider.serviceCity}</span> : null}
            {provider.isHourlyAvailable ? <span>Hourly available</span> : null}
            {provider.offersVehicle ? <span>Vehicle</span> : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <span className="text-mono text-fg">
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
              "rounded-sm px-5 py-2.5 text-body-sm font-semibold transition-colors",
              selected
                ? "bg-brand"
                : "border border-edge text-fg hover:bg-panel-raised",
            ].join(" ")}
          >
            {selected ? "Selected" : "Select"}
          </button>
        </div>
      </div>

      <div className="border-t border-hairline px-5 py-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="text-body-sm font-semibold text-fg-mid hover:text-fg"
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
    return <div className="mt-4 h-24 animate-pulse rounded-lg bg-panel-raised" />;
  }

  if (error) {
    return (
      <p role="alert" className="mt-4 text-body-sm text-fault">
        {error}
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-5 pb-2">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label>About</Label>
          <p className="text-body-sm leading-relaxed text-fg-mid">
            {profile?.description || "This provider hasn't added a description yet."}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-body-sm text-fg-faint">
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
            <p className="mt-3 text-body-sm text-fg-mid">
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
                  className="rounded-full bg-panel-raised px-2.5 py-1 text-label capitalize text-fg-mid"
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
                    className="rounded-full bg-panel-raised px-2.5 py-1 text-label text-live"
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
              <p className="text-body-sm text-fg-mid">
                {profile.specializations.join(" · ")}
              </p>
            </div>
          ) : null}

          {profile?.languages?.length ? (
            <div>
              <Label>Languages</Label>
              <p className="text-body-sm text-fg-mid">{profile.languages.join(" · ")}</p>
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
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-hairline bg-panel-raised px-3 py-2"
              >
                <span className="text-body-sm font-semibold capitalize text-fg">
                  {rate.category}
                </span>
                <span className="text-body-sm text-fg-mid">
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

      {/*
        The heading counts the reviews actually returned, NOT
        `profile.rating.count`. Every provider in this environment carries a
        seeded average and count (5.0 / 114, 4.6 / 120 …) with zero Rating
        documents behind it, so `Reviews (114)` above an empty list reads as a
        broken screen rather than a provider nobody has written about yet. The
        star average still shows on the card — it is the written reviews that
        are missing, and the copy says exactly that.
      */}
      <div>
        <Label>Reviews {reviews.length ? `(${reviews.length})` : ""}</Label>
        {reviews.length === 0 ? (
          <p className="text-body-sm text-fg-faint">
            No written reviews yet
            {profile?.rating?.count
              ? ` — this provider's ${profile.rating.average?.toFixed(1)} rating comes from ${profile.rating.count} scores left without a comment.`
              : " for this provider."}
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {reviews.map((r) => (
              <div key={r._id} className="rounded-lg border border-hairline bg-panel-raised px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-body-sm font-medium text-fg">
                    <StarFill size={12} />
                    {r.rating.toFixed(1)}
                  </span>
                  <span className="text-body-sm text-fg-mid">
                    {r.fromUserId?.name ?? "Client"}
                  </span>
                  {r.createdAt ? (
                    <span className="text-label text-fg-faint">
                      {relativeTime(r.createdAt)}
                    </span>
                  ) : null}
                </div>
                {r.review ? (
                  <p className="mt-1 text-body-sm leading-relaxed text-fg-mid">
                    {r.review}
                  </p>
                ) : null}
                {r.response?.message ? (
                  <p className="mt-2 border-l-2 border-edge pl-3 text-body-sm leading-relaxed text-fg-faint">
                    <strong className="text-fg-mid">Provider replied:</strong>{" "}
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
    <p className="mb-1.5 text-eyebrow font-semibold uppercase tracking-[1px] text-fg-faint">
      {children}
    </p>
  );
}
