# 0002 — v6 billing and API realignment

| | |
| --- | --- |
| **Status** | building |
| **Author** | Santosh Kumar |
| **Created** | 2026-09-12 |
| **Apps touched** | website (this repo). No backend changes. |
| **Branch** | |
| **PR** | |
| **Refs** | `CLIENT_API_REFERENCE.md` (2026-09-11), SecureConnect `specs/0004`, `0005`, `0006`, `0007` |

---

## Problem

This website was built against the v1 billing surface: a flat price preview, SecureCoins and
SecurePoints at checkout, coupon codes, and `/invoices/*`. The backend has since built v6 — a new
pricing engine, a new immutable quote on every booking, a new tax-document surface, and a structured
deployment location that drives GST place-of-supply. v6 is stamped per booking from
`PlatformSettings.billingV6.enabled`, which is still `false` in code but is a **runtime flag that
can be flipped without a deploy**.

The site has no idea any of this exists. It never calls `GET /public/billing-flags`, never reads
`booking.billingEngine`, and has no code path for a v6 response anywhere. The consequences are not
theoretical degradation — they are specific, and several are hard breaks on the day the flag flips:

1. **The booking funnel's price screens break outright.** On v6,
   `GET /client/providers/:id/price-preview` stops returning `{ baseAmount, platformFee, gstAmount,
   totalAmount, providerPayout, totalHours, numberOfDays, isHourlyBilling, hourlyRate, dailyRate }`
   and returns the `Quote` object instead (`client.controller.ts:412-429` — an early `return`, not a
   merge). Every one of those ten fields is `undefined`. `lib/api/pricing.ts` declares all ten as
   required; `PriceSummary` reads seven of them and computes `price.totalAmount - price.baseAmount -
   price.platformFee` → `NaN`. The user sees "₹NaN" on the confirm step and the primary action
   still submits.
2. **Price preview 400s for a client with no state on file.** The v6 branch resolves a deployment
   state from `?deploymentState=<state name>` or the client profile's state, and throws `SC_1413`
   when it has neither. The funnel collects a single free-text `address` string and sends no state
   at all, so every client without a completed profile address hits a hard error on the price step.
3. **Booking creation will be priced against the wrong state.** `POST /bookings/` takes a structured
   `deployment` object (spec 0004: `addressLine, city, stateCode | stateName, pincode, lat, lng`).
   The funnel sends none, so the service GST place of supply falls back to the client's billing
   state — which is wrong whenever a Delhi-registered company deploys guards in Gurugram, and that
   is the common case, not the edge case.
4. **The coupon field produces a guaranteed rejection.** `app/book/CouponField.tsx` collects a code
   and `BookingContext` sends it. On a v6 booking `POST /bookings/` now rejects it outright with
   `SC_1425`. The user types a valid code, sees it validate against `POST /coupons/validate` (which
   has no engine awareness and will happily confirm it), and then the booking fails at submit.
5. **The wallet toggles produce the same failure at payment.** `PayNowButton` offers coins and
   points; `POST /payments/create-order` rejects both on v6 with `SC_1424`. The failure lands after
   the user has committed to paying.
6. **"My Invoices" will be permanently empty.** The site reads `/invoices/*`, which only ever
   contains v1 documents. A v6 booking issues a platform fee invoice and a service document under
   `/documents/*`, which the site never calls. A client who pays ₹40,000 sees an empty invoice list
   and no way to get a tax document — for a business client that is the difference between being
   usable and not.
7. **The cancellation screen makes a promise the v6 path does not keep.** On v1 a refund becomes
   SecureCoins in the wallet. On v6 the wallet is never touched: a credit note is recorded and
   `cancellation.refundStatus` is set to `'pending'` — *the refund is owed, not paid*, and per
   `CLIENT_API_REFERENCE.md` Appendix B no job anywhere in `src/billing/settlement/` disburses it.
   `lib/cancellation-policy.ts:68` states it as a flat fact — `REFUND_DESTINATION = "Refunds are
   credited to your wallet as SecureCoins, not back to your card."` — and every screen that mentions
   a refund renders that string. Telling a user their money is in their wallet when it is an
   unreleased payable is the most serious item on this list, and it is a copy problem the design
   spec cannot solve without this one.
