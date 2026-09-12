# Client API Reference

Every endpoint a **client** (the person booking guard/bouncer/gunman/PSO security services) needs
to build a frontend against. Companion to `backend/docs/PROVIDER_API_REFERENCE.md` — same
conventions, same source-of-truth caveats. Generated from `src/routes/*.ts`, `src/validators/*.ts`
and the corresponding controllers on `master` as of 2026-09-11.

This is a reference snapshot, not a contract — re-check the source before relying on a field name
in production, especially response shapes, which were extracted from controller code rather than
from a schema.

## Conventions

- **Base URL**: `/api/v1` (production: `https://indorize.com/api/v1`).
- **Auth**: Bearer JWT in `Authorization: Bearer <accessToken>`, from `/auth/login` or
  `/auth/verify-otp`. Client-role routes additionally require `role === 'client'`
  (`requireRole('client')` at the mount point) — a provider-role token gets `SC_109`.
- **Envelope** — success: `{ "success": true, "data": { ... }, "requestId": "..." }` (some write
  endpoints return `message` instead of/alongside `data` — noted per endpoint). Error:
  `{ "success": false, "error": { "code": "SC_xxx", "message": "..." } }`.
- **Error codes**: every `SC_xxx` is defined in `src/utils/errorCodes.ts`, the canonical source.
  The full catalog is reproduced in `PROVIDER_API_REFERENCE.md`'s Appendix A — not repeated here.
- **Money**: integer **paise** everywhere except `Wallet.transactions.amount`/`coinBalance`/
  `pointBalance` (whole rupees — the platform's one documented exception).
- **Build against v6, not v1.** `Booking.billingEngine` is stamped `'v1'` or `'v6'` at creation and
  immutable. This project's direction is v6-only going forward — v1 is legacy, kept alive only for
  bookings created before the cutover. `PlatformSettings.billingV6.enabled` still defaults to
  `false` in code as of this writing; check `GET /public/billing-flags` (below) to see whether it's
  on in whatever environment you're pointing at. On the client side this matters most at
  **booking creation** (`POST /bookings/`) and **cancellation** — see those sections for exactly
  how the engine is chosen and what changes. SecurePoints, SecureCoins and coupons are v1-only and
  OFF on the v6 path — do not build new checkout UI around them.
- **Client profile gate**: `POST /bookings/` requires a complete client profile
  (`requireClientProfileComplete` — name + phone + address; else `SC_702`) and, when
  `REQUIRE_ARMED_CLIENT_KYC=true` (currently off), a KYC-verified identity for gunman/PSO bookings
  (`SC_703`).
- **PII gating**: provider contact details and the client's own threat profile are hidden on a
  booking until `booking.status` reaches `payment_done` — see `GET /bookings/:bookingId`.
- **Pagination**: list endpoints that accept `page`/`limit` return
  `{ ..., pagination: { page, limit, total, pages } }` unless noted otherwise.

---

## Auth — `/api/v1/auth/*`

Shared by both `client` and `provider` roles — pass `role: 'client'` on register/login so a client
account can't authenticate as a provider and vice versa. Full detail (every endpoint, request/
response shapes) is in `PROVIDER_API_REFERENCE.md`'s Auth section — identical here, just swap
`role: 'provider'` for `role: 'client'`. Quick index:

- `POST /auth/register` `{ name, email, phone, password, confirmPassword?, role: 'client', referralCode?, termsAcceptedAt, ... }`
- `POST /auth/login` `{ email, password, role?: 'client' }` → `{ user, tokens, requiresVerification }`
- `POST /auth/refresh-token`, `/send-otp`, `/verify-otp`, `/forgot-password`, `/reset-password`
- `POST /auth/device-token`, `DELETE /auth/device-token` (auth) — FCM push token registration, duplicates `POST /notifications/device-token`
- `POST /auth/logout`, `/send-email-verification`, `/verify-email`, `/accept-terms` (auth)
- `GET /auth/me` (auth) → `{ user: { _id, name, email, phone, role, profilePhoto, emailVerified, phoneVerified, kycStatus } }`
- `PATCH /auth/profile-photo` (auth, multipart `file`)
- `POST /auth/change-password/send-otp`, `/change-password` (auth)
- MFA: `POST /auth/mfa/{setup,confirm,verify,disable}` (auth, TOTP-based)

---

## Direct-to-S3 uploads — `/api/v1/uploads/*`

Identical to the provider doc's Upload section. Auth required (any role). Folders allowed:
`documents|avatars|gallery|chat|tickets|ratings`.

### POST /api/v1/uploads/presign
Body: `{ folder, contentType, contentLength, fileName? }` → `data: { uploadUrl, key, expiresIn: 300, contentType, contentLength }`. Client `PUT`s to `uploadUrl` directly. Errors: `SC_301` bad folder/type/size · `SC_503` S3 not configured.

### POST /api/v1/uploads/confirm
Body: `{ key }` → `data: { key, size, mimeType }`. Errors: `SC_301` (unowned/missing/oversized/type-mismatched — object deleted from S3 on any rejection). Required before any handler accepts the key.

---

## Duty — OTP-based shift lifecycle — `/api/v1/duty/:bookingId/*`

The client-callable half of this surface — full detail (including the provider-only `verify-*`/
`confirm-guard-*` endpoints, for context) is in `PROVIDER_API_REFERENCE.md`'s Duty section.

### POST /api/v1/duty/:bookingId/generate-start-otp (client only)
Precondition: `booking.status === 'payment_done'`.
Response `data`: `{ otp, expiresIn: 1800, message }` — **the plaintext OTP is returned directly in
the response**; there is no SMS gateway wired for this today, so show/share it with the provider in
person (or however your UI represents "hand this code to your guard").
Errors: plain `AppError` (no `SC_` code) — 404 not found, 403 not-your-booking, 400 wrong status, 400 duty already started.

### POST /api/v1/duty/:bookingId/generate-end-otp (client only)
Precondition: `booking.status === 'duty_started'`. Response `data`: `{ otp, expiresIn: 3600, message }`.

### GET /api/v1/duty/:bookingId/status (client or provider)
Response `data`: `{ bookingStatus, dutySession: { startOtpVerified, dutyStartedAt, endOtpVerified, dutyEndedAt } | null }`

