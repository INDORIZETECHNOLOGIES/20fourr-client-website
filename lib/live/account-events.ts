/**
 * Live account events (spec 0003 E, backend 0020).
 *
 * The server emits `account_event` to the signed-in user's private room whenever it records a
 * notification for them. The payload only names what changed: `{ type, entity, entityId, at }`.
 * It is NEVER rendered. A page reacts by refetching through the BFF, so the serializer stays the
 * only thing that decides what the client sees.
 */

export type AccountEventEntity = "booking" | "contract" | "payment" | "document" | "ticket" | "rating" | "account";

export type AccountEvent = { type: string; entity: AccountEventEntity; entityId: string | null; at: string };

const ENTITIES: readonly string[] = ["booking", "contract", "payment", "document", "ticket", "rating", "account"];

export function isAccountEvent(value: unknown): value is AccountEvent {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.type === "string" &&
    typeof v.entity === "string" &&
    ENTITIES.includes(v.entity) &&
    (v.entityId === null || typeof v.entityId === "string")
  );
}

type Match = (path: string) => boolean;

/**
 * Which query paths an event makes stale. Paths are `useApiQuery` paths (no leading slash, no
 * query string). Payment events carry their booking's id (backend 0020 rule 3), so they refresh
 * that booking like a booking event does. The notification bell refreshes on every event.
 */
export function staleMatcher(event: AccountEvent): Match {
  const id = event.entityId;
  const notifications: Match = (p) => p.startsWith("notifications");

  const byEntity: Record<AccountEventEntity, Match> = {
    booking: (p) =>
      p === "client/bookings" ||
      p === "client/rating-required" ||
      p === "recurring" ||
      (id !== null && (p === `bookings/${id}` || p.startsWith(`bookings/${id}/`) || p.startsWith(`client/bookings/${id}`))),
    payment: (p) =>
      p === "client/bookings" ||
      p === "wallet" ||
      (id !== null && (p === `bookings/${id}` || p.startsWith(`bookings/${id}/`) || p.startsWith(`client/bookings/${id}`))),
    document: (p) =>
      p === "client/billing-documents" || p === "documents" || p === "invoices" || p.startsWith("documents/") || p.startsWith("invoices/"),
    contract: (p) => p.startsWith("client/contracts") || p.startsWith("contracts"),
    ticket: (p) => p.startsWith("tickets"),
    rating: (p) => p === "client/rating-required" || p.startsWith("ratings"),
    account: (p) => p === "client/profile" || p === "wallet" || p === "client/membership",
  };

  const entity = byEntity[event.entity];
  return (p) => notifications(p) || entity(p);
}