8. **`PriceSummary` hides GST behind a remainder.** Its own comment admits it: the v1 endpoint
   under-reports, so service GST and the convenience fee are folded into one "GST & other charges"
   line — ₹266 unexplained on an ₹1,200 booking. v6 returns every component itemized *and*
   SecureConnect spec 0005 requires them displayed ("Never render a single all-in total with no
   breakdown" — it is a GST-compliance requirement, not a preference).
9. **The BFF allowlist blocks the new surface.** `app/api/bff/[...path]/route.ts` has no `documents`
   or `public/` prefix, and `BINARY_PATHS` does not match `documents/:id/pdf`, so a tax-document PDF
   would be read as text and corrupted even once the prefix is added.

Separately, the reference documents five behaviours the current UI gets wrong regardless of engine:

10. **Recurring series "cancel" doesn't cancel anything.** `PATCH /recurring/:id/status` sets a field
    and explicitly does **not** cascade to already-generated bookings — every occurrence stays live
    and payable. `DELETE /client/recurring-bookings/:seriesId` is the one that cancels still-pending
    occurrences, and only those in `pending`/`provider_accepted`.
11. **Two waiver endpoints exist** with different request shapes; the funnel must pick one on purpose.
12. **The duty OTP is returned in plaintext with no SMS gateway behind it.** The UI must present it
    as a code to show the guard in person, never as "we've sent them a code".
13. **Membership cancellation doesn't deactivate** — benefits run to expiry, and renewing early
    extends rather than resets. The current copy doesn't say either.
14. **Booking can be gated on pending ratings** (`GET /client/rating-required`). The funnel doesn't
    check, so the block surfaces as a failure at submit instead of a prompt at the start.
15. **The site tells clients payments happen in phases. They don't, and on v6 the phasing it
    describes has been deleted outright.** `lib/support-data.ts:206` answers "How are payments
    processed?" with *"30% upfront (released at duty-start OTP) and 70% after completion within 2
    business days."* That is the v1 **provider payout** schedule, presented to a client as if it
    were their own payment schedule. Two things are wrong with it:
    - **It was never how the client pays.** On both engines the client is charged **once**, in full,
      by `POST /payments/create-order` → `amountToPayNow`, after the provider accepts. There is no
      second client charge anywhere in the client API. The funnel and `PayNowButton` are already
      correct and need no restructuring.
    - **The provider schedule it describes no longer exists on v6.** SecureConnect spec 0007 rule 1
      — *"Exactly one provider transfer per v6 booking, created `on_hold` at payment capture. NEW
      DECISION — replaces the 30/70 split"* — with rule 3, no provider money released before OTP
      end-shift under any condition, and rule 2, released T+2 business days after it. So on a v6
      booking the "30% at duty-start" leg is not merely reworded, it is gone.

    The same FAQ block carries a second, engine-independent error: *"Can I cancel my booking? — up
    to 24 hours before the service starts without penalty."* The server refunds 90%, not 100%.
    `lib/cancellation-policy.ts:23` already documents this exact contradiction; the FAQ string
    survived the fix.

## Goal

The website reads `booking.billingEngine` and `GET /public/billing-flags`, renders the correct
itemized breakdown on both engines, captures a structured deployment location, hides v1-only
discounts when they would be rejected, exposes v6 tax documents, and describes refunds, recurring
cancellation and duty OTPs the way the backend actually behaves — so flipping `billingV6.enabled`
requires no frontend change and breaks nothing.

## Non-goals / out of scope

- **No backend changes.** Every gap identified here is handled client-side or accepted and
  documented. The one genuinely missing backend capability (v6 refund disbursement) is called out
  in Open questions and is not worked around in the UI.
- **No removal of v1 support.** v1 bookings predate the cutover and stay readable forever. Both
  engines are supported side by side, permanently. This is not a migration.
- **No new checkout UI for coins, points or coupons** — the opposite: they are conditionally hidden.
  The v1 paths keep working untouched for v1 bookings.
- **No redesign.** Visual treatment of everything here is spec 0001's. Where the two touch the same
  component (`PriceSummary`) this spec defines the data contract and 0001 defines the appearance.
- **No SOS / incident / live-location UI.** `/protection/*` is reachable and unbuilt; it needs its
  own spec.
- **No provider-side anything.** Settlement statements are provider-only and must never appear in a
  client view, which is enforced server-side and mirrored here as a rule.
- **No offline or optimistic-write handling** for any of the new calls.

## Rules

| # | Rule | Source |
| --- | --- | --- |
| 1 | The engine for an **existing** booking is `booking.billingEngine`, never inferred and never cached across bookings. | `CLIENT_API_REFERENCE.md` — stamped at creation, immutable |
| 2 | The engine for a **prospective** booking (the funnel, before creation) comes from `GET /public/billing-flags` → `{ v6Enabled }`, read server-side and revalidated at most every 60s. | Reference, "the canonical way for a frontend to detect whether v6 is actually on" |
| 3 | Coins, points and coupon inputs are hidden whenever the engine is or will be v6. Not disabled, not error-handled — absent. | `SC_1424`, `SC_1425` |
| 4 | Every money figure comes from the server. Nothing is recomputed, re-derived, or shown as a remainder of other figures. | Spec 0005 rule 16; existing `lib/api/pricing.ts` doctrine |
| 5 | A v6 total is never displayed without its four component lines. | Spec 0005: "Never render a single all-in total with no breakdown" |
| 6 | All money is integer paise except `Wallet` `coinBalance`/`pointBalance`/`transactions.amount`, which are whole rupees. Unchanged, and now also true of every `*Paise` field on the quote. | Reference, Conventions |
| 7 | A settlement statement is never rendered in a client view, even if one somehow appears in a response. | Spec 0006; enforced server-side, mirrored client-side |
| 8 | Refund copy branches on engine: v1 says wallet credit, v6 says recorded as payable and not yet disbursed. Neither says "refunded to your bank". | Reference, cancellation section |
| 9 | Deployment state is captured explicitly from the user. It is never guessed from a free-text address string client-side. | `SC_1413` fails closed rather than defaulting — spec 0004 says accepting an unresolved state would mean quietly charging CGST+SGST on an inter-state supply |
| 10 | Series cancellation uses `DELETE /client/recurring-bookings/:seriesId` and states exactly which occurrences it did and did not cancel. | Reference, recurring section |
| 11 | Client-facing copy describes the **client's** payment — one charge, in full, after the provider accepts — and never the provider's payout schedule. No percentage split, no release timing, on either engine. | Spec 0007 rule 1 replaces the 30/70 split; the client's own charge was always single-phase |

## API contract deltas

Only what changes. Everything else in `CLIENT_API_REFERENCE.md` is already correctly consumed.

### `GET /api/v1/public/billing-flags` — new call

Unauthenticated. `data: { v6Enabled: boolean }`. Read in a server module with
`next: { revalidate: 60 }`; on failure assume `false` (the safe direction — a v1 UI against a v6
booking degrades to a worse breakdown, whereas a v6 UI against v1 renders `undefined`).

### `GET /api/v1/client/providers/:providerId/price-preview` — shape now depends on the engine

Query gains `deploymentState` — **a state *name*, not a code**. The controller resolves it through
`stateCodeFromName()`; a two-digit code passed here will not resolve and falls through to the
client's profile state or `SC_1413`.

**v1 response** — unchanged, as `lib/api/pricing.ts` already models it.

**v6 response** — `data` is the `Quote` object itself, not nested
(`backend/src/billing/quote/types.ts`):

```jsonc
{
  "billingEngine": "v6",
  "currency": "INR",
  "lines": [
    { "key": "service",     "label": "Security Service",        "sac": "998522", "amountPaise": 10000 },
    { "key": "serviceGst",  "label": "GST on Security Service", "ratePct": 18, "amountPaise": 1800,
      "split": { "intraState": true, "cgst": 900, "sgst": 900, "igst": 0,
                 "supplierStateCode": "05", "placeOfSupplyStateCode": "05" } },
    { "key": "platformFee", "label": "20fourr Platform Fee",    "sac": "998314", "amountPaise": 1500 },
    { "key": "platformGst", "label": "GST on Platform Fee",     "ratePct": 18, "amountPaise": 270,
      "split": { "intraState": false, "cgst": 0, "sgst": 0, "igst": 270,
                 "supplierStateCode": "07", "placeOfSupplyStateCode": "05" } }
  ],
  "providerPreGstPaise": 10000, "platformFeePaise": 1500,
  "serviceGstPaise": 1800, "platformGstPaise": 270,
  "clientTotalPaise": 13570,
  "providerPayableGrossPaise": 11800, "tcsPaise": 50, "tdsPaise": 12,
  "tdsRate": 0.001, "tdsReason": "...", "providerNetPaise": 11738,
  "platformRetainedPaise": 1832,
  "feeGstSplit": { }, "serviceGstSplit": { },
  "snapshot": { "providerTaxTier": "registered", "clientStateCode": "05",
                "deploymentStateCode": "05", "rates": { }, "quotedAt": "..." }
}
```

**Fields that exist on v1 and have no v6 equivalent:** `totalHours`, `numberOfDays`,
`isHourlyBilling`, `hourlyRate`, `dailyRate`, `totalAmount`, `providerPayout`. The funnel must
source duration from its own draft (it already has `date`, `startTime`, `hours`), and the v6 total
is `clientTotalPaise`.

**`providerPreGstPaise` is the provider's price including vehicle charges** — there is no separate
vehicle line on v6. A UI that itemizes vehicle charges must stop doing so on v6.

**Do not render** `providerPayableGrossPaise`, `tcsPaise`, `tdsPaise`, `providerNetPaise`,
`platformRetainedPaise` or `snapshot` to a client. They are the provider's economics and the
platform's margin, returned because the same object serves settlement. Client-visible fields are
`lines[]` and `clientTotalPaise`, full stop.

| Error | When | UI |
| --- | --- | --- |
| `SC_1413` | deployment state unresolvable | Ask for the deployment state. Never a raw banner. |
| `SC_1420` | provider's tax profile incomplete | Provider is not currently bookable; offer to pick another. |
| `SC_1421` | client's state unresolvable | Send the user to complete their profile address. |
| `SC_1422` | server-side invariant failure | Hard error. Do not show a price. "We couldn't price this booking — try again shortly." |
| `SC_1423` | below `minBookingValue` | Show the minimum and let them extend the duration. |

### `POST /api/v1/bookings/` — new `deployment` object

```jsonc
{
  "deployment": {
    "addressLine": "Plot 14, Sector 44",
    "city": "Gurugram",
    "stateName": "Haryana",     // or "stateCode": "06" — either resolves
    "pincode": "122003",
    "latitude": null, "longitude": null
  }
}
```

`stateCode` takes precedence and is zero-padded to two digits server-side; `stateName` / `state` are
tolerated aliases. Response `data` gains `quote` (the object above, or `null` on v1) and `amount`,
which is now engine-correct — trust `quote` on v6 and `amount` on v1.

`couponCode` on a v6 booking → `SC_1425`. Do not send the field at all on v6.

### `GET /api/v1/documents/` and `/:documentId` and `/:documentId/pdf` — new surface

Header list: `documentNumber, series, docType, financialYear, bookingId, issuedAt, status,
totalPaise, issuer.party, recipient.party, reversesDocumentId`. Client-visible `docType` values are
`platform_fee_invoice`, `service_tax_invoice`, `bill_of_supply`, and the two credit-note types on a
refund. `settlement_statement` is filtered server-side and must also be filtered client-side (rule 7).

Timing matters for the UI: the platform fee invoice is dated at confirmation, the service document
only at **duty-end OTP verification** — so a paid, in-progress booking legitimately has one document
and not the other. The empty state must say that rather than implying something failed.

Errors: `SC_1440` not found · `SC_1441` not authorized.

## Frontend data model

The central change. `PricePreview` becomes a discriminated union so TypeScript refuses to compile a
component that handles one engine and not the other:

```ts
// lib/api/pricing.ts
export type PriceQuote =
  | { engine: "v1"; v1: V1PricePreview }
  | { engine: "v6"; quote: Quote };
```

`usePricePreview()` returns `PriceQuote`, tagging the response by the presence of
`billingEngine === "v6"` on the payload. Every consumer switches on `.engine`. A shared
`toDisplayLines(q): { label, amountPaise, note? }[]` derives the render list from either branch —
v6 from `lines[]` verbatim, v1 from the named fields *plus* the honest remainder line that v1
genuinely requires — so `PriceSummary` renders one array and holds no engine logic itself.

`Quote`, `QuoteLine` and `GstSplitLine` are transcribed into `lib/api/types.ts` from
`backend/src/billing/quote/types.ts`, with a comment naming that file as the source of truth.

## File-level change list

| File | Change |
| --- | --- |
| `lib/api/billing-flags.ts` *(new)* | Server-side `v6Enabled()` with 60s revalidation, fail-closed to `false`. |
| `lib/api/types.ts` | Add `Quote`, `QuoteLine`, `GstSplitLine`, `TaxDocument`, `TaxDocumentList`. Keep the v1 invoice types. |
| `lib/api/pricing.ts` | `PriceQuote` union, `toDisplayLines()`, `deploymentState` in the query, duration sourced from the draft rather than the response. |
| `lib/api/errors.ts` | Friendly messages for `SC_1413`, `SC_1420`–`SC_1425`, `SC_1440`, `SC_1441`. Their server messages are developer-facing. |
| `app/api/bff/[...path]/route.ts` | Add `documents` and `public/` and `uploads/` to `ALLOWED_PREFIXES`; extend `BINARY_PATHS` to `documents/[^/]+/pdf`. |
| `app/book/BookingContext.tsx` | Draft gains `deployment: { addressLine, city, stateName, pincode }`. `couponCode` retained but only sent on v1. |
| `app/book/schedule/page.tsx` (or a new deployment step) | Capture city + state explicitly. State is a select from the GST state list, not free text — rule 9. Prefill from the client's saved addresses (`GET /client/saved-addresses`), which already carry structured fields. |
| `app/book/PriceSummary.tsx` | Render `toDisplayLines()`. Show CGST/SGST/IGST per GST line on v6. Delete the "GST & other charges" remainder on the v6 branch. |
| `app/book/CouponField.tsx` | Rendered only when `!v6Enabled`. |
| `app/book/confirm/page.tsx` | Send `deployment`; omit `couponCode` on v6. |
| `app/dashboard/bookings/[id]/PayNowButton.tsx` | Hide both wallet toggles when `booking.billingEngine === "v6"`; read the due figure from `amountToPayNow` as it already does. |
| `lib/cancellation-policy.ts` | `REFUND_DESTINATION` becomes a function of the engine (rule 8), not a constant. Tier percentages are identical on both engines and stay as they are. |
| `app/dashboard/bookings/[id]/CancelBookingButton.tsx` | Engine-branched refund copy. Keep the corrected 12h/24h tier boundaries. |
| `app/dashboard/bookings/[id]/BookingDetail.tsx` | Show the stored `booking.quote` breakdown on a v6 booking rather than the mirrored flat fields. |
| `app/dashboard/profile/invoices/*` | Becomes engine-aware: v6 bookings list from `/documents`, v1 from `/invoices`. Or, preferred, one "Documents & invoices" screen that merges both lists sorted by date, labelled by type. |
| `app/dashboard/profile/invoices/[id]/*` | Detail view for a tax document: line items, tax lines, issuer/recipient, `totalPaise`, PDF link. Settlement statements filtered (rule 7). |
| `app/dashboard/bookings/recurring/RecurringList.tsx` | Cancellation goes through `DELETE /client/recurring-bookings/:seriesId`; report `bookingsCancelled` and state that already-paid occurrences were not cancelled. |
| `app/dashboard/bookings/[id]/duty/DutyOtp.tsx` | Copy: this code is shown to the guard in person; nothing is texted. |
| `app/dashboard/profile/membership/MembershipClient.tsx` | Copy: cancelling keeps benefits until expiry; renewing early extends rather than resets. |
| `app/book/service/page.tsx` | Pre-check `GET /client/rating-required` and prompt to rate before the funnel, not at submit. |
| `lib/support-data.ts` | Rewrite the "How are payments processed?" answer to describe the client's single charge and say nothing about provider payout percentages or release timing (rule 11). Fix the cancellation answer to state 90% / 50% / 0% by importing `REFUND_SUMMARY` from `lib/cancellation-policy.ts` rather than restating it — the two have already drifted once. |
| `lib/api/pricing.ts` | Drop `providerPayout` from the client-facing type. It is v1-only, has no v6 equivalent, is rendered nowhere, and carrying it invites someone to render it. |
| `lib/api/uploads.ts` *(new)* | `presign` → `PUT` to S3 → `confirm`. **Written, deliberately not yet adopted** — see the amendment below. |

## Amendments made during implementation

- **Uploads stay on the multipart endpoints for now.** This spec's file list called for moving
  ratings photos and ticket attachments onto `presign` → `confirm`. On implementation that turned
  out to be weaker than assumed: `POST /tickets/:id/upload` and `POST /ratings/photo` are dedicated,
  working endpoints that store the file themselves — presign/confirm is the flow for the
  `attachments` / `photos` **key arrays** on `POST /tickets/` and `POST /ratings/`, which nothing
  uses yet. The real reason to switch is file size (a multipart POST buffers the whole file through
  this app's route handler; a presigned PUT goes browser → S3), and testing it needs an S3-configured
  backend or every call returns `SC_503`. `lib/api/uploads.ts` is kept and documented as the path to
  take when that becomes true, rather than swapping working code for untested code.

- **`recurring/:id/skip-next` does not exist and has been removed.** The recurring screen shipped a
  "Skip next" button against an endpoint that is in neither `recurring.routes.ts` nor anywhere else
  in the backend — it returned 404 on every click. There is no skip-one-occurrence capability in the
  API at all; skipping a date means cancelling that individual booking. Removed rather than stubbed.

- **Pausing a series carries the same warning cancellation does.** Problem item 10 covered
  cancellation, but `PATCH /recurring/:id/status` doesn't cascade either, and pausing is the action
  more likely to be read as "stop charging me". The row now says so inline.

- **`quotePlatformFeePaise` matched on the display label.** `/platform/i.test(line.label)` against
  copy that reads "20fourr Platform Fee" — a wording change server-side would have silently returned
  ₹0. Now matches `line.key === "platformFee"`, with `platformFeePaise` as the fallback.

- **The `GstSplitLine` array form was invented.** `types.ts` declared an alternate
  `component`/`kind`/`rateBps` array shape alongside the real `split` object. The backend returns
  only the object (`backend/src/billing/quote/types.ts`), so the array branch was unreachable code
  asserting a contract that does not exist. Removed, and `QuoteLine.key` narrowed to the real union.

## Acceptance criteria

- [ ] With `v6Enabled: true`, the full funnel completes and every money figure on every step is a
      server number. No `NaN`, no `undefined`, no `₹0` placeholder.
- [ ] With `v6Enabled: true`, the confirm step shows exactly four money lines plus a total, and the
      four lines sum to `clientTotalPaise` exactly, in paise.
- [ ] With `v6Enabled: false`, every screen behaves exactly as it does today. No v1 regression.
- [ ] The coupon field is absent from the DOM when `v6Enabled` is true.
- [ ] The wallet toggles are absent from the DOM on a booking with `billingEngine === "v6"`.
- [ ] A booking created through the funnel has a `deployment` with a resolvable `stateCode`, and
      `quote.snapshot.deploymentStateCode` matches the state the user selected.
- [ ] A client whose profile has no state can still get a price, because the funnel asks for the
      deployment state before calling the preview. `SC_1413` is never surfaced as a raw error.
- [ ] `providerNetPaise`, `tcsPaise`, `tdsPaise`, `platformRetainedPaise` and `snapshot` appear
      nowhere in rendered output (DOM scan on the confirm and booking detail screens).
- [ ] No response with `docType: "settlement_statement"` renders, under any list or detail route.
- [ ] A v6 booking past duty-end shows both the platform fee invoice and the service document, and
      both PDFs download as valid `application/pdf`.
- [ ] A v6 booking that is paid but not yet completed shows one document and an empty state that
      explains the service document is issued at shift end.
- [ ] Cancelling a v6 booking never uses the word "wallet" or "credited".
- [ ] No client-facing string anywhere contains "30%", "70%", "upfront", or a provider payout
      release time. `grep -rniE '30%|70%|upfront' app lib components` returns nothing.
- [ ] Every statement of the cancellation policy in the product resolves to
      `lib/cancellation-policy.ts`; no screen or FAQ restates the tiers in its own words.
- [ ] Cancelling a recurring series reports a count and names what was not cancelled.
- [ ] `npx tsc --noEmit` passes with no `any` introduced in the quote path.

## Test plan

- **Unit:** `toDisplayLines()` on both branches. Assert the v6 lines sum to `clientTotalPaise` using
  the spec 0005 worked example (₹100 registered → `clientTotalPaise` 13570; unregistered → 11770).
  Assert the v1 branch still produces its remainder line unchanged.
- **Integration:** a fixture pair (v1 preview response, v6 `Quote` response) driving the funnel in
  both modes. `billing-flags` stubbed both ways.
- **Manual:** the flag is `false` by default and there is no way to flip it from this repo. Ask for
  a backend environment with `PlatformSettings.billingV6.enabled = true`, **or** land behind a
  `NEXT_PUBLIC_FORCE_V6` dev-only override that shortcuts `v6Enabled()`. Without one of the two this
  spec ships untested against a real server, which is not acceptable for a money path — resolve
  before `approved`.
- **Manual flow:** register → complete profile without a state → book → confirm the deployment step
  asks for state → pay → start duty by OTP → end duty → confirm both documents appear → cancel a
  second booking at each of the three refund tiers and read the copy.
- **Regression:** every existing v1 booking in the test account renders identically before and after.

## Rollout

Sequenced so nothing is broken at any intermediate commit:

1. `billing-flags` + types + the `PriceQuote` union + `toDisplayLines()` — pure additions, v1
   behaviour byte-identical.
2. BFF allowlist and `BINARY_PATHS`.
3. Deployment capture in the funnel. Ships with the flag off: the field is collected and sent, and
   v1 ignores it harmlessly. **This one wants to ship early** — it is the only change that needs new
   user input, and having it live before the flag flips removes the riskiest coupling.
4. Conditional hiding of coupons and wallet discounts.
5. The documents surface.
6. Copy corrections (refunds, recurring, duty OTP, membership, payment model) — independent of
   everything above and shippable at any point. Arguably should go first: items 7, 10, 12, 13 and 15
   in the Problem section are wrong *today*, on v1, regardless of the cutover. Item 15's cancellation
   sentence and item 7's refund destination are the two a user could act on and lose money over.

No feature flag of our own. `v6Enabled` is the flag, and it is the backend's.

## Open questions

*Resolved 2026-09-12 against `SecureConnect/new-architecture/20fourr_Platform_Architecture_v6.0_FINAL.docx`
("Complete Platform Architecture — v6.0, CA Audit 2"), which is the authority the backend specs
implement. Sections cited as §.*

- ~~**v6 refund disbursement does not exist.**~~ **Answered: the destination is decided, and it is a
  real gateway refund to the original payment method.** §H lists "Reversal on cancellation — before
  any transfer: `POST /v1/refunds`" as a 20fourr-backend → Razorpay call; §G.1 gives "Cancelled
  before job-start → full refund to client, ₹135.70 back to client, per Razorpay refund timeline";
  §S-2 repeats it; §W.2-6 lists the refund API as a required integration. **It is not wallet credit**
  — that is the v1 behaviour, retired with v1. The architecture deliberately does not name a day
  count, deferring to "Razorpay refund timeline", so the copy must not invent one.

  What remains open is narrower and is a **backend gap, not a policy question**: the v6 cancel path
  records a credit note and `refundStatus: 'pending'`, and nothing in `src/billing/settlement/` calls
  the refund API yet. `refundDestination("v6")` now states the committed destination and is honest
  that the transfer is not yet instant.

  **That backend job is now specified: SecureConnect `specs/0009-refund-payable-release.md`.** It
  carries the exact `settled` copy this function should adopt once the job ships, so the tightening
  is a one-line change here rather than a fresh decision. The website needs nothing else from it —
  `refundState` and the two timestamps arrive on the existing `GET /client/bookings/:id` read.

  Note also that §G.1 and §S-2 describe a *full* refund before job-start, whereas the implemented
  policy tiers it 90/50/0 by proximity to the start time. The tiering is a commercial policy layered
  on the architecture's mechanism, not a contradiction of it — but it is worth a deliberate
  confirmation, because the architecture document a CA or counsel reads says "full".

- ~~**Is the deployment location a new funnel step or a field on the schedule step?**~~
  **Answered, and implemented.** §W.2-17 requires: "capture DEPLOYMENT LOCATION (not client billing
  address); **only show providers who hold PSARA for that deployment state**". Filtering the
  provider list means the state has to be known *before* the provider step — so folding it into
  Schedule (this spec's original recommendation, and step 4 of 8) was wrong.

  The deployment state now sits on the **Service step**, beside the city that step already collects,
  and `furthestStep` gates step 0 on it. Provider search sends `state` alongside `city` (the backend
  accepts both — `providerDiscovery.service.ts` matches `serviceState`). Changing either the state or
  the city clears the selected provider, since that provider may not be licensed in the new one.

  The existing `ignoreCity` escape hatch is generalised to `ignoreLocation` and covers both. It has
  to: `serviceState` has the same empty-on-current-records data gap as `serviceCitiesNorm`, so a
  state filter would otherwise zero out every search. Widening stays an explicit, named choice and
  the notice now warns that a widened provider may not be licensed for the deployment state — which
  becomes a hard `SC_1414` rejection once `REQUIRE_PSARA_STATE_MATCH` is on.

  Side effect worth having: `SC_1413` can no longer reach the price step, because the state is
  captured three steps before a price is ever requested.

- **Will `billingV6.enabled` be true at launch?** Still open — the architecture describes the target
  state, not the cutover date. §W.1 lists twenty CA/GST confirmations that must be signed off "before
  going live", several of which (SAC for the platform fee, the 194-O threshold treatment, place of
  supply for the service invoice) are inputs to the engine itself, so the flag realistically follows
  that sign-off rather than a release.

- **Which waiver endpoint?** Recommend `POST /bookings/:bookingId/waivers` — its four independently
  settable booleans match the funnel's four gates exactly, unlike `POST /client/bookings/:id/waivers`
  which takes two and requires both true.

- **Should `/public/*` be proxied through the BFF at all,** or called server-side from the marketing
  routes? Server-side is better for the landing page (static, cacheable, no token). The BFF prefix is
  only needed if an authenticated client page ever calls a public endpoint. Recommend server-side
  only, and drop `public/` from the allowlist unless a case appears.
