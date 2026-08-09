# 20fourr Website — Remaining Design Work

**Scope of this plan: UI/design only.** Every screen below is built against mock
data in `lib/`. API integration is explicitly deferred to a later phase — see
[Deferred](#deferred-api-integration) for what's already known about it.

Reference implementation: the production client app at
`SecureConnect/mobile` (Expo, `APP_VARIANT=client`). Provider screens are out of
scope.

---

## 1. Where the website stands

**12 routes built**, all on mock data:

| Area | Routes |
| --- | --- |
| Auth | `/login` `/signup` `/verify-phone` `/verify-email` `/forgot-password` |
| Shell | `/dashboard` `/dashboard/services` `/dashboard/bookings` `/dashboard/support` |
| Profile | `/dashboard/profile` `/dashboard/profile/edit` `/dashboard/profile/addresses` |

**The client app has ~44 reachable screens.** Roughly 8 are done, 4 are partial,
and **32 are not started**. The single largest gap is that *the product's core
job — booking a guard — cannot be done on the website at all.*

### Stubs in the current build that read as finished but aren't

These will be mistaken for working features in a demo:

- Topbar **search** — decorative input, no handler
- Topbar **notification bell** — dot is hardcoded, no panel, no count
- Sidebar **Wallet** row — no destination
- **9 of 10** Profile rows point back at `/dashboard/profile`
- **Book Security Service** (dashboard hero) → `/dashboard/services`, which is a
  catalogue, not a booking flow
- **Appearance → Light** is disabled
- **Sign Out** clears `sessionStorage` only

---

## 2. Decisions to settle before building (blocking)

These are cheap now and expensive after 30 more screens exist.

### 2.1 Reconcile the two palettes — ✅ DONE

The app's client theme is `primary: '#E8A020'` (`src/constants/theme.js:6`).
That is **exactly** the gold used by the website's auth screens. The dashboard
comp came from a different Design project and uses `#f5a623` on a `#060918`
ground with Outfit/DM Sans, against the auth screens' `#0a1220` and Helvetica.

So the website currently contradicts production in its main surface.
The dashboard's `--color-app-*` tokens now carry production's `deepNavy` values
(`background #060C16`, `surface #0F1C2E`, `primary #E8A020`,
`primaryDark #C9851A`, `secondary #3B82F6`). Tailwind's slate ramp was left in
place because it already matches — `slate-400` **is** production's
`textSecondary #94A3B8`.

**Still open:** the auth screens sit on `#0a1220` where the dashboard is now
`#060C16`, and they use Helvetica against the dashboard's Outfit/DM Sans. Gold
matches everywhere. Closing the last gap means restyling approved auth screens,
so it's a separate call.

### 2.2 Booking status model — ✅ DONE

The app defines **ten** statuses (`src/constants/clientTheme.js`):

```
pending · provider_accepted · payment_pending · payment_done
duty_started · duty_ended · disputed · completed · cancelled · rejected
```

All ten now exist in `lib/dashboard-data.ts` with production's labels
(`Pending`, `Accepted`, `Pay Now`, `Paid`, `Live`, `Ended`, `Disputed`, `Done`,
`Cancelled`, `Rejected`) and warning/success/error semantics. The Bookings tabs
are the app's real grouping — Ongoing (7 statuses) / Completed / Cancelled.

One deliberate deviation: the app's cancelled tab tests `status === 'cancelled'`
only, so a **`rejected` booking lands in no tab and is invisible to the client**.
`bookingsByTab` groups it under Cancelled. Worth fixing in the app too.

### 2.3 Currency and locale — ✅ DONE

This turned out to be more than a symbol swap. **The backend ledger stores every
monetary value in integer paise**, and `src/utils/formatters.js` documents the
rule: divide by 100 exactly once, and never round line items independently or
breakdowns stop summing and a "Pay ₹X" button can overstate the charge.

`lib/money.ts` ports `formatPaise` with the same signature and the same
`decimals = 2` default, so the payment and invoice screens port across without a
semantic change. Mock data now holds integer paise (`amountPaise`,
`fromRatePaise`, `walletBalancePaise`) instead of display strings, and every
render site formats at the edge. `en-IN` grouping verified: ₹1,50,000 / ₹1,23,45,678.

**Rates are placeholders.** ₹250/hr guard, ₹400 bouncer, ₹900 gunman etc. are
plausible Indian market figures I invented to replace the comp's USD values —
replace them with real pricing.

### 2.4 What is `/dashboard/services` for? — ✅ DECIDED

Services stays as the catalogue and is now the funnel's **entry point**: "Book Now"
links to `/book/service?service=…`, which preselects that card. The dashboard hero
button goes straight to `/book`.

### 2.5 Light theme — ✅ DECIDED (deferred)

Out of scope. Porting six app themes is app work, not website design. The
Appearance control renders with Light disabled and labelled "coming soon", which
is honest rather than a toggle that changes nothing.

## 3. Phase 1 — The booking funnel — ✅ BUILT

12 screens. This is the revenue path and nothing exists for it.

Mobile runs this as a linear stack. **On web this should be one wizard** under
`/book`, with a persistent step rail, browser-back support, and a draft held in
context so a refresh mid-flow doesn't lose everything.

| Step | Mobile screen | Notes |
| --- | --- | --- |
| 1 | `SearchProvidersScreen` (610 ln) | City select, provider cards, Verified badge |
| 2 | `ProviderDetailScreen` (781 ln) | Profile, rates, documents, reviews |
| 3 | `BookingPurposeScreen` (253 ln) | "What's the purpose?" · skippable |
| 4 | `BookingRequestScreen` (880 ln) | The big form: date, time, duration, location |
| 4a | `HourlyBookingScreen` (456 ln) | Hourly variant of the above |
| 5 | `RiskAcknowledgementScreen` (75 ln) | **Legal gate** — "I Acknowledge" |
| 6 | `SafetyDisclaimerScreen` (75 ln) | **Legal gate** — "I Understand" |
| 7 | `BookingConfirmationWaiverScreen` (137 ln) | Summary + waiver checkbox |
| 8 | `PaymentScreen` (741 ln) | Razorpay, coupons |
| 9 | `DutyOTPShareScreen` (340 ln) | Start/end duty OTP handover |
| — | `CancellationScreen` (387 ln) | Reachable from funnel and from Bookings |

**The three gates are compliance, not decoration.** Risk Acknowledgement, Safety
Disclaimer and the Confirmation Waiver must stay un-skippable and must record
consent. Do not collapse them into one screen for convenience.

---

## 4. Phase 2 — Bookings depth — PARTIAL

| Screen | Mobile | Notes |
| --- | --- | --- |
| Booking Detail | 932 ln — **largest screen in the app** | Status hero w/ per-status gradient, timeline, actions |
| Chat | 793 ln | Realtime (socket.io), attachments, unread counts |
| Recurring Bookings | 522 ln | Schedule, skip-next, pause |
| Rate Provider | 394 ln | Stars, photo upload; app blocks on `rating-required` |
| Provider Documents | 133 ln | Document viewer |
| Invoice (detail) | 513 ln | GST invoice, printable |
| Invoice List | 198 ln | |

Also: the Bookings list needs the real ten-status filter set, not three tabs.

---

## 5. Phase 3 — Profile completion — ✅ BUILT

Every one of these is already a visible row on `/dashboard/profile` that
currently goes nowhere.

| Row | Mobile screen | Notes |
| --- | --- | --- |
| My Wallet | `WalletScreen` (425 ln) | **Dual currency**: SecureCoins + SecurePoints, transactions, milestone bonuses, "How to Earn" |
| 20fourr Pass | `MembershipScreen` (385 ln) | Monthly/annual plans, benefits, cancel |
| Preferred & Blocked | `ManageProvidersScreen` (131 ln) | |
| Threat Assessment | `ThreatAssessmentScreen` (256 ln) | |
| Penalties & Compliance | `PenaltiesScreen` (547 ln) | Includes appeal flow |
| Privacy & Data Rights | `PrivacyRightsScreen` (262 ln) | Likely DPDP-Act driven — treat copy as legally reviewed |
| Change Password | `ChangePasswordScreen` (238 ln) | Revokes all sessions on success |
| My Invoices | `InvoiceListScreen` | See Phase 2 |
| **Referral** | `ReferralScreen` (514 ln) | **Not yet a row on the web profile — add it** |

---

## 6. Phase 4 — Support depth — ✅ BUILT

| Screen | Mobile | Notes |
| --- | --- | --- |
| Create Ticket | 414 ln | Category, description, attachments |
| Ticket Detail | 396 ln | Message thread, upload, close |

The current `/dashboard/support` is two static cards and four dead FAQ rows.

---

## 7. Phase 5 — Shell and cross-cutting — ✅ BUILT

| Item | Mobile | Notes |
| --- | --- | --- |
| Notifications | `NotificationsScreen` (279 ln) | Typed icons/colors per notification type; wire the topbar bell + unread count |
| Terms of Service | `TermsOfServiceScreen` (449 ln) | Content exists in `src/constants/terms.js` |
| Global search | — | Topbar search needs a real target |
| Light theme | — | See §2.5 |

**Probably not needed on web:** `SplashScreen`, `OnboardingScreen`,
`RoleSelectionScreen` (the website is client-only; provider is a separate app).
A marketing landing page is the web equivalent of onboarding — confirm whether
that's in scope.

---

## 8. Suggested sequencing

1. **§2 decisions** — palette, status model, currency. Half a day, unblocks everything.
2. **Phase 1 booking funnel** — the product doesn't work without it.
3. **Phase 3 profile pages** — highest ratio of "looks broken" to effort; ten dead rows.
4. **Phase 2 bookings depth** — Booking Detail then Chat.
5. **Phase 4 + 5** — support, notifications, terms.

Rationale for putting Profile before Bookings depth: those rows are already
visible and dead, so every one is a visible defect; Booking Detail is large but
invisible until the funnel exists.

---

## API integration — IN PROGRESS

**Architecture: a BFF, not direct browser calls.** Two things forced it, and
both are worth remembering before anyone "simplifies" it:

1. The API's CORS whitelist does not include this origin. A preflight from
   `localhost:3100` comes back with no `Access-Control-Allow-Origin`, so a
   direct `fetch` from the page is refused outright.
2. JWTs in `localStorage` are readable by any script on the page. This site
   handles GST invoices, saved addresses and payments, so that is an account
   takeover, not an inconvenience.

```
browser → /api/auth/*        route handlers, set httpOnly cookies
        → /api/bff/<path>    attaches Bearer server-side, refreshes on 401
                             → {API_BASE_URL}/<path>
```

- `lib/api/backend.ts` — the only module that calls the API. Server-only.
- `lib/api/session.ts` — the cookie pair (`sc_at` / `sc_rt`) and refresh.
- `app/api/bff/[...path]/route.ts` — the proxy, with a **path allowlist**.
- `proxy.ts` — cheap redirect guard. Deliberately does *not* refresh: the API
  rejects a reused refresh token, so a second refresh implementation racing the
  proxy route would sign users out.

**Wired:** login · signup · verify phone · verify email · forgot password ·
sign out · session/verification gating · profile (read + save) · saved
addresses (full CRUD) · bookings list · booking detail · rating · dashboard
stats and greeting · sidebar identity and wallet balance · support tickets
(list, create with attachments, thread, reply, close) · notifications (list,
mark read, mark all, delete) and the topbar bell · wallet · invoices (list,
GST detail, PDF download).

Also wired: the service catalogue (live counts and starting rates) · provider
search, detail and sorting · price preview · booking creation · Razorpay
checkout on the booking screen.

**Not yet wired:** referral · membership · penalties · threat assessment ·
preferred/blocked providers · coupons · wallet redemption at checkout · chat
(realtime, needs socket.io).

### The funnel no longer ends in payment

`POST /payments/create-order` returns **SC_402 while a booking is `pending`** —
verified against a real booking. Payment only opens once the provider accepts,
which is what the Confirm screen's own copy always said. So:

```
service → provider → purpose → schedule → risk → safety → absence → confirm
                                                                       ↓
                                              booking created as `pending`
                                                                       ↓
                          provider accepts → Bookings → **Pay Now** → Razorpay
```

**`absence` is a new, fourth compliance gate.** `POST /bookings` rejects any
request that does not carry all four of `clientRiskAcknowledged`,
`safetyDisclaimerAccepted`, `bookingConfirmationWaiverAccepted` and
`providerAbsencePolicyAcknowledged` (SRS §6.2.1 TC-BOOK-005). The website had
three gates, so **every booking would have failed with SC_209**.

### The catalogue is now the API's real categories

`serviceCategory` is a four-value enum: `guard`, `bouncer`, `gunman`, `pso`.
"Event Security", "Personal Guard" and "Corporate Security" were invented — they
could be browsed but never booked. **Ex-Serviceman is not a service**: it is a
provider attribute, passed as `exServiceman=true`, and search returns 400 if you
send it as a category.

### Provider search lists providers that cannot be booked

Sampled 32 providers across the four categories: **15 returned 403 at booking
creation** — `SC_610` (PSARA licence expired, 11) and `SC_611` (arms licence
expired, 4). Search's predicate is `isVerified` + `availability.isAvailable` +
`psaraBlocked != true`; creation additionally runs `assertPsaraValid` **against
the service date**, requires a current arms licence for gunman/PSO, and rejects
suspended providers. Neither the search payload nor `/client/providers/:id`
exposes licence expiry, so the website cannot filter these out — a provider
whose PSARA licence has lapsed still carries a `psara_verified` trust badge.

Until search applies the same predicate, the confirm step detects those codes
and offers "Choose another provider" instead of a dead end.

### Two server-side issues found while testing

1. **The `city` filter matches nothing.** Provider search filters on a derived
   `serviceCitiesNorm` array which is empty on the current provider records, so
   every city returns 0 while the unfiltered search returns 170. Even a
   provider's own `serviceCity` fails to match it. The model's own comment warns
   about exactly this: "a stale serviceCitiesNorm makes a provider unfindable in
   their own city". Re-saving the provider profiles repopulates it.
2. **The price preview does not return every component of its own total.**
   `total = subtotal + serviceGst + platformRevenue + appGst`, but only
   `baseAmount`, `platformFee` and `gstAmount` come back — the service GST and
   the flat convenience fee are missing, ₹266 on an ₹1,200 booking. Until it
   returns them, `PriceSummary` shows the remainder as one "GST & other charges"
   line so the breakdown still reconciles exactly.

### Contract surprises worth keeping in mind

| Expectation | Reality |
| --- | --- |
| status `rejected` | the enum is **`provider_rejected`** |
| booking key `bookingNumber` | it is `bookingId`, and the route resolves by Mongo **`_id`** |
| wallet in paise | coins and points are **whole rupees** (1 coin = ₹1) |
| password rules | the API also requires a **lowercase** letter |
| signup takes first/last | it takes one `name`, plus `role` and `confirmPassword` |
| email is editable | `PUT /client/profile` has no path for it |
| provider name on a booking | masked to "Security Professional" until `payment_done` |
| 4 ticket statuses | **6** — including `waiting_on_customer` / `waiting_on_provider` |
| ticket priority `normal` | the enum is low / **medium** / high / urgent |
| ticket category free text | a required `type` enum of 8 values |
| invoice status paid/due/refunded | draft / **issued** / cancelled — a document lifecycle |
| invoice = base + 18% GST | `lineItems[]` + `taxLines[]` with SAC codes and CGST/SGST/IGST splits |
| notification `read` | the field is **`isRead`**, and `type` has ~30 values |

## Deferred: API integration

Not part of this plan, but already mapped so it isn't a surprise:

- **Auth**: JWT access + refresh, auto-refresh on 401 with a pending-request
  queue (`src/services/authAxios.js`), MFA endpoints exist
  (`/auth/mfa/setup|verify|confirm|disable`)
- **~60 client endpoints** in use, including `/client/bookings`,
  `/client/saved-addresses`, `/client/membership`, `/wallet`, `/invoices`,
  `/tickets`, `/notifications`, `/referral`, `/ratings`, `/coupons/validate`
- **Realtime**: `socketService.js` for chat
- **Payments**: Razorpay (`razorpayCheckout.web.js` already exists — the web
  variant is written)
- **Safety**: `/protection/:id/sos`, `/protection/:id/incidents`,
  `/bookings/:id/absence-alert` — an SOS surface may be needed on web

The website's swap seams are already in place: `lib/auth.ts`,
`lib/dashboard-data.ts`, `lib/session.ts`.


---

## Feature parity with the client app (audited 9 Aug 2026)

Mapped every screen in `SecureConnect/mobile/src/screens/client` plus the
shared ones a client reaches, against the website's routes AND the actions
inside each screen.

### Built since the audit
- **Duty OTP** (`/dashboard/bookings/[id]/duty`) — start and end codes.
- **Safety block** on the booking screen — SOS, incident report, absence alert
  and dispute, each gated on the API's own status rules:

  | Action | Allowed at |
  | --- | --- |
  | SOS | `duty_started` only (rate-limited, 429 SC_1201) |
  | Incident | `duty_started` / `duty_ended` / `completed` / `settled` |
  | Absence | `payment_done` / `duty_started` |
  | Dispute | `duty_started` / `duty_ended` / `completed`, not already disputed |

  Gates are mirrored client-side so an action is never offered and then
  refused. Verified: all four endpoints reject correctly at `payment_done`,
  which is exactly where the UI hides them.

### Everything above is now built

The audit's whole list has landed. What each one turned into, and the contract
details worth not rediscovering:

| Item | Where it lives | Note |
| --- | --- | --- |
| Coupon codes | `app/book/CouponField.tsx` | `POST /coupons/validate` |
| Wallet redemption | `PayNowButton.tsx` | `coinsToUse` / `pointsToUse` on create-order |
| Recurring bookings | `/dashboard/bookings/recurring` | uses `/recurring`, not the second parallel implementation |
| Duty OTP | `/dashboard/bookings/[id]/duty` | start and end codes |
| Safety block | `SafetyActions.tsx` | SOS / incident / absence / dispute, each status-gated |
| Provider documents | `/dashboard/bookings/[id]/documents` | see the two gates below |
| Provider availability | schedule step | blocks days off, shows the working-hours window |
| Cancellation refund preview | `CancelBookingButton.tsx` | `refundForCancellation()` in `lib/cancellation-policy.ts` |
| Minimum hours | schedule step | blocks under `minimumHours` before the server returns SC_411 |
| Provider detail | `/book/provider` panel | per-category rates, service record, trust badges, reviews |
| Rating + address prompts | `app/dashboard/HomePrompts.tsx` | prompts, not blocks — see below |
| Per-booking chat unread | booking detail | `/chat/unread?bookingId=` on the chat action |

Four things learned doing it, all of which contradict something that looked
obvious:

- **Provider documents have two gates, not one.** The booking must be paid, and
  while it is still `payment_done` documents only reveal from 24h before duty
  start. A 403 there usually means "too early", so the empty state says so
  rather than showing a bare error. `fileUrl` is a short-lived presigned S3 URL
  — never cache or proxy it.
- **`blockedDates` is `{ date, reason }[]`, not `string[]`,** and the date is a
  bare local `YYYY-MM-DD`. Compare it as a string; parsing it lands at UTC
  midnight and shifts the day in IST.
- **The rating gate does not block, and in the app it never even shows.** The
  app reads `data.bookings` and `data.total ?? data.count`; the endpoint returns
  `ratingRequired`, `pendingBookingCount` and `pendingBookingIds`, so the app's
  "To Rate" tile is permanently 0. The website uses the real field names, which
  means it surfaces pending ratings the app currently hides. Nothing server-side
  refuses a new booking over an unrated one, so blocking would invent a rule.
- **Hourly billing is entirely server-side.** There is no hourly *mode* to
  build: `booking.service.ts` switches to `hourlyRate × totalHours` on its own
  when the booking is single-day, the provider has `hourlyEnabled`, and the
  hours fall short of a full day. The only client-side gap was `minimumHours`,
  which now blocks before submission instead of after.

Also worth knowing: `psaraLicense` is **not** in the public provider payload.
`serializers/providerPublic.ts` is a strict allowlist that deliberately withholds
licence numbers, KYC documents and bank details — `psara_verified` arrives as a
computed trust badge instead. An earlier version of the detail panel declared a
`psaraLicense` field that could never be populated.

### Correctly not ported
Splash, Onboarding, RoleSelection — app-shell concerns; the site is client-only.
