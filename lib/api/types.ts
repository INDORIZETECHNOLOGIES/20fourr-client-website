/**
 * Wire types — what the API actually sends, before any UI shaping.
 *
 * Kept separate from lib/dashboard-data.ts on purpose: that file describes what
 * the components want, this one describes what the server has. The adapters in
 * lib/api/adapters.ts are the only place the two meet, so a backend field
 * rename lands in one file instead of thirty components.
 *
 * Field names here are taken from the Mongoose models, not guessed — several
 * differ from the obvious choice (`bookingId` not `bookingNumber`, `startDate`
 * + `startTime` as separate fields, `provider_rejected` not `rejected`).
 */

/** The User document, as /auth/me and /auth/login return it. */
export type ApiUser = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "client" | "provider" | "admin";
  /** Presigned S3 URL, or null when no avatar is on file. */
  profilePhoto?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt?: string;
};

export type ApiTokens = { accessToken: string; refreshToken: string };

export type LoginResponse = {
  user: ApiUser;
  tokens: ApiTokens;
  /** True when either identifier is still unverified — route to the OTP screens. */
  requiresVerification?: boolean;
};

export type RegisterResponse = {
  userId: string;
  email: string;
  phone: string;
  role: string;
  message: string;
  tokens: ApiTokens;
};

/** ClientProfile — a separate document from User, fetched via /client/profile. */
export type ApiClientProfile = {
  _id?: string;
  /** Populated with the User document on GET, a plain id elsewhere. */
  userId?: string | Partial<ApiUser>;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | null;
  clientType?: "individual" | "registered_business";
  gstin?: string | null;
  bookingPreferences?: {
    preferredServiceCategory?: "guard" | "bouncer" | "gunman" | "pso" | null;
    preferVehicle?: boolean;
    preferVehicleWithDriver?: boolean;
  } | null;
  savedAddresses?: ApiSavedAddress[];
  totalBookings?: number;
  /** Integer paise, like every other amount. */
  totalSpent?: number;
  /** Nested — there is no flat `averageRating` on the document. */
  rating?: { average?: number; count?: number } | null;
  membership?: {
    isActive?: boolean;
    plan?: string;
    activatedAt?: string | null;
    expiresAt?: string | null;
    prioritySupport?: boolean;
  } | null;
  threatAssessment?: {
    hasKnownThreat?: boolean;
    wasAttackedBefore?: boolean;
    threatDescription?: string | null;
    attackDescription?: string | null;
    threatLevel?: "low" | "medium" | "high" | string;
  } | null;
  isBlacklisted?: boolean;
  createdAt?: string;
};

export type ApiSavedAddress = {
  _id: string;
  label: string;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  isDefault?: boolean;
};

/** A populated provider reference on a booking. */
export type ApiProviderRef = {
  _id: string;
  name?: string;
  profilePhoto?: string | null;
};

/**
 * A booking, as /client/bookings and /bookings/:id return it.
 *
 * Note `providerId.name` is masked to "Security Professional" by the API until
 * the booking reaches payment_done — the real name is not ours to reveal early,
 * so render whatever comes back rather than reaching for another source.
 */
export type ApiBooking = {
  _id: string;
  /** Human-facing reference, e.g. "BK-2847". */
  bookingId: string;
  status: string;
  serviceCategory: "guard" | "bouncer" | "gunman" | "pso" | string;
  /** ISO date; the clock time lives separately in startTime/endTime ("09:00"). */
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  totalHours?: number;
  numberOfDays?: number;
  isFullDay?: boolean;
  /** All amounts are integer paise — format via lib/money.ts. */
  baseAmount?: number;
  vehicleCharges?: number;
  subtotalAmount?: number;
  platformFee?: number;
  gstAmount?: number;
  totalAmount?: number;
  vehicleOption?: "none" | "vehicle" | "vehicleWithDriver";
  address?: string | null;
  notes?: string | null;
  providerId?: string | ApiProviderRef | null;
  clientId?: string | ApiProviderRef | null;
  statusHistory?: { status?: string; changedAt?: string; reason?: string }[];
  cancellation?: {
    cancelledAt?: string | null;
    cancelledBy?: "client" | "provider" | "admin" | null;
    cancellationReason?: string | null;
    refundAmount?: number;
    refundStatus?: "pending" | "processed" | "failed" | null;
  } | null;
  createdAt?: string;
};