Notes: verifying either OTP is the *provider's* action (they type the code you generated). Once the
end-OTP is verified, on a v6 booking the service document + settlement statement are issued and
revenue is recognised (Ind AS 115) — see the Tax Documents section below for where the client can
then read the service document.

---

## Protection — SOS / live location / incidents — `/api/v1/protection/*`

### POST /api/v1/protection/:bookingId/sos (client or provider)
Precondition: `booking.status === 'duty_started'`. Body: `{ latitude?, longitude?, address?, note? }`
Response `data`: `{ sosId, status: 'active', message }`
Errors: `SC_1309` not a party · `SC_1201` debounced (one SOS per booking per 30s).
Notes: fires an admin notification + counterparty push notification synchronously.

### POST /api/v1/protection/:bookingId/incidents (client or provider)
Precondition: `booking.status` ∈ `{duty_started, duty_ended, completed, settled}`.
Body: `{ category (safety_threat|theft|property_damage|medical_emergency|misconduct|no_show|equipment_failure|other), description (5–4000 chars), severity? (low|medium|high|critical, default medium), attachments? (max 10 URLs), latitude?, longitude?, address? }`
Response `data`: `{ incident }`

### GET /api/v1/protection/:bookingId/incidents (parties or admin)
Response `data`: `{ incidents: [<populated reporter: {name, role}>] }`

### GET /api/v1/protection/incidents/:incidentId (reporter/counterparty via booking, or admin)
Response `data`: `{ incident }`

(`POST /:bookingId/location` — the provider's GPS heartbeat — is provider-only; a client frontend
never calls it, but can read its results through the booking/duty status or an incident record.)

---

## Chat — two parallel surfaces on the same data

⚠️ Same caveat as the provider doc: **two** route surfaces read/write the same `ChatMessage`
collection. Treat `/chat/:bookingId` (standalone) as primary — real pagination, a global unread
counter, an upload endpoint. `/bookings/:bookingId/chat/*` is a simpler `?since=`-timestamp polling
variant. Both gate on `booking.status` ∈ `{payment_done, duty_started, duty_ended, completed}`.

### GET /api/v1/chat/:bookingId — `data: { messages, pagination: {page, limit, total, pages} }`
### POST /api/v1/chat/:bookingId — body `{ content (max 1000) }` → `data: { message }`. Errors: `SC_301` (reused code — just means empty/too-long content here, not KYC).
### PUT /api/v1/chat/:bookingId/read → `data: { markedRead }`
### GET /api/v1/chat/unread → `data: { unreadCount }`
### POST /api/v1/chat/:bookingId/upload (multipart `file`) → `data: { message }` with `fileUrl` presigned. Errors: `SC_301` if no file.
### GET /api/v1/bookings/:bookingId/chat (nested) → `data: { chat: { _id, bookingId, clientId, providerId, lastMessageAt, messageCount, isClient } }`
### GET /api/v1/bookings/:bookingId/chat/messages?since=<ISO> → `data: { messages }` (no pagination envelope)
### POST /api/v1/bookings/:bookingId/chat/messages — body `{ content }` → `data: { message }`
### PUT /api/v1/bookings/:bookingId/chat/read → `data: { markedRead }`

---

## Ratings — `/api/v1/ratings/*`

Symmetric — the client rates the provider (and vice versa) after `completed` status.

### POST /api/v1/ratings/
Body: `{ bookingId, toUserId (the provider's userId), rating (1-5), review? (max 500), detailedRatings? {professionalism,punctuality,communication,cleanliness,compliance}, tags? (max 10, fixed enum), anonymous?, photos? (S3 keys from /ratings/photo) }`
Response `data`: `{ ratingRecord }`
Errors: `SC_209` missing field · `SC_1004` rating out of range · `SC_401` booking not found · `SC_109` not a party / wrong `toUserId` · `SC_402` booking not `completed` · `SC_1002` already rated.
Notes: rating a provider recomputes `ProviderProfile.rating.average`/`.count` synchronously.

### POST /api/v1/ratings/photo → `data: { fileUrl (S3 key), fileName, fileSize }`. Errors: `SC_309` no file.
### GET /api/v1/ratings/user/:userId → `data: { ratings, pagination }`. Only `visibility: 'public'`; anonymous+approved ratings redact `fromUserId`.
### GET /api/v1/ratings/my-status → `data: { ratingRequired, pendingRatings: [{_id}] }` — nudges the client to rate completed bookings before booking again (root CLAUDE.md `BR` rule referenced in client.validators.ts as `checkRatingRequiredValidator`, also exposed at `GET /client/rating-required` — same underlying concept, different endpoint; see the Client Profile section).
### POST /api/v1/ratings/:ratingId/report → body `{ reason (inappropriate|spam|fake|offensive|other), description? }`. No `data`.

---

## Wallet — `/api/v1/wallet/*`

⚠️ **Every amount here is whole rupees, not paise.** SecurePoints (pre-GST discount, capped 20% of
booking) and SecureCoins (post-GST discount, uncapped) are **v1-only — off on the v6 path**. Do not
build new checkout UI that assumes coin/point redemption works on a v6 booking; check
`GET /public/billing-flags` or `booking.billingEngine` before offering it.

### GET /api/v1/wallet/
Response `data`: `{ coinBalance, coinLifetimeEarned, coinLifetimeSpent, pointBalance, pointLifetimeEarned, pointLifetimeSpent (all rupees), pointUsageLimitPct (e.g. 20), walletExpiryDays, transactions: [<last 20: {currency:'coin'|'point', type:'credit'|'debit', amount (rupees), reason, expiresAt?, bookingId?}>] }`

### GET /api/v1/wallet/transactions
Query: `page?`, `limit? (max 100)`, `currency?`. Response `data`: `{ transactions, totalCount, page, limit, totalPages }`

---

## Referral — `/api/v1/referral/*`

### GET /api/v1/referral/my-code → `data: { referralCode, shareLink }` (`shareLink` is a hardcoded client-app domain — build your own from `referralCode` instead). Errors: `SC_110`.
### POST /api/v1/referral/apply — body `{ referralCode? }` → `data: { message, pointsEarned (rupees), deferredPoints (rupees), deferredMessage }`. Errors: `SC_110`, plus plain 400s (invalid/self/already-referred, no `SC_` code).
### GET /api/v1/referral/stats → `data: { totalReferred, successfulBookings, totalEarned (rupees), milestones, referrals }`
### GET /api/v1/referral/leaderboard → `data: { leaderboard, period: 'current_month' }`
### GET /api/v1/referral/milestones → `data: { milestones, currentProgress }`

