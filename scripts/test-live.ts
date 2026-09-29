/**
 * Spec 0003 E unit checks: which queries an account event makes stale.
 * Run: node --experimental-strip-types scripts/test-live.ts
 */
import assert from "node:assert/strict";
import { isAccountEvent, staleMatcher, type AccountEvent } from "../lib/live/account-events.ts";
import { refreshAll, refreshMatching, registerQuery } from "../lib/live/query-registry.ts";

const ev = (entity: AccountEvent["entity"], entityId: string | null = "b1"): AccountEvent => ({
  type: "t",
  entity,
  entityId,
  at: "2026-09-29T10:00:00Z",
});

assert.equal(isAccountEvent(ev("booking")), true);
assert.equal(isAccountEvent({ ...ev("booking"), entity: "wallet" }), false);
assert.equal(isAccountEvent({ entity: "booking" }), false);

const booking = staleMatcher(ev("booking", "b1"));
assert.equal(booking("bookings/b1"), true);
assert.equal(booking("bookings/b1/provider-invoice"), true);
assert.equal(booking("client/bookings/b1/personnel"), true);
assert.equal(booking("client/bookings"), true);
assert.equal(booking("bookings/b2"), false, "another booking stays put");
assert.equal(booking("client/billing-documents"), false);
assert.equal(booking("notifications/unread-count"), true, "the bell refreshes on every event");

// A payment event carries its booking's id and refreshes that booking.
assert.equal(staleMatcher(ev("payment", "b1"))("bookings/b1"), true);
assert.equal(staleMatcher(ev("document", "d1"))("client/billing-documents"), true);
assert.equal(staleMatcher(ev("document", "d1"))("bookings/b1"), false);
assert.equal(staleMatcher(ev("account", null))("client/profile"), true);
assert.equal(staleMatcher(ev("ticket", "t1"))("tickets"), true);

// Registry: only matching queries refresh; a reconnect refreshes each once.
const hits: string[] = [];
const off1 = registerQuery({ path: "bookings/b1", refresh: () => hits.push("b1") });
const off2 = registerQuery({ path: "wallet", refresh: () => hits.push("wallet") });
assert.equal(refreshMatching(booking), 1);
assert.deepEqual(hits, ["b1"]);
assert.equal(refreshAll(), 2);
assert.deepEqual(hits, ["b1", "b1", "wallet"]);
off1();
off2();
assert.equal(refreshAll(), 0);

console.log("live sync helpers passed");
