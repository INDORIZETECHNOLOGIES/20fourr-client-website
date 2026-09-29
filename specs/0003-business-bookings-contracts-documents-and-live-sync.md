# 0003 — Business bookings, contracts, document history, personnel and live sync

| | |
| --- | --- |
| **Status** | draft |
| **Author** | Santosh Kumar |
| **Created** | 2026-09-28 |
| **Apps touched** | website (this repo) |
| **Branch** | |
| **PR** | |
| **Backend contract** | SecureConnect `backend/specs/` [0011](../../SecureConnect/backend/specs/0011-booking-headcount-and-provider-capacity.md) headcount, [0012](../../SecureConnect/backend/specs/0012-city-scoped-rate-cards.md) city rates, [0013](../../SecureConnect/backend/specs/0013-package-pricing-and-date-range-bookings.md) packages, [0014](../../SecureConnect/backend/specs/0014-long-term-contracts-and-recurring-advance-billing.md) contracts, [0016](../../SecureConnect/backend/specs/0016-client-billing-document-history.md) documents, [0017](../../SecureConnect/backend/specs/0017-deployed-personnel-profiles.md) personnel, [0020](../../SecureConnect/backend/specs/0020-realtime-account-events.md) live events |
| **Mobile counterpart** | SecureConnect `mobile/specs/0018` |

Spec numbers without a repo name mean the backend's (see `INDEX.md`). Each part below ships when
its backend spec ships. The mobile client app gets the same features in `mobile/specs/0018`, and
the two must behave the same. **Where they differ, the backend response is the tiebreaker.**
Neither frontend computes money.

## Problem

The story is: *"As a client, I want to access 20fourr through the web platform with the same
features and real-time data as the mobile app."* Most of the client surface now exists here
(booking funnel, bookings, documents, chat, profile). Two gaps are structural:

1. **The new B2B features** (multi-person and date-range bookings, long-term contracts with a
   payment mandate, a single document history, assigned personnel) are being specified for
   mobile. Unless they're specified here at the same time, the web falls behind on exactly the
   features business clients, the most likely web users, need.
2. **No live data.** The only socket here is chat (`hooks/useChatSocket.ts`). A booking accepted
   by the provider, a payment captured or a contract suspended isn't reflected until the page is
   reloaded, because the backend only sends those as mobile push. Backend 0020 adds an
   `account_event` socket event, and this repo has to consume it.

## Goal

A client can do everything in backend 0011–0017 on the website as in the app. Every open
dashboard page updates within seconds when the thing it shows changes on the server.

## Non-goals / out of scope

- **A full parity audit** of every older mobile screen. `docs/ROADMAP.md` tracks that. This spec
  covers only the features above plus live sync.
- **Web push notifications** (browser Push API). Backend 0020 excludes them too.
- **Offline support.**
- **Any money arithmetic.** Amounts come from the preview, quote and contract endpoints. Paise →
  rupees only at render, through `lib/money.ts`. `npm run test:quote` must stay green.
- **Changing design system v2 (spec 0001).** New UI uses its tokens, radii and type scale.
- **Provider-facing screens.** That's the separate provider website.

## Parts

### A. Booking funnel: `app/book/schedule` (0011, 0013)

1. **"For business" checkbox** on the schedule step.
   - Off: today's single date + start time, unchanged.
   - On: **Start date**, **End date**, **Start time**, and shift length (default from the
     provider's `totalHoursPerDay`).
   - The checkbox never changes the price (0013 rule 10). If the client isn't
     `registered_business` with a GSTIN, show a non-blocking link to `/dashboard/profile/edit`.
2. **Headcount stepper** (1 to server `maxHeadcount`). Fixed at 1 with an explanation for
   individual providers.
3. **`PriceSummary`** renders the v6 quote's package breakdown (`pricingBasis`, periods,
   remainder days) as display lines in `toDisplayLines`, with fixtures added to
   `npm run test:quote`.
4. `paymentPath: 'contract'` → the confirm step becomes **Request contract** and goes to part B.
5. Blocked dates: extend the existing `blockedDates` check to the whole range. For
   `headcount > 1`, also call the capacity-aware search/preview so the client learns about
   `SC_1503` before submitting.

**As built (A):**
- **"For business" off** keeps the request exactly as before. Headcount is only sent above one,
  so a single booking's `POST /bookings` body and preview query are unchanged (AC 1).
- **"For business" on** adds a last day and a people stepper.
  - A range means the same daily shift on every day from the first day to the last. That is how
    the backend prices it (`startDate`/`endDate` + `startTime`/`endTime`); it has no
    `shiftHours` parameter, so AC 2's `shiftHours` is carried by `endTime`.
  - `scheduleWindow()` in `lib/api/pricing.ts` builds that window once, for both the preview and
    the booking.
  - Turning the switch off resets the range and headcount to one person, one day.