export type ApiPagination = { page: number; limit: number; total: number; pages: number };

export type BookingListResponse = { bookings: ApiBooking[]; pagination: ApiPagination };

// ─── Support tickets ────────────────────────────────────────────────────────

export type ApiTicketMessage = {
  _id?: string;
  senderId?: string | { _id: string; name?: string };
  senderRole: "client" | "provider" | "admin" | "support" | "support_review";
  message: string;
  attachments?: { fileUrl?: string; fileName?: string; fileSize?: number }[];
  timestamp?: string;
};

export type ApiTicket = {
  _id: string;
  /** Human reference, e.g. "TKT-4471". Display only — routes use _id. */
  ticketId: string;
  raisedBy?: string | { _id: string; name?: string };
  bookingId?: string | { _id: string; bookingId?: string } | null;
  type: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  messages?: ApiTicketMessage[];
  resolution?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TicketListResponse = { tickets: ApiTicket[]; pagination: ApiPagination };

// ─── Notifications ──────────────────────────────────────────────────────────

export type ApiNotification = {
  _id: string;
  type: string;
  title: string;
  body: string;
  /** Note `isRead`, not `read`. */
  isRead: boolean;
  readAt?: string | null;
  priority?: "low" | "normal" | "high" | "urgent";
  data?: {
    bookingId?: string;
    ticketId?: string;
    actionUrl?: string;
    deepLink?: string;
  } | null;
  createdAt?: string;
};

export type NotificationListResponse = {
  notifications: ApiNotification[];
  pagination: ApiPagination;
};

// ─── Wallet ─────────────────────────────────────────────────────────────────

export type ApiWalletTransaction = {
  _id?: string;
  currency: "coin" | "point";
  type: "credit" | "debit";
  /** Whole rupees — 1 coin = ₹1. NOT paise. See lib/money.ts. */
  amount: number;
  reason: string;
  description?: string;
  bookingId?: string | null;
  expiresAt?: string | null;
  expired?: boolean;
  createdAt?: string;
};

export type ApiWallet = {
  coinBalance: number;
  coinLifetimeEarned: number;
  coinLifetimeSpent: number;
  pointBalance: number;
  pointLifetimeEarned: number;
  pointLifetimeSpent: number;
  /** Points are capped at this percentage of a booking total. */
  pointUsageLimitPct: number;
  walletExpiryDays: number;
  transactions: ApiWalletTransaction[];
};

// ─── Invoices ───────────────────────────────────────────────────────────────

export type ApiInvoiceLineItem = {
  description: string;
  quantity: number;
  /** Integer paise. */
  unitPrice: number;
  amount: number;
};

export type ApiInvoiceTaxLine = {
  label: string;
  sac: string;
  rate: number;
  base: number;
  amount: number;
  taxType: string;
  split?: {
    intraState: boolean;
    cgst: number;
    sgst: number;
    igst: number;
    placeOfSupplyStateCode: string;
  };
};

export type ApiInvoice = {
  _id: string;
  invoiceNumber: string;
  bookingId?: string | null;
  bookingRef?: string;
  type: "client" | "provider";
  status: "draft" | "issued" | "cancelled";
  issuedAt?: string;
  lineItems?: ApiInvoiceLineItem[];
  taxLines?: ApiInvoiceTaxLine[];
  /** All integer paise. */
  subtotalAmount?: number;
  platformFee?: number;
  gstAmount?: number;
  serviceGstAmount?: number;
  tcsAmount?: number;
  totalAmount?: number;
  reverseChargeApplicable?: boolean;
  serviceCategory?: string;
  serviceStartDate?: string;
  serviceEndDate?: string;
  clientSnapshot?: { name?: string; email?: string; phone?: string };
  providerSnapshot?: { name?: string; email?: string; phone?: string };
  notes?: string;
  createdAt?: string;
};

export type InvoiceListResponse = { invoices: ApiInvoice[]; pagination: ApiPagination };

// ─── Provider discovery ─────────────────────────────────────────────────────

/**
 * A provider card from /client/providers/search.
 *
 * `pricing` here is the MINIMUM across the provider's priced categories, not
 * the rate for the category you searched — the discovery service computes it
 * with Math.min over all of them, so it is a "from" price and nothing more.
 */
export type ApiProviderCard = {
  /** The provider's User _id — what /client/providers/:providerId takes. */
  id: string;
  businessName?: string;
  serviceCity?: string;
  serviceCities?: string[];
  serviceCategories?: string[];
  averageRating?: number | null;
  totalRatings?: number;
  isHourlyAvailable?: boolean;
  isVerified?: boolean;
  verificationTier?: string;
  trustBadges?: string[];
  offersVehicle?: boolean;
  offersVehicleWithDriver?: boolean;
  pricing?: {
    /** Integer paise. Null when the provider has no rate of that kind. */
    dailyRate?: number | null;
    hourlyRate?: number | null;
    minimumHours?: number | null;
  };
  user?: { fullName?: string };
};

export type ProviderSearchResponse = {
  providers: ApiProviderCard[];
  sortBy?: string;
  pagination: ApiPagination;
};

// ─── Chat ───────────────────────────────────────────────────────────────────

/**
 * Chat is mounted at `/chat/:bookingId`, NOT `/bookings/:bookingId/chat` —
 * the mobile constants file lists the latter and it is wrong.
 *
 * Access is gated twice: you must be a participant in the booking, AND the
 * booking must have reached payment_done. Before that the API returns 403.
 */
export type ApiChatMessage = {
  _id: string;
  bookingId: string;
  senderId: string | { _id: string; name?: string; role?: string };
  recipientId: string;
  content: string;
  messageType: "text" | "system" | "image" | "file";
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
};

export type ChatHistoryResponse = {
  messages: ApiChatMessage[];
  pagination: ApiPagination;
};

/** The booking statuses that permit chat, mirroring CHAT_ALLOWED_STATUSES. */
export const CHAT_ALLOWED_STATUSES = [
  "payment_done",
  "duty_started",
  "duty_ended",
  "completed",
];

/**
 * When an invoice exists. Same set as the API's INVOICE_STATUSES — asking
 * earlier returns 400 "Invoice is available only after payment confirmation",
 * so the action is disabled rather than offered and then refused.
 */
export const INVOICE_STATUSES = [
  "payment_done",
  "duty_started",
  "duty_ended",
  "completed",
];

// ─── Duty OTP ───────────────────────────────────────────────────────────────

/**
 * Duty verification, mounted at `/duty/:bookingId/*`.
 *
 * The client GENERATES the codes and reads them out; the provider VERIFIES
 * them (`verify-start-otp` / `verify-end-otp` are `restrictTo('provider')`, so
 * this site never calls them).
 *
 * Preconditions are strict: a start OTP needs `payment_done`, an end OTP needs
 * `duty_started`. Asking out of order returns 400.
 */
export type DutyOtpResponse = {
  otp: string;
  /** Seconds. 1800 for the start code, 3600 for the end code. */
  expiresIn: number;
};

export type DutyStatusResponse = {
  bookingStatus: string;
  dutySession: {
    startOtpVerified: boolean;
    dutyStartedAt: string | null;
    endOtpVerified: boolean;
    dutyEndedAt: string | null;
  } | null;
};

// ─── Safety: SOS, incidents, absence, dispute ───────────────────────────────

/**
 * Status gates, copied from the controllers so the UI never offers an action
 * the API will refuse:
 *
 *   SOS       duty_started only, and rate-limited (429 SC_1201)
 *   Incident  duty_started / duty_ended / completed / settled
 *   Absence   payment_done / duty_started
 *   Dispute   duty_started / duty_ended / completed, and not already disputed
 */
export const SOS_STATUSES = ["duty_started"];
export const INCIDENT_STATUSES = ["duty_started", "duty_ended", "completed", "settled"];
export const ABSENCE_STATUSES = ["payment_done", "duty_started"];
export const DISPUTE_STATUSES = ["duty_started", "duty_ended", "completed"];

/** The API's incident category enum, in the order a client would scan them. */
export const INCIDENT_CATEGORIES = [
  { id: "safety_threat", label: "Safety threat" },
  { id: "medical_emergency", label: "Medical emergency" },
  { id: "theft", label: "Theft" },
  { id: "property_damage", label: "Property damage" },
  { id: "misconduct", label: "Misconduct" },
  { id: "no_show", label: "No-show" },
  { id: "equipment_failure", label: "Equipment failure" },
  { id: "other", label: "Something else" },
] as const;

export const INCIDENT_SEVERITIES = ["low", "medium", "high", "critical"] as const;

// ─── Coupons & wallet redemption ────────────────────────────────────────────

/**
 * A coupon is applied at BOOKING CREATION — `couponCode` goes in the
 * `POST /bookings` body — not at payment time. `/coupons/validate` only
 * previews the discount; it does not reserve or apply anything.
 */
export type CouponBreakdown = {
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  /** Integer paise. */
  discountAmountPaise: number;
  totalAmountPaise: number;
  finalAmountPaise: number;
};

export type AvailableCoupon = {
  code: string;
  name?: string;
  description?: string;
  discountType?: string;
  discountValue?: number;
  maxDiscountPaise?: number;
  minOrderValuePaise?: number;
  expiryDate?: string;
};

/**
 * UNIT TRAP. `create-order` takes `coinsToUse` / `pointsToUse` in **paise**
 * (its validator caps them at 100_000_00 = ₹1,00,000), while the wallet
 * endpoint reports `coinBalance` / `pointBalance` in **whole rupees** — 1 coin
 * = ₹1. Sending a balance straight through would spend a hundredth of it.
 * Always convert with `rupeesToPaise` below.
 */
export function rupeesToPaise(rupees: number): number {
  return Math.max(0, Math.floor(rupees)) * 100;
}

// ─── Recurring bookings ─────────────────────────────────────────────────────

/**
 * TWO parallel implementations exist. Use `/recurring` — it is what the client
 * app calls, and the only one with pause / resume / skip-next.
 *
 *   /recurring                    frequency: weekly|biweekly|monthly, startDate/endDate
 *   /client/recurring-bookings    recurrenceType: daily|weekly|weekdays|custom,
 *                                 seriesStartDate/totalOccurrences
 *
 * A stale comment in recurring.validators.ts claims the second was migrated to
 * the first's vocabulary. It was not — the controller still reads
 * `recurrenceType`. Trusting that comment sends the wrong fields.
 *
 * POST /recurring also sits behind `requireClientProfileComplete`, so a client
 * without an address gets refused.
 */
export const RECURRING_FREQUENCIES = [
  { id: "weekly", label: "Every week" },
  { id: "biweekly", label: "Every 2 weeks" },
  { id: "monthly", label: "Every month" },
] as const;

export type ApiRecurringBooking = {
  _id: string;
  serviceCategory?: string;
  recurrenceType?: string;
  startTime?: string;
  endTime?: string;
  seriesStartDate?: string;
  seriesEndDate?: string | null;
  status: "active" | "paused" | "cancelled" | "completed" | string;
  totalOccurrences?: number;
  generatedBookings?: string[];
  providerId?: string | { _id: string; name?: string } | null;
  notes?: string;
  createdAt?: string;
};

export type RecurringListResponse = {
  recurringBookings: ApiRecurringBooking[];
  pagination: ApiPagination;
};

// ─── Provider documents & availability ──────────────────────────────────────

/**
 * Provider documents. Two gates, not one: the booking must be paid
 * (`payment_done` onward) AND, while still `payment_done`, only from 24h before
 * duty start. `fileUrl` is a short-lived presigned S3 URL — never cache it.
 */
/**
 * Statuses where money has actually changed hands. Before this, a booking has a
 * total but nothing was taken — so there is nothing to refund on cancel.
 */
export const PAID_STATUSES = [
  "payment_done",
  "duty_started",
  "duty_ended",
  "completed",
];

/** Same set — documents unlock the moment the booking is paid. */
export const DOCS_ALLOWED_STATUSES = PAID_STATUSES;

export type ApiBookingDocument = {
  _id: string;
  documentType?: string;
  fileUrl?: string | null;
  fileName?: string | null;
  verificationStatus?: string;
  expiryDate?: string | null;
  createdAt?: string;
};

export type ProviderAvailability = {
  isAvailable: boolean;
  /**
   * Days the provider has taken off, from today forward. Objects, not date
   * strings — `{ date: "YYYY-MM-DD", reason }` — and the date is a bare local
   * day, so compare it as a string rather than parsing it into a Date (which
   * would land at UTC midnight and shift the day in IST).
   */
  blockedDates: { date: string; reason?: string | null }[];
  /** The provider's shift window. Note startTime/endTime, not start/end. */
  workingHours?: { startTime?: string; endTime?: string } | null;
};

export type RatingRequiredResponse = {
  ratingRequired: boolean;
  pendingBookingCount: number;
  pendingBookingIds: string[];
};

/** Readable labels for the API's document type codes. */
export const DOCUMENT_LABELS: Record<string, string> = {
  aadhaar: "Aadhaar",
  passport: "Passport",
  voter_id: "Voter ID",
  driving_license: "Driving licence",
  security_certificate: "Security training certificate",
  weapon_license: "Weapon licence",
  weapon_registration: "Weapon registration",
  medical_certificate: "Medical certificate",
  ex_serviceman_cert: "Ex-serviceman certificate",
  professional_photo: "Photograph",
  uniform_photo: "Uniform photo",
  police_verification: "Police verification",
  psara_license: "PSARA licence",
};

// ─── Public provider profile & reviews ──────────────────────────────────────

/**
 * A provider as `GET /client/providers/:id` returns it.
 *
 * This is a strict server-side ALLOWLIST (serializers/providerPublic.ts), not
 * the ProviderProfile document. Licence numbers, KYC documents, bank details
 * and verification internals are deliberately absent — so if a field isn't
 * here it isn't coming, and asking for it a different way is not the fix.
 *
 * Two things that catch people out:
 *  - `user.fullName` reads "Security Professional", and phone/email are null,
 *    until the client has a booking with this provider past payment. The
 *    response carries `isContactVisible` alongside so the UI can say why.
 *  - `pricing` is an array of per-category rates, not the single flattened
 *    object the search card carries.
 */
export type ApiPublicProvider = {
  id: string;
  businessName?: string | null;
  providerType?: "individual" | "agency" | string;
  description?: string | null;
  serviceCity?: string | null;
  serviceCities?: string[];
  serviceState?: string | null;
  serviceCategories?: string[];
  yearsExperience?: number;
  languages?: string[];
  specializations?: string[];
  skills?: string[];
  gallery?: { url?: string | null; type?: string; caption?: string | null }[];
  previousOrganization?: string | null;
  rankAtRetirement?: string | null;
  regiment?: string | null;
  isExServiceman?: boolean;
  isPoliceVeteran?: boolean;
  passportAvailable?: boolean;
  travelAcrossIndia?: boolean;
  internationalTravel?: boolean;
  availableNow?: boolean;
  yearEstablished?: number | null;
  numberOfPersonnel?: number | null;
  responseTime?: string | null;
  isoCertification?: string | null;
  /** Integer paise. One entry per service category the provider prices. */
  pricing?: {
    category: string;
    dailyRate?: number | null;
    hourlyEnabled?: boolean;
    hourlyRate?: number | null;
    minimumHours?: number | null;
    vehicleRate?: number | null;
    vehicleWithDriverRate?: number | null;
  }[];
  vehicleOptions?: {
    offersVehicle?: boolean;
    offersVehicleWithDriver?: boolean;
    vehicleType?: string | null;
  };
  rating?: { average?: number; count?: number };
  completedBookings?: number;
  isVerified?: boolean;
  verificationTier?: string;
  badge?: string;
  trustBadges?: string[];
  user?: {
    fullName?: string;
    profilePhoto?: string | null;
    phone?: string | null;
    email?: string | null;
  };
};

export type ProviderProfileResponse = {
  provider: ApiPublicProvider;
  /** False while the provider's real name and contact stay masked. */
  isContactVisible: boolean;
};

/**
 * A public review, from `GET /ratings/user/:userId`.
 *
 * Only `visibility: 'public'` rows come back, newest first. An approved
 * anonymous review arrives with `fromUserId.name` already rewritten to
 * "Anonymous" by the server — never try to reconstruct who wrote it.
 */
export type ApiRating = {
  _id: string;
  rating: number;
  review?: string | null;
  detailedRatings?: Record<string, number | undefined> | null;
  tags?: string[];
  /** Already presigned for display; the links are short-lived. */
  photos?: string[];
  fromUserId?: { _id?: string; name?: string; profilePhoto?: string | null } | null;
  bookingId?: { _id?: string; bookingId?: string } | null;
  response?: { message?: string; respondedAt?: string } | null;
  createdAt?: string;
};

export type RatingListResponse = { ratings: ApiRating[]; pagination: ApiPagination };

/** Human labels for the trust badges the server computes from verified data. */
export const TRUST_BADGE_LABELS: Record<string, string> = {
  verified_identity: "Identity verified",
  ex_serviceman: "Ex-serviceman",
  psara_verified: "PSARA verified",
  firearms_authorized: "Firearms authorised",
  background_verified: "Background verified",
  top_rated: "Top rated",
  elite_protection: "Elite protection",
};
