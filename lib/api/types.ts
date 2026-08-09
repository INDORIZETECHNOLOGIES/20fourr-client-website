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