- **Individual providers** keep the stepper fixed at 1, with the reason shown. The provider's
  kind is carried from the search card.
- **Headcount ceiling.** The stepper allows up to 50, the backend's
  `PlatformSettings.booking.maxHeadcount` default. The real limit isn't exposed to clients; the
  preview refuses anything above it with SC_1501, and that message is shown.
- **Blocked dates** are checked across the whole range.
- **SC_1503** (not enough staff on every date) is caught when the booking is submitted. There is
  no separate capacity preview, because the price preview doesn't check capacity.
  SC_1500/1501/1502 map to plain messages as well.
- **Price summary.** The service line reads "Service charge (N people)" and carries the server's
  basis as its note ("Monthly package per person: 1 month + 5 days, cheaper than 35 days at the
  daily rate", or "Daily rate per person × N days"). Fixtures are in `npm run test:quote` (AC 4).
- **`paymentPath: 'contract'`** blocks the step with an explanation instead of routing to
  `/book/contract/review`. Contracts are switched off (backend 0014), so part B doesn't exist
  yet. AC 3 applies once part B ships.
- **GSTIN link.** A client who isn't a `registered_business` gets a non-blocking link to add a
  GSTIN.
- **Verified** against the local API: a 35-day, 4-person Mumbai guard booking previews as a
  monthly package (1 month + 5 days), with the service line at four times the per-person price.

### B. Contracts: new `app/dashboard/contracts` (0014)

- `/book/contract/review`: `POST /contracts/quote`, a cycle table, the notice period, and the
  plain-language suspension rule. Submit → `POST /contracts`.
- `/dashboard/contracts` list and `/dashboard/contracts/[id]` detail: status, mandate status,
  cycle timeline, next charge, **Pay now** when suspended or due, **Give notice**, **Change bank
  mandate**.
- Checkout: `POST /contracts/:id/checkout` → Razorpay web checkout (`lib/razorpay.ts`) with
  `recurring` / `customer_id` from the server's order. Method list from the server. eNACH
  "pending confirmation" state.
- Cycle rows link to `/dashboard/bookings/[id]`, which already handles documents, the provider
  invoice, disputes and chat.
- Sidebar gains **Contracts**, shown only when the server reports contracts enabled
  (`/public/billing-flags` or its successor, whichever exposes `contracts.enabled`).

### C. Documents: replace `app/dashboard/profile/invoices` list (0016)

- List from `GET /client/billing-documents` with FY / date-range / type filters, instead of
  merging `/invoices` and `/documents` on the client.
- **Download CSV** and **Download ZIP** for the current filter through the BFF, streamed to the
  browser. `SC_1571` shown inline.
- Existing `[id]` detail pages stay and are linked from each row.

### D. Personnel on booking detail (0017)

- An **Assigned team** panel in `BookingDetail.tsx`. It renders only the fields present in
  `GET /client/bookings/:id/personnel`, and the page never decides visibility.
- Photos load from the short-lived URL with `referrerPolicy="no-referrer"`. No `next/image`
  optimisation, since that would proxy and cache the image.
- **Rate your team** after completion, per person.

### E. Live sync (0020)

- New `hooks/useAccountEvents.ts`: one socket per session, using the existing
  `app/api/auth/socket-token` route. It listens for `account_event`. Reuse the connection
  handling in `useChatSocket.ts` rather than duplicating it. If both hooks can share one socket,
  do that.
- On an event, invalidate the matching `useApiQuery` keys: `booking` → that booking plus the
  bookings list; `contract` → that contract plus the list; `document` → the documents list;
  `payment` → the booking. Refetch happens through the BFF as usual. **Event payloads are never
  rendered.**
- On reconnect after a disconnect, invalidate all dashboard queries once (missed events aren't
  replayed).
- The notification bell count refetches on every event.

## Acceptance criteria

1. With "For business" off and headcount 1, the `POST /bookings` body is byte-identical to
   today's.
2. Headcount 4 and a date range send `headcount`, `startDate`, `endDate`, `startTime` and
   `shiftHours` to price preview. The total shown equals the response's total ÷ 100.
3. A preview with `paymentPath: 'contract'` routes to `/book/contract/review`.
4. `npm run test:quote` has fixtures for `pricingBasis: 'package'` with periods and remainder
   days, and passes.
5. `npm run check:design` passes on every new route.
6. Documents list is served by one call to `/client/billing-documents`. No client-side merge
   code remains.
7. With a booking page open in one tab, accepting it from the provider side updates the status
   in that tab within 5 s, without a reload.
8. Killing the socket and restoring it triggers exactly one full dashboard refetch.
9. Personnel panel before payment shows no name or phone field.
10. The Contracts nav item is hidden when contracts are disabled.