---

## Support tickets — `/api/v1/tickets/*`

### POST /api/v1/tickets/ — body `{ type (dispute|misconduct|payment|absence|misbehaviour|quality|grievance|other), subject (5-100), description (10-1000), bookingId?, priority? (default medium), attachments? }` → `data: { ticket }`
### GET /api/v1/tickets/ — query `status?, type?, priority?, sortBy?, page?, limit?` → `data: { tickets, pagination }` (scoped to the caller)
### GET /api/v1/tickets/:ticketId → `data: { ticket }` (attachments presigned). Errors: `SC_901`, `SC_109`.
### POST /api/v1/tickets/:ticketId/message — body `{ message, attachments? }`. Errors: `SC_902` if ticket already closed.
### POST /api/v1/tickets/:ticketId/upload → `data: { fileUrl (raw key), fileName, fileSize }`
### PUT /api/v1/tickets/:ticketId/close → Errors: `SC_903` already closed.

---

## Notifications — `/api/v1/notifications/*`

### GET /api/v1/notifications/ — query `page?, limit?, isRead?, type?` → `data: { notifications, pagination }`
### GET /api/v1/notifications/unread-count → `data: { unreadCount }`
### PUT /api/v1/notifications/read-all — body `{ notificationType? }`
### POST /api/v1/notifications/device-token — body `{ token, platform, deviceName? }` (duplicates `POST /auth/device-token`)
### PUT /api/v1/notifications/:notificationId/read → `data: { notification }`
### DELETE /api/v1/notifications/:notificationId

---

## Payments — `/api/v1/payments/*`

### GET /api/v1/payments/booking/:bookingId (client or provider party, or admin)
Response `data`: `{ status, amount (paise), amountINR (rupees), platformFee (paise), providerPayout (paise), createdAt }`
Errors: `SC_501` no Payment doc · `SC_109` not a party.

(`createOrder` and `verifyPayment` — the checkout flow — are documented in full in the Booking &
Checkout section below, since a client can't call them meaningfully without first having created a
booking.)

---

## Invoices — `/api/v1/invoices/*` (v1 billing engine — legacy, do not build new UI against this)

Applies only to `billingEngine: 'v1'` bookings — pre-cutover history. **New checkout/receipt UI
should use Tax Documents below.**

### POST /api/v1/invoices/generate/:bookingId (client or provider party)
Response `data`: `{ invoice: { invoiceNumber, type: 'client'|'provider', lineItems, taxLines, subtotalAmount, platformFee, gstAmount, serviceGstAmount, tcsAmount, totalAmount (all paise), clientSnapshot/providerSnapshot, bookingRef, serviceCategory, serviceStartDate, serviceEndDate } }`
Errors: plain `AppError`s, no `SC_` code. Idempotent (returns the existing invoice if already generated). Only available once `status` ∈ `{payment_done, duty_started, duty_ended, completed}`.

### GET /api/v1/invoices/ → `data: { invoices: [<type:'client' for a client caller>], pagination }`
### GET /api/v1/invoices/:invoiceId → `data: { invoice }`
### GET /api/v1/invoices/:invoiceId/pdf → streams `application/pdf`

(A client can also reach the v1 invoice HTML/JSON directly at `GET /client/bookings/:bookingId/invoice`
and `.../invoice-data` — see the Client Profile & Bookings section; those are a separate, older
surface from this one, not a duplicate route for the same handler.)

---

## Tax Documents — `/api/v1/documents/*` (v6 billing engine — build against this)

The v6 counterpart to Invoices, and what this project's checkout/receipts UI should be built
around. Read-only — issuance is lifecycle-driven at duty-end OTP, no on-demand POST. A client can
see the **platform fee invoice** (20fourr → client, dated at confirmation) and the **service
document** (provider → client, dated at OTP end-shift — `service_tax_invoice` if the provider is
GST-registered, `bill_of_supply` if not). **The settlement statement is provider-only — a client
never sees it, even on their own booking**, per root `CLAUDE.md`'s "explicitly not a tax invoice"
rule; the list/get endpoints enforce this server-side.

### GET /api/v1/documents/
Query: `bookingId?`, `docType?` (`platform_fee_invoice`|`service_tax_invoice`|`bill_of_supply`|`settlement_statement`|`platform_credit_note`|`service_credit_note` — the last four will never appear for a client except the two credit-note types on a refund), `from?`/`to?`, `series?`, `financialYear?`, `page?`, `limit?`.
Response `data`: `{ documents: [<header-only: documentNumber, series, docType, financialYear, bookingId, issuedAt, status, totalPaise, issuer.party, recipient.party, reversesDocumentId>], pagination }`

### GET /api/v1/documents/:documentId → full document (line items, tax lines, issuer/recipient, `totalPaise`). Errors: `SC_1440` not found · `SC_1441` not authorized.
### GET /api/v1/documents/:documentId/pdf → streams `application/pdf`.

---

## Booking & Checkout — `/api/v1/bookings/*` and `/api/v1/payments/*`

This is the core client flow: create a booking, pay for it, and manage it afterward.
`Booking.billingEngine` is decided **once**, at creation, from the global
`PlatformSettings.billingV6.enabled` flag — not from anything in the request — and every
downstream endpoint (payment, cancellation, documents) branches on whatever got stamped.

### POST /api/v1/bookings/ (client only) — create a booking
Auth: `requireRole('client')`, then `requireClientProfileComplete` (name+phone+address, else `SC_702`).
Request body: `{ providerId, serviceCategory, startDate, startTime, endDate, endTime, vehicleOption?, notes?, bookingPurpose?, bookingPurposeDetail?, couponCode?, deployment? (spec 0004 structured location), clientRiskAcknowledged, safetyDisclaimerAccepted, bookingConfirmationWaiverAccepted, providerAbsencePolicyAcknowledged }` — **all four waiver booleans are mandatory**; missing any → `SC_209`.
Response `data`: `{ booking: <full Booking doc>, amount: <engine-correct breakdown — see below>, quote: <the raw v6 Quote object, or null on a v1 booking> }`

