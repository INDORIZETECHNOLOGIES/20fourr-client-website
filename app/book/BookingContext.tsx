"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

/**
 * The funnel ends at Confirm, not Payment.
 *
 * Payment used to be step 8 here, which cannot work: `POST /payments/create-order`
 * rejects any booking that is not already `provider_accepted`. A booking is
 * created as `pending`, the provider accepts it, and only then is there anything
 * to charge — which is also what the Confirm screen's own copy has always said
 * ("You are charged once the provider accepts. If nobody accepts, nothing is
 * captured.").
 *
 * Paying now lives on the booking detail screen, behind the `Pay Now` action
 * that the `payment_pending` status has always implied.
 */
export const BOOKING_STEPS = [
  { slug: "service", label: "Service" },
  { slug: "provider", label: "Provider" },
  { slug: "purpose", label: "Purpose" },
  { slug: "schedule", label: "Schedule" },
  { slug: "risk", label: "Risk" },
  { slug: "safety", label: "Safety" },
  { slug: "absence", label: "Absence" },
  { slug: "confirm", label: "Confirm" },
] as const;

export type StepSlug = (typeof BOOKING_STEPS)[number]["slug"];

export type BookingDraft = {
  /** Display label — "Security Guard". */
  serviceName: string | null;
  /**
   * The API's enum value — "guard". This is what provider search and booking
   * creation actually take; `serviceName` is only ever shown to the user.
   */
  serviceCategory: string | null;
  /** Restrict results to providers with a verified ex-serviceman certificate. */
  exServicemanOnly: boolean;
  city: string | null;
  /** The provider's User _id, which is the id every provider endpoint takes. */
  providerId: string | null;
  /** Kept for the summary screens, which shouldn't refetch just to show a name. */
  providerName: string | null;
  /**
   * The provider's shortest bookable shift, carried from the search card.
   *
   * `POST /bookings` rejects anything under it with SC_411, and so does the
   * price preview — but only after the user has filled in the whole schedule
   * step. Holding it here lets the duration control say so at the point the
   * choice is made. Null when the provider card didn't carry one.
   */
  providerMinimumHours: number | null;
  purposeId: string | null;
  purposeNote: string;
  date: string;
  startTime: string;
  hours: number;
  address: string;
  /**
   * Structured deployment (spec 0004). GST place of supply uses this, not the
   * free-text address. State is a GST name from the select, never guessed.
   */
  deployment: {
    addressLine: string;
    city: string;
    stateName: string;
    pincode: string;
  };
  /** Matches the API's enum; drives the vehicle surcharge in the price preview. */
  vehicleOption: "none" | "vehicle" | "vehicleWithDriver";
  couponCode: string | null;
  /**
   * Consent gates — each must be explicitly accepted, never inferred.
   *
   * There are FOUR, not three. `POST /bookings` rejects the request outright
   * unless all of clientRiskAcknowledged, safetyDisclaimerAccepted,
   * bookingConfirmationWaiverAccepted and providerAbsencePolicyAcknowledged are
   * true (SRS §6.2.1 TC-BOOK-005). The absence policy had no gate here at all,
   * so every booking would have failed with SC_209.
   */
  riskAccepted: boolean;
  safetyAccepted: boolean;
  absencePolicyAccepted: boolean;
  waiverAccepted: boolean;
};

const EMPTY: BookingDraft = {
  serviceName: null,
  serviceCategory: null,
  exServicemanOnly: false,
  city: null,
  providerId: null,
  providerName: null,
  providerMinimumHours: null,
  purposeId: null,
  purposeNote: "",
  date: "",
  startTime: "",
  hours: 8,
  address: "",
  deployment: { addressLine: "", city: "", stateName: "", pincode: "" },
  vehicleOption: "none",
  couponCode: null,
  riskAccepted: false,
  safetyAccepted: false,
  absencePolicyAccepted: false,
  waiverAccepted: false,
};

const STORAGE_KEY = "20fourr.booking-draft";

type Ctx = {
  draft: BookingDraft;
  update: (patch: Partial<BookingDraft>) => void;
  reset: () => void;
  /** Highest step the draft satisfies the prerequisites for. */
  furthestStep: number;
  currentStep: number;
  /**
   * False until the sessionStorage draft has been read.
   *
   * Child effects run before the provider's, so anything that seeds the draft
   * on mount (the ?category deep link, the default city) must wait for this —
   * otherwise hydration replaces the draft wholesale and discards the seed.
   */
  hydrated: boolean;
};

const BookingCtx = createContext<Ctx | null>(null);

/**
 * Draft lives in sessionStorage so a refresh mid-funnel doesn't discard eight
 * steps of input. The mobile app keeps this in navigation params, which the web
 * can't rely on across a reload.
 */
export function BookingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<BookingDraft>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<BookingDraft>;
        setDraft({
          ...EMPTY,
          ...parsed,
          deployment: { ...EMPTY.deployment, ...parsed.deployment },
        });
      }
    } catch {
      /* storage unavailable — start clean */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* no-op */
    }
  }, [draft, hydrated]);

  const update = useCallback(
    (patch: Partial<BookingDraft>) => setDraft((d) => ({ ...d, ...patch })),
    [],
  );

  const reset = useCallback(() => {
    setDraft(EMPTY);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* no-op */
    }
  }, []);

  const furthestStep = useMemo(() => {
    // Each gate blocks everything after it — this is what stops someone
    // deep-linking past a consent screen.
    // Deployment state gates step 0, not the schedule step. Architecture v6.0
    // §W.2-17 requires provider search to be filtered by the state the guards
    // will actually work in, so it has to be known before the provider list is
    // shown — and it is also what stops price-preview returning SC_1413 later.
    if (!draft.serviceCategory || !draft.city || !draft.deployment.stateName) return 0;
    if (!draft.providerId) return 1;
    if (!draft.purposeId) return 2;
    if (!draft.date || !draft.startTime || !draft.address.trim()) return 3;
    if (!draft.riskAccepted) return 4;
    if (!draft.safetyAccepted) return 5;
    if (!draft.absencePolicyAccepted) return 6;
    if (!draft.waiverAccepted) return 7;
    return 7;
  }, [draft]);

  const currentStep = useMemo(() => {
    const slug = pathname.split("/")[2] ?? "service";
    const i = BOOKING_STEPS.findIndex((s) => s.slug === slug);
    return i === -1 ? 0 : i;
  }, [pathname]);

  return (
    <BookingCtx.Provider
      value={{ draft, update, reset, furthestStep, currentStep, hydrated }}
    >
      {children}
    </BookingCtx.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingCtx);
  if (!ctx) throw new Error("useBooking must be used inside BookingProvider");
  return ctx;
}
