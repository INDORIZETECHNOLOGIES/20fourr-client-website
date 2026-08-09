"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "../BookingContext";
import { StepFooter, StepHeading } from "../BookingShell";
import { ServiceGlyph } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useSession } from "@/components/session/SessionProvider";
import { SERVICE_CATALOGUE, isServiceCategory } from "@/lib/services";

export default function ServiceStep() {
  const { draft, update, hydrated } = useBooking();
  const { profile } = useSession();
  const router = useRouter();
  const ready = Boolean(draft.serviceCategory && draft.city);

  /**
   * Only cities that actually have bookable providers.
   *
   * The API computes this with the same predicate as provider search
   * (verified, available, not PSARA-blocked), so every option here will return
   * results. There is deliberately no static fallback list — offering a city
   * with no providers just moves the dead end one screen later.
   */
  // The payload is { cities: [...] } — the app's RTK layer unwraps it with a
  // transformResponse, which is easy to miss when porting.
  const { data: cityData, loading: citiesLoading, error: citiesError, refetch } =
    useApiQuery<{ cities: string[] }>("client/service-cities");
  const cities = cityData?.cities;

  // "Book Now" arrives with ?category=guard, and the catalogue's ex-serviceman
  // tile with ?exServiceman=true. Read from location rather than
  // useSearchParams so the route doesn't need a Suspense boundary.
  useEffect(() => {
    // Wait for the stored draft to load first — see `hydrated` in BookingContext.
    if (!hydrated) return;
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const exServiceman = params.get("exServiceman") === "true";

    const patch: Parameters<typeof update>[0] = {};
    if (category && isServiceCategory(category)) {
      patch.serviceCategory = category;
      patch.serviceName = SERVICE_CATALOGUE.find((s) => s.id === category)?.name ?? null;
      patch.providerId = null;
    }
    if (exServiceman) patch.exServicemanOnly = true;
    if (Object.keys(patch).length > 0) update(patch);
  }, [update, hydrated]);

  // Default the city to the one on the client's profile, as the app does.
  useEffect(() => {
    if (!hydrated) return;
    if (!draft.city && profile?.city && cities?.includes(profile.city)) {
      update({ city: profile.city });
    }
  }, [hydrated, draft.city, profile?.city, cities, update]);

  return (
    <>
      <StepHeading
        title="What do you need?"
        subtitle="Pick a service and the city you need it in."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {SERVICE_CATALOGUE.map((svc) => {
          const selected = draft.serviceCategory === svc.id;
          return (
            <button
              key={svc.id}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                update({
                  serviceCategory: svc.id,
                  serviceName: svc.name,
                  providerId: null,
                  providerName: null,
                })
              }
              className={[
                "flex flex-col items-start rounded-2xl border p-5 text-left transition-colors",
                selected
                  ? "border-app-gold bg-app-gold/6"
                  : "border-app-border bg-app-card hover:border-app-gold/40",
              ].join(" ")}
            >
              <span
                className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${svc.iconBg} ${svc.color}`}
              >
                <ServiceGlyph icon={svc.icon} size={20} />
              </span>
              <span className="text-[15px] font-bold text-slate-100">{svc.name}</span>
              <span className="mt-1 text-[12.5px] leading-relaxed text-slate-600">
                {svc.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* An attribute filter, not a fifth category — it narrows whichever
          category is selected to providers with a verified certificate. */}
      <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-app-border bg-app-card px-5 py-4">
        <input
          type="checkbox"
          checked={draft.exServicemanOnly}
          onChange={(e) =>
            update({ exServicemanOnly: e.target.checked, providerId: null })
          }
          className="h-[18px] w-[18px] shrink-0 accent-app-gold"
        />
        <span className="min-w-0">
          <span className="block text-[14.5px] font-semibold text-slate-200">
            Ex-Serviceman only
          </span>
          <span className="block text-[12.5px] text-slate-600">
            Restrict to providers with a verified ex-serviceman certificate.
          </span>
        </span>
      </label>

      <h3 className="mb-3 mt-8 text-[12px] font-semibold uppercase tracking-[1.2px] text-slate-500">
        City
      </h3>

      {citiesLoading ? (
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-10 w-28 animate-pulse rounded-full bg-white/6" />
          ))}
        </div>
      ) : citiesError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/8 px-5 py-6 text-center">
          <p role="alert" className="text-[14px] text-red-300">
            {citiesError}
          </p>
          <button
            type="button"
            onClick={refetch}
            className="mt-3 rounded-full border border-app-gold px-5 py-2 text-[13px] font-bold text-app-gold"
          >
            Try again
          </button>
        </div>
      ) : (cities ?? []).length === 0 ? (
        <p className="rounded-2xl border border-app-border bg-app-card px-5 py-6 text-center text-[14px] text-slate-500">
          No cities currently have bookable providers.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {(cities ?? []).map((city) => {
            const selected = draft.city === city;
            return (
              <button
                key={city}
                type="button"
                aria-pressed={selected}
                onClick={() => update({ city, providerId: null, providerName: null })}
                className={[
                  "rounded-full border px-5 py-2.5 text-[14px] font-semibold transition-colors",
                  selected
                    ? "border-app-gold bg-app-gold/12 text-app-gold"
                    : "border-app-border text-slate-300 hover:border-app-gold/40",
                ].join(" ")}
              >
                {city}
              </button>
            );
          })}
        </div>
      )}

      <StepFooter
        disabled={!ready}
        hint={ready ? undefined : "Choose a service and a city to continue."}
        onContinue={() => router.push("/book/provider")}
      />
    </>
  );
}