**Fixed 2026-09-11**: `data.amount` now reflects whichever engine actually priced the booking —
previously it always returned the raw v1 rate-card calculator output, even on a v6 booking, which
would have shown the wrong total.
- **v1**: `{ baseAmount, vehicleCharges, subtotal, platformFee, gst, totalAmount, providerAdvance, providerFinal, isNightShift, isUrgentBooking, surchargeType, surchargeAmount, surchargePercentage, convenienceFee, isMemberBooking, providerGstStatus, clientType, serviceGstAmount, reverseChargeApplicable, gstExempt, tcsAmount, platformCommissionGst, couponCode, couponDiscountPaise, finalPayableAmount }` (all paise).
- **v6**: `{ baseAmount, platformFee, gstAmount, serviceGstAmount, tcsAmount, totalAmount, finalPayableAmount, providerPayout, totalHours, numberOfDays, isHourlyBilling, hourlyRate, dailyRate, couponCode: null, couponDiscountPaise: 0 }` (all paise) — sourced from the same `quote` object also returned alongside it, so the two never disagree.

On a v6 booking, `booking.quote` (persisted on the document) is the immutable source of truth, and
these legacy fields on the booking document are mirrored from it (for anything that still reads
the old flat fields — dashboards, lists, this doc's own invoice endpoints below):
`subtotalAmount = quote.providerPreGstPaise`, `platformFee = quote.platformFeePaise`,
`gstAmount = quote.platformGstPaise`, `serviceGstAmount = quote.serviceGstPaise`,
`tcsAmount = quote.tcsPaise`, `totalAmount = finalPayableAmount = grossTotalBeforeCoupon =
quote.clientTotalPaise`, `surchargeAmount = convenienceFee = platformCommissionGst = 0`,
`providerPayoutAtBooking = 0` (no 30/70 split in v6), `providerPayoutAtCompletion =
quote.providerNetPaise`.

**Fixed 2026-09-11**: a `couponCode` submitted on a v6 booking is now rejected outright with
`SC_1425` (`COUPON_NOT_AVAILABLE_V6`), instead of silently computing a discount that the v6-quote
mirror would then discard — coupons are still v1-only, but the endpoint no longer pretends
otherwise. Hide the coupon field client-side for v6 bookings; the server now backs that up.

Errors: `SC_209` missing field/waiver · `SC_410` start date in the past · `SC_601` provider not
found · `SC_602` provider not verified · `SC_603` provider suspended · `SC_611` gunman/PSO booking
against a provider with no verified arms licence · `SC_612` ex-serviceman category, unverified
discharge cert · `SC_703` armed-category client KYC required (only when `REQUIRE_ARMED_CLIENT_KYC=true`,
currently off) · `SC_412` blocked relationship either direction · `SC_406` provider unavailable for
the slot · **`SC_1425` coupon code submitted on a v6 booking** · plus v6-deployment errors from
`buildQuote` (`SC_14xx` range).
Notes: PSARA validity is checked against the **service start date**, not "now." A Redis lock
around the provider+date-range prevents two clients double-booking the same slot.

### POST /api/v1/bookings/:bookingId/waivers (client only)
Body: `{ clientRiskAcknowledged?, safetyDisclaimerAccepted?, bookingConfirmationWaiverAccepted?, providerAbsencePolicyAcknowledged? }` (any subset — each is independently settable, each stamps its own `*At` timestamp).
Response: `{ success, message: "Waivers acknowledged" }` — **no `data`**.
Errors: `SC_401` not found · `SC_109` not this client's booking.

⚠️ There is a **second, separate** waiver-acknowledgment endpoint at
`POST /client/bookings/:bookingId/waivers` (`client.controller.ts`'s `acknowledgeRiskDisclaimer`,
body `{ riskAcknowledged, disclaimerAccepted }` — both required `true`) — two different routes
under two different base paths hitting two different handlers that overlap in purpose but not in
request shape. Pick one deliberately; don't assume they're interchangeable.

### GET /api/v1/bookings/:bookingId/documents (client only)
Response `data`: `{ documents: [<presigned fileUrl>] }`
Errors: `SC_401` · `SC_109` · `SC_1309` (reused code) — not yet unlocked: booking must be
`payment_done`+ **and**, while still `payment_done`, within 24h of the service start date.
Notes: for a **firm** provider, returns only documents uploaded for *this* booking
(`POST /bookings/:bookingId/firm-documents`); for an **individual** provider, returns their general
verified KYC documents instead.

### POST /api/v1/bookings/:bookingId/cancel (client only)
Body: `{ reason? }`. Response: `{ success, message: "Booking cancelled" }` — **no `data`**; re-`GET`
the booking to see the refund outcome.
Errors: `SC_401` · `SC_109` · `SC_405` already past `payment_done` (duty started/ended/completed/cancelled) · 409 lost the cancel-claim race.
Refund only runs if the booking had reached `payment_done`. Tiered rate on `finalPayableAmount`:
**>24h before duty start = 90%, 12–24h = 50%, <12h = 0%** — identical formula on both engines, but
what happens with the refunded amount diverges completely:
- **v1**: `Payment.status → 'refunded'`; coins/points used are returned proportionally to the
  wallet, and the remaining cash portion is credited as **SecureCoins** — `cancellation.refundStatus: 'processed'`.
  No Razorpay gateway refund is ever issued; it always becomes wallet credit.
- **v6**: `Payment.status → 'refunded'`, but the wallet is never touched (coins are off on v6).
  Instead it records a credit note / ledger entry (`onBookingCancelled`) and sets
  `cancellation.refundStatus: 'pending'` — **the refund is recorded as owed, not disbursed**; a
  separate settlement process is what would actually move money. (As of this writing this path is
  unexercised in production — v6 is off and no v6 booking has gone through cancellation yet — so
  treat it as tested-in-code, not tested-in-production.)

### POST /api/v1/bookings/:bookingId/dispute (client only)
Body: `{ reason (required), description? }` → `data: { ticket }` (auto-created support ticket, `type: 'dispute'`)
Errors: `SC_401` · `SC_109` · `SC_402` not yet `duty_started`+ or already `disputed`.
Notes: sets `booking.status = 'disputed'`; on a v6 booking, also freezes the settlement release
(`onDisputeRaised`) per spec 0007 — a failure there is logged, not fatal to filing the dispute.

### POST /api/v1/bookings/:bookingId/absence-alert (client or provider)
Identical for both roles — see `PROVIDER_API_REFERENCE.md`'s Bookings section for the full
penalty/PSARA-block/ticket detail.

### POST /api/v1/payments/create-order (client, must be the booking's client)
Request body: `{ bookingId, coinsToUse? (paise), pointsToUse? (paise) }` (+ optional
`x-idempotency-key` header).
Response `data`: `{ razorpayOrderId, bookingTotal (paise, gross), pointsUsed (paise), coinsUsed (paise), couponCode, couponDiscount (paise), couponDiscountRupees, serviceGstSaving (paise), grandTotal (paise — quote.clientTotalPaise on v6, recomputed v1 total otherwise), amountToPayNow (paise — what Razorpay actually charges), currency: 'INR', bookingId }`
Errors: `SC_209` missing bookingId · `SC_401` · `SC_109` · **`SC_1424`** coins/points on a v6
booking (blocked outright — the one place v6 discount-blocking is actually enforced) · `SC_402`
wrong status · plain 400s for insufficient balance / over-cap points · 409 lost the claim race /
already processing.
Notes:
- **v6 recomputes nothing** — `grandTotal`/`amountToPayNow` come straight from the immutable
  `booking.quote.clientTotalPaise`. The GST/points/coins recomputation logic that follows in the
  handler is v1-only and explicitly skipped for a v6 booking.
- Re-calling on an already-`payment_pending` booking with an existing `created` Payment returns
  the *same* order rather than creating a duplicate — safe to retry after an interrupted checkout.
- An idempotency-key replay returns only `razorpayOrderId` — a thinner response than a fresh order.
- Points are capped at the lower of 20% of the booking total or the subtotal; coins are
  balance-limited only. Wallet balances are rupees; every field in this request/response is paise —
  conversion happens inside the handler.
- On a Razorpay order-creation failure, any wallet debits already made are rolled back and the
  booking is reverted to `provider_accepted` so the client can retry.

### POST /api/v1/payments/verify (client, must be the payment's client)
Request body: `{ orderId, paymentId, signature }` (Razorpay checkout callback fields).
Response: `{ success, message: "Payment verified successfully", data: { bookingId } }` —
deliberately thin; `GET` the booking separately for its new status.
Errors: `SC_209` · `SC_505` bad signature · `SC_501` no Payment record · `SC_109` · `SC_504`
already captured with nothing pending (genuine double-submit) · `SC_401` · 409 booking in an
unexpected status at verification time (money already captured — flagged for ops, not rejected).
Notes:
- **Safe to retry.** If a prior call captured the payment but crashed before finishing dependent
  writes, calling this again *resumes* rather than erroring — what makes it safe for a client app
  to retry after a dropped connection mid-checkout.
- On success, delegates to the same `settleCapturedPayment()` function the webhook uses:
  `booking.status: payment_pending → payment_done`, `providerDetailsShared: true` (this is the
  exact moment provider contact details and the client's threat profile become mutually visible —
  see the PII rule in `PROVIDER_API_REFERENCE.md`'s Bookings section), coupon redemption recorded,
  invoice generated, notifications fired.

### POST /api/v1/payments/webhook — not client-called
Unauthenticated by design, verified only by Razorpay's HMAC signature over the raw body. A client
frontend never calls this — it's Razorpay's server-to-server confirmation channel, running the
same settlement path as `verifyPayment` as a backstop if the client's own call never lands (app
killed, network drop right after checkout succeeds on Razorpay's side).

---

## Client profile, provider discovery, saved addresses, recurring bookings & account — `/api/v1/client/*`

Mounted with `authenticate + requireRole('client')` except `GET /client/grievance-officer`, which
is public despite the path.

### POST /api/v1/client/profile
Body: `{ address?, threatAssessment? }` (see `createClientProfileValidator`) → `data: { profile }`
Errors: `SC_1307` profile already exists.

### PUT /api/v1/client/profile
Body: see `updateClientProfileValidator`, plus unvalidated passthrough `name`, `phone` (written to
`User`, not `ClientProfile` — same "FIX-24" pattern documented in the provider doc).
Response `data`: `{ profile }`
Errors: `SC_210` GSTIN missing when `clientType` resolves to `registered_business` (checked against
the *resulting* state — catches both "switch to registered_business with no gstin sent" and "clear
gstin while already registered_business") · `SC_702` no profile.

### GET /api/v1/client/profile
Response `data`: `{ profile }` (populated `userId: {name,email,phone,profilePhoto}`).
Notes: auto-creates a blank profile if none exists — the frontend never has to special-case
`SC_702` on this specific read.

### PUT /api/v1/client/profile/threat-assessment
Body: `{ hasKnownThreat, threatDescription, wasAttackedBefore, attackDescription }` (`threatLevel`
is accepted by the validator but not read by the handler) → `data: { profile }`
Errors: `SC_702`.

### GET /api/v1/client/service-cities
Response `data`: `{ cities: string[] }` — deduped, sorted union of every verified/available/
non-PSARA-blocked provider's service cities.

### GET /api/v1/client/providers/search
Query: see `searchProvidersValidator`. Response `data`: passthrough of the shared
`searchVerifiedProviders()` service (same one `GET /public/providers` uses).
Notes: additionally excludes providers on the caller's own `blockedProviders` list.

### GET /api/v1/client/providers/:providerId/price-preview
Query: `serviceCategory, startDate, startTime, endDate, endTime, vehicleOption?` (hand-checked by
the controller, not by `getProviderValidator` — only `providerId` is validator-checked).

This is the checkout price-breakdown endpoint.
- **v6 on**: resolves a deployment state (from `?deploymentState` or the client's own profile
  state) and returns the full v6 `quote` object directly as `data` (not nested) — passes the real
  `clientId` through.
- **v6 off (or v1 fallback)**: returns `{ baseAmount, platformFee, gstAmount, totalAmount, providerPayout, totalHours, numberOfDays, isHourlyBilling, hourlyRate, dailyRate }` (all money in paise).

**Fixed 2026-09-11**: the v1 branch previously didn't pass the caller's `clientId` into the pricing
calculation, so an authenticated call always priced as an anonymous `clientType: 'individual'` with
no membership discount — diverging from what `POST /bookings/` would actually charge a
`registered_business` client or an active member. It now passes `req.user?._id` through (the same
parameter `createBooking` already used), so it's accurate for an authenticated caller and stays
anonymous only for the genuinely unauthenticated `/public` route below.

Errors: 400 missing required query params · `SC_1413` v6 deployment state unresolvable.

### GET /api/v1/client/providers/:providerId/availability
Response `data`: `{ isAvailable, blockedDates: [{date, reason}] (future/today only), workingHours }`
Errors: 404 (raw string, not a real `SC_` code — `errorCodes.ts` has no `SC_404`; resolves to the generic not-found fallback).

### GET /api/v1/client/providers/:providerId
Response `data`: `{ provider: <allowlisted, same serializer as the guest endpoint>, isContactVisible }`
Errors: `SC_601`.
Notes: never returns the raw `ProviderProfile` — KYC docs, bank details, GSTIN, licence numbers are
stripped. `isContactVisible` is true if the client has **any** booking with this provider that's
reached `payment_done`+ — it unmasks platform-wide per client↔provider pair, not per-booking.

### GET /api/v1/client/provider-relationships
Response `data`: `{ preferred: [{_id,name,profilePhoto}], blocked: [...] }`

### PUT /api/v1/client/providers/:providerId/preferred · PUT .../blocked
Body: `{ preferred: boolean }` / `{ blocked: boolean }` → `data: { providerId, preferred|blocked }`
Errors: `SC_601` · `SC_702`. The two lists are mutually exclusive — setting one true clears the other.

### GET /api/v1/client/bookings
Query: `status?, page?, limit?`. Response `data`: `{ bookings, pagination }`
Notes: same PII masking as elsewhere — pre-`payment_done`, `providerId.name` is overwritten to
`'Security Professional'` (this list endpoint only populates `name`/`profilePhoto`, no email/phone
to mask in the first place).

### GET /api/v1/client/bookings/:bookingId/invoice
Response: **not JSON** — streams `text/html` as an attachment.
Errors: `SC_401` · `SC_109` · 400 (no code) — not available until `payment_done`+.
Notes: v1-flat-field invoice, reads `booking.baseAmount/platformFee/gstAmount/totalAmount`
directly — on a v6 booking these are the *mirrored* legacy fields, not the itemized breakdown.
Prefer `/documents/*` above for a v6 booking's real GST/TCS line items.

### GET /api/v1/client/bookings/:bookingId/invoice-data
Same gating as above. Response `data`: `{ invoiceNo, invoiceDate, client: {name,email,phone}, booking: {bookingId, serviceCategory, startDate, endDate, startTime, endTime, totalHours, numberOfDays, isFullDay, vehicleOption, status}, payment: {razorpayPaymentId, razorpayOrderId, paymentMethod, status}|null, breakdown: {baseAmount, vehicleCharges, subtotalAmount, platformFee, gstAmount, totalAmount} (all paise) }`
Notes: same v1-flat-field caveat as `downloadInvoice` above.

### GET /api/v1/client/rating-required
Response `data`: `{ ratingRequired: boolean, pendingBookingCount, pendingBookingIds: ObjectId[] }`

### Saved addresses — `/client/saved-addresses`
- `GET /` → `data: { addresses }` (full subdocs). Errors: `SC_702`.
- `POST /` body per `savedAddressValidator` → `data: { address }` (new subdoc with `_id`). Errors: `SC_702` · 400 (raw) 10-address cap · `SC_1307` duplicate label (case-insensitive). Setting `isDefault:true` clears every other address's default flag first.
- `PUT /:addressId` body per `updateSavedAddressValidator` (partial) → `data: { address }`. Errors: `SC_702` · 404 (raw) · `SC_1307` label collision with a different address.
- `DELETE /:addressId` → `data: { message }`. Errors: `SC_702` · 404 (raw).
- `PATCH /:addressId/default` → `data: { addresses }` (the **entire** updated array, not just the changed one). Errors: `SC_702` · 404 (raw).

### POST /api/v1/client/recurring-bookings — create a series (the only creation endpoint; see the read/manage endpoints below at `/api/v1/recurring/*`)
Body: see `createRecurringBookingValidator` (`providerId, serviceCategory, recurrenceType, seriesStartDate, startTime, endTime, daysOfWeek?, totalOccurrences? (1–12), vehicleOption?, notes?`).
Response `data` (201): `{ series: <RecurringBooking doc, generatedBookings: ObjectId[]>, bookingIds: ObjectId[], bookingDates: 'YYYY-MM-DD'[], totalCreated }`
Errors: 400 (raw, several causes: bad fields, provider not verified, blocked relationship, no occurrence dates in a 90-day window, provider unavailable, per-occurrence price-calc failure) · `SC_601` · `SC_412` a specific occurrence conflicts with an existing booking.
Notes: **every occurrence is created upfront, synchronously, in one request** — if any occurrence
fails partway through (slot conflict, price-calc error), the entire series **rolls back**: every
`Booking` already created for it plus the series document itself are deleted, and the request
throws. This is all-or-nothing, not partial-success. Occurrences are capped at 12. Prices/engine
are computed per-occurrence the same way `POST /bookings/` does (v6 quote mirrored onto legacy
fields when the platform flag is on).

### GET /api/v1/client/recurring-bookings
Query: `status?, page?, limit?`. Response `data`: `{ series: [<populated providerId:{name,profilePhoto}, generatedBookings:{bookingId,status,startDate,endDate,totalAmount}>], pagination }`
Notes: this is a **different route and handler** from `GET /api/v1/recurring/` below — same
underlying `RecurringBooking` data, two separate code paths. Prefer this one if you're already
working under `/client/*`.

### DELETE /api/v1/client/recurring-bookings/:seriesId
Response `data`: `{ message, seriesId, bookingsCancelled: number }`
Errors: 404 (raw) · 400 (raw) already cancelled.
Notes: only cancels occurrences still in `{pending, provider_accepted}` — anything further along
(accepted-and-paid, in duty) is left untouched, so `bookingsCancelled` can be less than the
series' total occurrence count.

### DPDP Act — `/client/account/*`
- `POST /erasure-request` body `{ reason? }` → 202 `{ success, message, data: { requestedAt, expectedCompletionBy (+30d), grievanceContact } }`. Errors: `SC_701` · `SC_409` active booking exists.
- `POST /consent-withdrawal` body `{ purposes: string[], reason? }` → `data: { withdrawnPurposes, withdrawnAt }`. Errors: `SC_701` · 400 (raw) empty/unknown/mandatory purpose.
- `GET /data-export` → same large DPDP §11 export shape as the provider version (this session's
  memory system already has the field list) — `clientProfile` populated, `providerProfile: null`.

All three DPDP endpoints are the **exact same handler functions** `provider.routes.ts` imports and
reuses (confirmed — no `req.user.role` branch inside any of them); only the data that comes back
differs, by what actually exists for that user, not by code path.

### GET /api/v1/client/grievance-officer — public, no auth
Response `data`: static IT Act 2000 / Intermediary Guidelines 2021 contact block
(`grievanceOfficer`, `dataProtectionOfficer`, `policies`, `complianceNote`) — hardcoded, no DB read.

---

## Recurring booking series management — `/api/v1/recurring/*`

Read/manage only — creation is `POST /client/recurring-bookings` above (an earlier, independent
creation endpoint here built a schema-incompatible document shape and silently failed on every
call; it was removed rather than fixed in place).

### GET /api/v1/recurring
Query: `page?, limit?, status?`. Response `data`: `{ recurringBookings: [<populated providerId.name>], pagination: {total, page, limit, pages} }`

### GET /api/v1/recurring/:id
Response `data`: `{ recurringBooking: <populated providerId {name,email,phone}, generatedBookings: [{bookingId, status, startDate, endDate, totalAmount}]> }`
Errors: 404 (raw, no `SC_` code).

### PATCH /api/v1/recurring/:id/status
Body: `{ status: 'active'|'paused'|'cancelled' }` → `data: { recurringBooking }`
Errors: 400 invalid status (raw) · 404 (raw) · 400 (raw) already `cancelled` (terminal state).

⚠️ **This does NOT cascade to already-generated individual bookings.** Since every occurrence was
created upfront at series-creation time, flipping the series to `paused` or `cancelled` here only
changes the `RecurringBooking.status` field — it does not touch any `Booking` already sitting in
`generatedBookings`. A client who "cancels" a series here still has every future individual booking
live and payable unless they separately cancel each one via `POST /bookings/:bookingId/cancel`
(or use `DELETE /client/recurring-bookings/:seriesId` above, which *does* cancel the
still-pending occurrences).

---

## Membership — `/api/v1/client/membership/*`

A flat subscription, not tiered beyond monthly/annual — grants `prioritySupport: true` and waives
convenience fees. Prices are hardcoded constants, not `PlatformSettings`: monthly ₹299
(29900 paise) / 30 days, annual ₹1,999 (199900 paise) / 365 days.

### GET /api/v1/client/membership
Response `data`: `{ membership: { isActive, plan: 'monthly'|'annual'|'none', activatedAt, expiresAt, prioritySupport, cancelled, cancelledAt, daysRemaining: number|null } }`
Errors: 404 (raw) no client profile.
Notes: `isActive` is computed lazily on read (`stored.isActive && expiresAt > now`) — not written
back to the DB when it lapses.

### POST /api/v1/client/membership/create-order
Body: `{ plan: 'monthly'|'annual' }` → `data: { razorpayOrderId, amount (paise), currency: 'INR', plan }`
Errors: 400 invalid plan, 404 no profile.
Notes: stores `{plan, razorpayOrderId}` in **Redis** (`membership_order:<userId>`, 30-min TTL) —
unlike booking payments, no `Payment` model row is created; membership payment state lives only in
Redis until `verify-payment` reads it back.

### POST /api/v1/client/membership/verify-payment
Body: `{ orderId, paymentId, signature }` → `data: { membership }` + `message`.
Errors: 400 missing fields / order not found or expired / corrupted Redis value / order-id mismatch / signature failed, 404 no profile — all raw, no `SC_` codes.
Notes: deletes the Redis key immediately on entry (replay guard). **Extends from the current
`expiresAt` if already active** rather than resetting to `now + duration` — renewing early doesn't
lose remaining days.

### DELETE /api/v1/client/membership/cancel
No body. Response: `{ success, message: 'Membership cancelled. Benefits remain until the expiry date.', data: { membership } }`
Errors: 400 no active membership / already cancelled.
Notes: **does not deactivate immediately** — only stamps `cancelledAt`; benefits persist until the
natural `expiresAt`. No proration/refund logic exists.

---

## Coupons — `/api/v1/coupons/*` (v1 billing engine only)

⚠️ Coupons are v1-only per root `CLAUDE.md` — "off on the v6 path... reintroduced once the tax
layer settles." **`POST /coupons/validate` itself still has zero awareness of `billingEngine` or
even a `bookingId`** — it's pure amount-in/discount-out math against the coupon document and the
client's history, so nothing stops calling it against what will become a v6 booking; it's a
preview endpoint, not the enforcement point. Enforcement now lives at `POST /bookings/` (fixed
2026-09-11 — a `couponCode` on a v6 booking is rejected with `SC_1425`, see the Booking & Checkout
section above) and at `POST /payments/create-order` (wallet coins/points, `SC_1424`). **Hide
coupon UI at checkout whenever `booking.billingEngine` will be (or is) `'v6'`** — the server backs
this up now, but a good UI shouldn't invite the rejection in the first place.

### POST /api/v1/coupons/validate
Body: `{ code, totalAmountPaise, serviceCategory?, platformRevenuePaise? }`
Response `data`: `{ code, name, discountType: 'percentage'|'flat', discountValue, discountAmountPaise, discountAmountRupees, totalAmountPaise, finalAmountPaise, finalAmountRupees }`
Errors: all plain `AppError`, no `SC_` codes — invalid code, deactivated/not-yet-active/expired,
usage-limit or per-user-limit reached, below minimum order, or a rule violation (first-order-only,
new-users-only, completed-booking-count gates, category/day-of-week/client-type restriction).
Notes: discount is capped at three things — `maxDiscountPaise` (percentage coupons only), the
passed-in `platformRevenuePaise` (a coupon can never cost more than the platform's own revenue
share — the provider is always paid in full, the coupon cost is platform-absorbed), and
`totalAmountPaise` itself.

### GET /api/v1/coupons/available
Response `data`: `{ coupons: [...] }` — eligibility-filtered list for the calling client (excludes
coupons whose personal usage limit is already exhausted).

---

## Guest / marketing-site (unauthenticated) — `/api/v1/public/*`

No auth, no PII, no writes — safe to call before a user signs in. Backs the marketing site /
guest-quote flow.

### GET /api/v1/public/providers
Query: see `searchProvidersValidator` (same shape as the authenticated client search).
Response `data`: `{ providers: [{ id (User._id), businessName, serviceCity, serviceCities, serviceCategories, averageRating, totalRatings, isHourlyAvailable, isVerified, verificationTier, taxTier: 'registered'|'unregistered' (spec 0004 — the only tax-profile field exposed on the card), trustBadges, offersVehicle, offersVehicleWithDriver, pricing: {dailyRate (paise, min across categories), hourlyRate (paise, min), minimumHours}, user: {fullName} }], sortBy, pagination }`
Notes: `taxTier` is deliberately on the search card, not just the detail page — it changes what the
client will pay before they ever open the profile.

### GET /api/v1/public/providers/:providerId
Response `data`: `{ provider: <allowlisted, isContactVisible: false always>, isContactVisible: false }`
Errors: `SC_601` not found / not verified / PSARA-blocked.
Notes: same allowlist serializer as the authenticated version, contact permanently masked (a guest
never has a paid booking to unlock it).

### GET /api/v1/public/providers/:providerId/price-preview
Identical handler to `GET /client/providers/:providerId/price-preview` above (reused verbatim — it
never reads `req.user`) — same shape, same v1-accuracy caveat for non-individual/member pricing,
just without the auth gate.

### GET /api/v1/public/billing-flags
Response `data`: `{ v6Enabled: boolean }` — read live from `PlatformSettings.billingV6.enabled`.
**This is the canonical way for a frontend to detect whether v6 is actually on** in whatever
environment it's pointed at, deliberately minimal (contrast the richer admin settings endpoint,
which exposes commission/TCS/TDS/penalty internals that aren't meant for a public client).

---

## Appendix A — Error codes, booking lifecycle

Full `SC_xxx` catalog and the booking-lifecycle state diagram are in
`PROVIDER_API_REFERENCE.md`'s Appendix A/C — not duplicated here, same source
(`src/utils/errorCodes.ts`) and same lifecycle applies to both roles. Client-relevant highlights:

- `SC_702` `CLIENT_PROFILE_INCOMPLETE` (403) — blocks `POST /bookings/`; complete name+phone+address first.
- `SC_703` `CLIENT_KYC_REQUIRED` (403) — armed-category (gunman/PSO) booking, only when `REQUIRE_ARMED_CLIENT_KYC=true` (currently off).
- `SC_412` `PROVIDER_BLOCKED` / `SC_413` `CLIENT_BLACKLISTED` — blocked-relationship checks, either direction.
- `SC_1424` `WALLET_DISCOUNTS_NOT_AVAILABLE_V6` — SecureCoins/SecurePoints on a v6 booking, enforced at `POST /payments/create-order`.
- `SC_1425` `COUPON_NOT_AVAILABLE_V6` — a coupon code on a v6 booking, enforced at `POST /bookings/` (added 2026-09-11 — see the Booking & Checkout section above).
- Client-callable endpoints returning **raw, non-`SC_` errors** (400/404 with just a message, no code): saved-address CRUD, recurring-series management, membership, coupon validation, and both invoice endpoints. Branch on HTTP status + message text for these, not on `error.code`.

## Appendix B — Things worth knowing before you build against this

Findings surfaced while compiling this reference — flagged so the frontend doesn't get surprised.
Three of the four money-path gaps originally found here were fixed server-side on 2026-09-11 (all
three touched `booking.controller.ts`/`client.controller.ts`, typechecked and lint-clean, unit
tests unaffected — no spec amendment needed since none changed a documented v6 money rule, only
brought the code in line with rules specs 0004/0005 already state):

- ~~`data.amount` on `createBooking` is always v1-shaped~~ **Fixed** — it now returns an
  engine-correct breakdown, and the raw `quote` object is returned alongside it. See the Booking &
  Checkout section above.
- ~~The v1 price-preview endpoint quotes anonymously~~ **Fixed** — the authenticated client route
  now passes `clientId` through on the v1 path too, matching `createBooking`. The unauthenticated
  `/public` route is unaffected (correctly stays anonymous — there's no client to identify).
- ~~Coupons are not actually blocked on v6 bookings at creation time~~ **Fixed** — `POST /bookings/`
  now rejects a `couponCode` on a v6 booking with `SC_1425` (`COUPON_NOT_AVAILABLE_V6`) rather than
  silently computing a discount the v6-quote mirror would then discard.
- **Still open, and deliberately not touched: v6 cancellation refunds are recorded but never
  automatically disbursed.** v1 cancellation refunds become wallet SecureCoins; a v6 cancellation
  instead records a credit note / ledger entry (`onBookingCancelled`) and sets
  `cancellation.refundStatus: 'pending'` — the refund is owed, not paid out, and no job anywhere in
  `src/billing/settlement/` currently releases it (that directory only releases *provider* payouts,
  per spec 0007). This is a missing settlement-release subsystem, not a contained bug — it needs
  its own spec (a refund-payable counterpart to spec 0007's provider-payable release) rather than
  an inline fix, so it was deliberately left alone this pass and flagged to the user instead of
  guessed at. As of this writing it's also unexercised in production, since v6 is still off.
- **Two separate waiver-acknowledgment endpoints** exist with different request shapes
  (`POST /bookings/:bookingId/waivers` vs `POST /client/bookings/:bookingId/waivers`) — pick one
  deliberately.
- **Two separate invoice/receipt surfaces** exist for the same booking: the v1-flat-field
  `GET /client/bookings/:bookingId/invoice(-data)` pair, and the itemized v6
  `GET /documents/*` surface. The former never shows a v6 booking's real GST/TCS breakdown (it
  reads the mirrored legacy fields, not the quote) — use `/documents/*` for v6.
- **Recurring series cancellation/pause does not cascade** to already-created individual bookings
  via `PATCH /recurring/:id/status` — use `DELETE /client/recurring-bookings/:seriesId` if you
  actually want the still-pending occurrences cancelled too.
- **Membership cancellation doesn't deactivate immediately** — benefits run to the natural expiry,
  no proration.
- **`GET /client/recurring-bookings` and `GET /recurring/`** are two different routes/handlers over
  the same underlying data — not the same code path, just the same collection.
- **This project is moving to v6-only; v1 is legacy.** `PlatformSettings.billingV6.enabled` still
  defaults to `false` in code — call `GET /public/billing-flags` to check the live state of
  whatever environment you're pointing at. Build new checkout/receipt/discount UI around the v6
  behaviors described throughout this doc even before the flag flips, so the frontend is ready the
  moment it does.
