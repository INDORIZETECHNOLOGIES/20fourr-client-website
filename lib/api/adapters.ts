/**
 * Wire shape → view shape. The only place lib/api/types.ts meets
 * lib/dashboard-data.ts.
 *
 * Everything here is total: an adapter must never throw on a field the API
 * left out, because a single missing `startTime` would otherwise blank a whole
 * bookings list.
 */

import type { Address, Booking, BookingStatus, ClientType, PreferredCategory } from "@/lib/dashboard-data";
import type { AppNotification, Ticket, TicketMessage } from "@/lib/support-data";
import { ticketCategoryLabel } from "@/lib/support-data";
import type {
  ApiBooking,
  ApiClientProfile,
  ApiNotification,
  ApiProviderRef,
  ApiSavedAddress,
  ApiTicket,
  ApiTicketMessage,
  ApiUser,
} from "./types";

/** "2026-08-10T00:00:00.000Z" → "Aug 10, 2026". Empty string when unparseable. */
export function formatApiDate(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "09:00" → "09:00 AM". Passes anything it doesn't recognise straight through. */
export function formatApiTime(time?: string | null): string {
  if (!time) return "";
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return time;
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? "PM" : "AM";
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(display).padStart(2, "0")}:${match[2]} ${suffix}`;
}

const SERVICE_LABELS: Record<string, string> = {
  guard: "Security guard",
  bouncer: "Bouncer",
  gunman: "Gunman",
  pso: "PSO",
};

export function serviceLabel(category?: string | null): string {
  if (!category) return "Security service";
  return SERVICE_LABELS[category] ?? category;
}

function providerRef(value: ApiBooking["providerId"]): ApiProviderRef | null {
  if (!value || typeof value === "string") return null;
  return value;
}

/**
 * The provider's name, or the API's placeholder.
 *
 * Before payment_done the API deliberately substitutes "Security Professional"
 * — identity is released only once the booking is paid for. Show a neutral
 * label rather than an empty cell, and never try to recover the real name from
 * elsewhere.
 */
export function providerName(booking: ApiBooking): string {
  return providerRef(booking.providerId)?.name || "Awaiting assignment";
}

export function adaptBooking(booking: ApiBooking): Booking {
  return {
    // Route by _id: /bookings/:bookingId resolves with findById, so the human
    // "BK-2847" reference would 404. It is display only.
    id: booking._id,
    ref: booking.bookingId || booking._id,
    service: serviceLabel(booking.serviceCategory),
    category: booking.serviceCategory,
    date: formatApiDate(booking.startDate),
    time: formatApiTime(booking.startTime),
    location: booking.address?.trim() || "Location not set",
    guard: providerName(booking),
    status: booking.status as BookingStatus,
    amountPaise: booking.totalAmount ?? 0,
  };
}

export function adaptAddress(address: ApiSavedAddress): Address {
  return {
    id: address._id,
    label: address.label,
    street: address.street ?? "",
    city: address.city ?? "",
    state: address.state ?? "",
    pincode: address.pincode ?? "",
    isDefault: Boolean(address.isDefault),
  };
}

/** Splits the single stored `name` on the first space, as the app does. */
export function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export function initialOf(name?: string | null): string {
  return name?.trim()?.[0]?.toUpperCase() ?? "?";
}

export type ProfileView = {
  name: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  location: string;
  memberSince: string;
  clientType: ClientType;
  gstin: string;
  preferredServiceCategory: PreferredCategory;
  preferVehicle: boolean;
  preferVehicleWithDriver: boolean;
  initial: string;
  role: string;
  avatarUrl: string | null;
  verified: boolean;
  totalBookings: number;
  avgRating: string;
};

/**
 * Builds the profile view model the screens already expect from the two
 * documents it is spread across: `name`/`email`/`phone` live on User, while
 * `address`/`clientType`/`gstin`/preferences live on ClientProfile.
 */
export function adaptProfile(user: ApiUser, profile: ApiClientProfile | null): ProfileView {
  const { firstName, lastName } = splitName(user.name ?? "");
  const preferences = profile?.bookingPreferences ?? null;

  return {
    name: firstName || user.name || "there",
    firstName,
    lastName,
    fullName: user.name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    city: profile?.address?.city ?? "",
    address: profile?.address?.street ?? "",
    location: profile?.address?.city || "India",
    memberSince: user.createdAt ? new Date(user.createdAt).getFullYear().toString() : "",
    clientType: (profile?.clientType ?? "individual") as ClientType,
    gstin: profile?.gstin ?? "",
    preferredServiceCategory: (preferences?.preferredServiceCategory ?? null) as PreferredCategory,
    preferVehicle: Boolean(preferences?.preferVehicle),
    preferVehicleWithDriver: Boolean(preferences?.preferVehicleWithDriver),
    initial: initialOf(user.name),
    role: "Client Account",
    avatarUrl: user.profilePhoto ?? null,
    // Both identifiers, not just one — this badge claims the account is
    // verified, and the API only treats it that way when both are.
    verified: Boolean(user.emailVerified && user.phoneVerified),
    totalBookings: profile?.totalBookings ?? 0,
    // `rating.count` guards the average: a fresh account has average 0, and
    // showing "0.0" would read as a terrible rating rather than no ratings.
    avgRating: profile?.rating?.count ? (profile.rating.average ?? 0).toFixed(1) : "—",
  };
}

// ─── Relative time ──────────────────────────────────────────────────────────

/** "2 hours ago" / "Yesterday" / "05 Aug". Empty string when unparseable. */
export function relativeTime(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** "Today, 10:12" / "05 Aug, 14:02" — the message-thread timestamp format. */
export function messageTime(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const time = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const today = new Date();
  const sameDay =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (sameDay) return `Today, ${time}`;
  return `${date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}, ${time}`;
}

// ─── Tickets ────────────────────────────────────────────────────────────────

function idOf(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return undefined;
}

export function adaptTicketMessage(
  message: ApiTicketMessage,
  index: number,
): TicketMessage {
  // Anything not raised by the client is support's side of the thread —
  // including 'admin' and 'support_review', which are internal role names the
  // user should never be shown.
  const mine = message.senderRole === "client";
  const sender = message.senderId;
  const senderName =
    sender && typeof sender === "object" && sender.name ? sender.name : "20fourr Support";

  return {
    id: message._id ?? `m${index}`,
    from: mine ? "you" : "support",
    author: mine ? "You" : senderName,
    body: message.message,
    at: messageTime(message.timestamp),
  };
}

export function adaptTicket(ticket: ApiTicket): Ticket {
  return {
    // /tickets/:ticketId resolves with findById, so the route key is _id.
    id: ticket._id,
    ref: ticket.ticketId || ticket._id,
    subject: ticket.subject,
    type: ticket.type as Ticket["type"],
    category: ticketCategoryLabel(ticket.type),
    priority: ticket.priority as Ticket["priority"],
    status: ticket.status as Ticket["status"],
    updated: relativeTime(ticket.updatedAt ?? ticket.createdAt),
    bookingId: idOf(ticket.bookingId),
    messages: (ticket.messages ?? []).map(adaptTicketMessage),
  };
}

// ─── Notifications ──────────────────────────────────────────────────────────

/**
 * Where tapping a notification should go.
 *
 * `data.actionUrl` and `data.deepLink` are written for the mobile app, so they
 * can be app-scheme URLs that mean nothing here. Only same-origin paths are
 * honoured; otherwise the destination is derived from the ids on the payload.
 */
function notificationHref(notification: ApiNotification): string | undefined {
  const url = notification.data?.actionUrl;
  if (url && url.startsWith("/") && !url.startsWith("//")) return url;

  if (notification.data?.bookingId) return `/dashboard/bookings/${notification.data.bookingId}`;
  if (notification.data?.ticketId) return `/dashboard/support/${notification.data.ticketId}`;
  if (notification.type.startsWith("payment")) return "/dashboard/profile/invoices";
  return undefined;
}

export function adaptNotification(notification: ApiNotification): AppNotification {
  return {
    id: notification._id,
    kind: notification.type,
    title: notification.title,
    body: notification.body,
    at: relativeTime(notification.createdAt),
    // `isRead` on the wire, `read` in the UI.
    read: Boolean(notification.isRead),
    href: notificationHref(notification),
  };
}

/**
 * When duty actually starts, as a Date.
 *
 * The API splits this across two fields — `startDate` is an ISO date and
 * `startTime` is a bare clock string like "09:00" — so anything that measures
 * time *until* the shift (the cancellation refund tiers, the 24h document
 * reveal) has to recombine them. Using `startDate` alone reads as midnight and
 * silently shifts the answer by most of a day.
 */
export function dutyStartsAt(booking: {
  startDate?: string;
  startTime?: string;
}): Date | null {
  if (!booking.startDate) return null;
  const date = new Date(booking.startDate);
  if (Number.isNaN(date.getTime())) return null;

  const match = /^(\d{1,2}):(\d{2})/.exec(booking.startTime ?? "");
  if (match) date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date;
}
