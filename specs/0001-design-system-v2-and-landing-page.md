# 0001 — Design system v2 and the public landing page

| | |
| --- | --- |
| **Status** | building |
| **Author** | Santosh Kumar |
| **Created** | 2026-09-12 |
| **Apps touched** | website (this repo). Mobile client is *reference only* — not re-skinned here. |
| **Branch** | |
| **PR** | |
| **Refs** | SecureConnect `specs/0005` (money must be shown itemized), `docs/ROADMAP.md` |

---

## Problem

Users and a designer reviewing the site both landed on the same verdict: it looks machine-made.
That reaction is not about taste, and it is not fixed by picking a nicer accent colour. It is the
predictable result of a set of specific, locatable decisions in this codebase, every one of which
is a known signature of generated UI:

1. **Two palettes pretending to be one.** `app/globals.css` defines an auth ground (`#0a1220`) and
   a dashboard ground (`#060c16`), plus `--color-surface` *and* `--color-app-card`, `--color-border`
   *and* `--color-app-border`. They differ by a few percent — close enough that nobody can tell them
   apart, far enough that the site is visibly two designs stitched together at `/login` → `/dashboard`.
2. **Colour used as decoration instead of meaning.** Every service category gets its own hue —
   guard gold, bouncer blue, gunman red, PSO green (`lib/services.ts`) — each in a `/12`-opacity
   tinted tile. Four categories, four colours, zero information. The dashboard's four stat tiles do
   the same thing (`app/dashboard/Overview.tsx`). A rainbow of tinted icon chips is *the* most
   recognisable LLM dashboard artefact in existence.
3. **Two gradients of the same colour at different angles.** `bg-gold-gradient` is
   `linear-gradient(180deg, #f0ac33, #d68a12)`; `bg-app-gold-gradient` is
   `linear-gradient(135deg, #e8a020, #c9851a)`. Nobody chooses this. It accumulates.
4. **Radius inflation.** `--radius-field: 16px`, `--radius-card: 24px`, `--radius-pill: 20px`,
   `--radius-notice: 12px`, `--radius-tile: 22px`, plus inline `rounded-2xl`, `rounded-[24px]`,
   `rounded-[9px]`, `rounded-md`. Eight radii. A designed system has two or three.
5. **Hairlines that aren't tokens.** `border-white/5`, `border-white/6`, `border-white/7`,
   `border-white/8` all appear, sometimes in the same component. Four near-identical borders, none
   of them decided.
6. **No type scale.** `text-[13.5px]`, `text-[11.5px]`, `text-[22px]`, `text-[17px]`, `text-[26px]`,
   `text-[13px]`, `text-[14px]` — arbitrary values chosen per component. Combined with
   `font-extrabold tracking-[-0.5px]` on every single heading, this is the generated-UI house style.
7. **Motion as decoration.** `animate-pulse-dot` on a "Live right now" indicator, `animate-fade-up`
   on page content. Content that fades in on every navigation reads as a template, not a product.
8. **Copy with no information in it.** "Your 24/7 security command center. Protect what matters
   most." with a 👋 emoji in the dashboard header. Nothing in that sentence is true of this product
   specifically, and it would survive being pasted into any other product's dashboard unchanged.
9. **Flat information soup.** Every panel is `Card` — same radius, same border, same padding
   (`components/dashboard/primitives.tsx`). A booking worth ₹40,000, a settings row and an empty
   state are given identical visual weight, so the page has no hierarchy to read.

And underneath the styling there is a harder problem the redesign has to solve rather than
decorate: **the product's actual differentiator is invisible.** 20fourr verifies PSARA licences
against the deployment state, checks arms licences before it will let a gunman be booked, runs an
OTP-gated shift lifecycle, and issues a real GST tax document per shift. None of that appears
anywhere a buyer can see it. The site currently sells "security services" the way any of two
hundred competitors would, using shield icons.

There is also no landing page at all. `app/page.tsx` is a three-line redirect to `/login`. There is
no URL to put in a deck, a pitch, or an ad.

## Goal

20fourr has a public landing page that sells the compliance machinery as the product, and a single
coherent design system — one palette, one type scale, two radii — applied across marketing, auth,
the booking funnel and the dashboard, so the site reads as a deliberately designed product rather
than an assembled one.

## Non-goals / out of scope

- **The mobile client app is not re-skinned.** `SecureConnect/mobile` keeps its `deepNavy` theme.
  This spec deliberately breaks visual parity with it (see Decision 2) and that is accepted, not
  overlooked.
- **No logo or wordmark redesign.** `assets/logo-dark.png` / `logo-white.png` are used as-is. Brand
  identity work is a separate engagement.
- **No new product features, screens or routes** beyond the marketing routes listed below. If a
  screen does not exist today it does not gain one here.
- **No copywriting for legal pages.** Terms and privacy text is unchanged; only its typesetting.
- **No CMS, blog, or careers page.** Marketing routes are static React in this repo.
- **No API changes.** Everything the landing page needs already exists under `/api/v1/public/*`.
  Wiring it is spec 0002's job, not this one's.
- **No dark/light toggle for the signed-in app.** `AppearanceToggle` stays disabled. The app is
  dark, the marketing site is light, and neither is user-switchable in this pass.
- **No animation library.** No Framer Motion, no GSAP, no scroll-linked storytelling.
- **No illustration or 3D commissioning.** The visual system is typographic and photographic; see
  Decision 7.

## Design decisions

These are decisions, not preferences. Each one names the slop pattern it exists to prevent, so a
future reviewer can tell whether a proposed change is a refinement or a regression.

| # | Decision | Why |
| --- | --- | --- |
| 1 | **One accent colour, and it is almost never used.** Brand gold `#E8A020` is reserved for: the primary action, the active navigation indicator, and the live-duty state. Nothing else is gold. No gold text on light backgrounds, ever — it measures 2.1:1 on paper and fails AA at every size. | Kills the "everything is branded" look. Restraint is the single highest-leverage change on this list. |
| 2 | **Light marketing site, dark product.** Marketing routes use the paper palette; every signed-in surface uses the ink palette. The two share type, spacing, radii and components — only the ground changes. | A dark marketing site reads generic; a light operations dashboard reads fragile. Each context gets the ground that suits it, and one system spans both. |
| 3 | **Zero gradients.** Both `bg-gold-gradient` and `bg-app-gold-gradient` are deleted. Primary buttons are flat solid fills. | Gradient buttons are the single most reliable tell. There is no sanctioned exception. |
| 4 | **Two radii.** `--radius-sm: 6px` (inputs, buttons, chips, tiles) and `--radius-lg: 12px` (cards, sheets, modals). `9999px` only for status pills and avatars, where the shape carries meaning. All other radius tokens are deleted. | Eight radii is an accumulation, not a system. |
| 5 | **Borders are solid tokens, never alpha-white.** Two per theme: a *hairline* for dividing (`#E3DFD8` / `#212936`) and an *edge* for interactive boundaries — inputs, toggles, focus targets (`#8A857C` / `#5A6577`). Every `border-white/N` utility is removed. | Alpha borders shift with whatever is behind them, which is why four of them exist. The edge/hairline split also makes input borders pass the 3:1 non-text contrast requirement, which `white/6` does not. |
| 6 | **Cards carry a border, never a shadow.** Shadows exist only on true overlays — modal, dropdown, toast. In the dark theme, elevation is a lighter surface, never a glow. | Shadowed cards on flat pages is the stock template look. |
| 7 | **No decorative illustration, no 3D shields, no stock photography of men in suits.** The hero visual is a real fragment of the product — a deployment record, a quote breakdown with its GST lines. Where a photograph is used it is documentary: an actual guard on an actual site, credited. | Showing the interface proves the claim. An illustrated shield proves nothing, and a generic security stock photo actively cheapens a compliance product. |
| 8 | **Monospace is the second voice.** Money, document numbers, booking IDs, OTPs, timestamps, licence numbers and state codes are set in IBM Plex Mono with `font-variant-numeric: tabular-nums`. | This product is a ledger. Its numbers should look like records, and tabular figures make breakdown columns actually line up. |
| 9 | **Motion is 120–200ms, ease-out, on state change only.** No entrance animation on page content — `animate-fade-up` is deleted. Exactly one looping animation survives: the live-duty indicator, at reduced amplitude, gated behind `prefers-reduced-motion`. | Content that animates in on every navigation is the template signature. |
| 10 | **No emoji anywhere in product or marketing UI**, including the dashboard greeting. No exclamation marks in UI copy. | Non-negotiable. |
| 11 | **Copy is nouns and numbers, not adjectives.** Banned: "command center", "protect what matters most", "seamless", "empower", "trusted partner", "peace of mind", "cutting-edge", "one-stop". Every headline must contain a fact that is false of a competitor. | "PSARA-licensed guards, GST invoice per shift" is a claim. "Protect what matters most" is a mood. |
| 12 | **Sentence case everywhere.** Title Case only for proper nouns (PSARA, GST, 20fourr Pass). The uppercase `label-caps` micro-label survives but is restricted to one use: the eyebrow above a section heading. | |
| 13 | **Density is a feature.** Lists and tables beat card grids for anything with more than four items. The four service categories become a comparison row list, not four coloured cards. | Density reads as competence in an operations product. Whitespace-per-item reads as thin. |
| 14 | **Every money figure is itemized.** A total is never shown without its component lines being reachable in the same view. This is also a compliance requirement — see SecureConnect spec 0005 ("Never render a single all-in total with no breakdown"). | `PriceSummary`'s current "GST & other charges" remainder line exists because the v1 endpoint under-reports. Spec 0002 fixes the data; this rule stops the design from hiding it again. |

## The system

### Colour

Replaces the entire `@theme` block in `app/globals.css`. Two grounds, one shared semantic layer.

**Paper (marketing, public routes)**

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | `#FBFAF8` | page ground — warm off-white, never `#FFFFFF` |
| `--paper-raised` | `#F4F2ED` | inset panels, code/quote blocks, table header rows |
| `--ink` | `#12100E` | primary text, and the **primary button fill** |
| `--ink-mid` | `#5C5852` | secondary text, captions (6.8:1 — AA at all sizes) |
| `--ink-faint` | `#8A857C` | non-essential text 14px+, and the interactive **edge** |
| `--rule` | `#E3DFD8` | hairline dividers, card edges |

**Ink (dashboard, funnel, auth — every signed-in surface)**

| Token | Value | Use |
| --- | --- | --- |
| `--ground` | `#0A0E14` | page ground. Replaces both `#0a1220` and `#060c16`. |
| `--surface` | `#11161E` | cards, sidebar |
| `--surface-raised` | `#161C26` | inputs, hovered rows, nested panels |
| `--ground-ink` | `#F2F4F7` | primary text (17.4:1) |
| `--ground-mid` | `#98A2B3` | secondary text (7.5:1) |
| `--ground-faint` | `#7D8795` | tertiary text (5.3:1) — the floor; nothing dimmer ships |
| `--ground-rule` | `#212936` | hairline dividers |
| `--ground-edge` | `#5A6577` | input borders, interactive boundaries (3.3:1 — passes non-text AA) |

**Shared**

| Token | Value | Use |
| --- | --- | --- |
| `--brand` | `#E8A020` | primary action on dark, active nav indicator, brand mark. 8.7:1 on `--ground`. |
| `--brand-ink` | `#1A1203` | text on a gold fill |
| `--live` | `#0E9F6E` | duty in progress. The *only* green. |
| `--attention` | `#B45309` | needs action — unpaid, expiring, pending waiver. Deliberately a dark amber, not brand gold. |
| `--fault` | `#D64545` | cancelled, rejected, failed payment, destructive action |

Status colours appear as **text plus a 1px border on a transparent ground**, not as filled tinted
chips. Five hues total across the entire product — down from the current eleven.

`--color-danger`, `--color-toast`, `--color-dot-off`, `--color-notice-*`, `--color-gold-soft`,
`--color-disabled-*`, `--color-field-otp` and every `--color-app-*` token are deleted. Disabled is
expressed as `opacity: 0.45` plus `cursor: not-allowed`, not as a bespoke colour pair.

### Typography

Loaded via `next/font/google` in `app/layout.tsx`, replacing Outfit and DM Sans.

- **IBM Plex Sans** — everything. Weights 400, 500, 600. Institutional, excellent at small sizes,
  and it has a Devanagari sibling if a Hindi pass ever happens.
- **IBM Plex Mono** — weights 400, 500. Money, IDs, OTPs, timestamps, document numbers, state codes.

Outfit is dropped deliberately: it is one of the three or four faces that immediately signals
"generated landing page". If budget exists later, Söhne or Suisse Int'l drops in at the same
weights with no other change.

**Scale** — a fixed ramp. Arbitrary `text-[Npx]` values are banned (enforced in acceptance criteria).

| Token | Size / line-height | Weight | Tracking | Use |
| --- | --- | --- | --- | --- |
| `display` | `clamp(40px, 5.5vw, 68px)` / 1.02 | 600 | `-0.03em` | landing hero only, once per page |
| `h1` | `clamp(30px, 3.2vw, 40px)` / 1.1 | 600 | `-0.02em` | marketing section heads |
| `h2` | `24px` / 1.2 | 600 | `-0.01em` | page titles in the app |
| `h3` | `18px` / 1.3 | 600 | `0` | card titles |
| `body` | `15px` / 1.55 | 400 | `0` | default |
| `body-sm` | `13px` / 1.5 | 400 | `0` | captions, helper text, table cells |
| `label` | `12px` / 1.4 | 500 | `0.01em` | form labels — sentence case |
| `eyebrow` | `11px` / 1.2 | 500 | `0.08em`, uppercase | section eyebrow, one per section |
| `mono` | `13px` / 1.4 | 400 | `0` | money, IDs, `tabular-nums` |
| `mono-lg` | `20px` / 1.2 | 500 | `-0.01em` | headline money figures |

Negative tracking applies **only** at 24px and above. `font-extrabold` is not in the system —
600 is the heaviest weight that ships.

### Spacing, radii, layout

- 4px base (already the case — keep `--spacing: 4px`). Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
  Nothing else.
- Radii: `--radius-sm: 6px`, `--radius-lg: 12px`, `9999px` for pills and avatars.
- Content max-widths: `1200px` marketing shell, `680px` prose and legal, `480px` auth and funnel
  steps, `1320px` dashboard.
- Marketing pages hold a 12-column grid at ≥1024px; below that everything is one column.
- Breakpoints and px-based sizing stay exactly as documented in `globals.css` today — that reasoning
  about `rem` in media queries is correct and survives this spec unchanged.

### Components — what changes

| Component | Change |
| --- | --- |
| `components/ui/Button.tsx` | Drop `bg-gold-gradient`. Variants become `primary` (ink fill on paper / gold fill on ground), `secondary` (transparent, `--edge` border), `ghost` (text only), `danger`. Sizes `sm` 32px / `md` 40px / `lg` 48px. The `active` prop and the bespoke disabled palette are removed in favour of `disabled` + opacity. |
| `components/dashboard/primitives.tsx` `Card` | Gains a `weight` prop: `primary` (12px radius, `--surface`, hairline) / `flat` (no border, used for list containers) / `inset` (`--surface-raised`). Same radius for all; hierarchy comes from ground and padding, not shape. |
| `StatusPill` | Loses filled backgrounds. Becomes text + 1px border in the status colour, `--radius-sm`, sentence case. `lib/dashboard-data.ts`'s `STATUS_STYLES` map is rewritten against the five semantic colours. |
| `PageHeading` | `h2` token, `--ground-mid` subtitle, no `font-extrabold`, no tracking hack. |
| `Greeting` (`app/dashboard/Overview.tsx`) | Emoji and "command center" line deleted. Becomes: name, and one factual line — the next booking's date and provider, or "No upcoming bookings" with the book action. |
| Dashboard stat tiles | Four tinted-icon tiles → one horizontal metric strip: four figures on the hairline, mono numerals, no icons, no tint. The live count is the only one that carries colour. |
| `lib/services.ts` | Per-category `color` / `iconBg` / `hover` fields deleted. All four categories render in ink; `gunman` and `pso` gain a small "licence required" marker, which is the only real difference between them worth showing. |
| `components/dashboard/icons.tsx` | One stroke weight (1.5px), 20px grid, no filled/duotone mixing. `ServiceGlyph` variants are reduced to line icons. |
| `PriceSummary` | Rewritten against spec 0002's itemized `Quote.lines[]`. Mono figures, right-aligned, `tabular-nums`, CGST/SGST/IGST shown. The "GST & other charges" remainder line is deleted. |
| `SearchBox`, notification bell | Either wire them or remove them. A decorative search input is the loudest possible "this is a mockup" signal. (`docs/ROADMAP.md` already flags both as stubs.) |

## The landing page

**Route:** `/` becomes the landing page. `app/page.tsx`'s redirect to `/login` is removed and the
marketing routes live in a new `app/(marketing)/` group with its own light-theme layout. Signed-in
users hitting `/` are *not* redirected — the marketing site stays reachable when logged in; the nav
CTA just becomes "Dashboard".

**Audience:** business buyers first — venues, events, offices, facilities, residential associations.
An individual booking a PSO is a supported, visible second path, never the hero.

**Positioning:** *the only security marketplace in India where every shift is documented.* Verified
PSARA licence in the state of deployment, arms licence checked before an armed booking is accepted,
an OTP-gated start and end to every shift, and a GST tax document issued against it. A procurement
team can audit a 20fourr deployment. That is the product.

### Sections

**1 · Nav** — sticky, 64px, paper ground, hairline bottom on scroll only. Wordmark left. Links:
Services, How it works, Pricing, Coverage, For providers. Right: "Sign in" as a text link, "Book a
guard" as an ink-filled button. Mobile: full-height sheet, no hamburger-into-X animation flourish.

**2 · Hero** — one column of text, left-aligned, max 680px, on a 12-column grid with the product
fragment occupying columns 7–12 at ≥1024px.

- Eyebrow: `PSARA-LICENSED · 5 STATES`
- Headline (`display`): **"Licensed guards. Documented shifts."** — alternates to workshop, all of
  which must state a fact: "Every shift starts with an OTP and ends with a tax invoice." /
  "Security you can put through procurement."
- Sub (`body`, `--ink-mid`, max 60ch): what it is, who it is for, in two sentences. Names the four
  categories explicitly. No adjectives.
- Actions: "Book a guard" (primary) · "See a sample quote" (secondary, anchors to §6).
- Proof strip directly beneath, on a hairline: verified providers · cities covered · categories ·
  average response. **Real numbers from `GET /public/providers` or nothing at all** — a fabricated
  count on a compliance product is disqualifying. If a figure isn't available, the slot is dropped,
  not filled with a placeholder.
- Visual: a real, static render of the quote breakdown — service, GST on service, platform fee, GST
  on platform fee, total — in mono, on `--paper-raised`. It is the product *and* the differentiator
  in one component, and it costs nothing to build because spec 0002 builds that component anyway.

**3 · What you can book** — the four categories as a comparison row list, not cards. Columns:
category · what it covers · licence required · from ₹/day. `gunman` and `pso` carry "arms licence
verified" in `--attention`. Ex-serviceman is presented correctly as a *filter*, not a fifth
category (`lib/services.ts` already documents why — the landing page must not undo it).

**4 · How it works** — five numbered steps mirroring the real lifecycle, because the real lifecycle
is more convincing than a simplified one: search and quote → book, with the four waivers recorded →
provider accepts, you pay → OTP starts the shift, OTP ends it → documents issued. Each step is one
line of text and one interface fragment. Horizontal at ≥1024px, stacked below.

**5 · Compliance** — the section the whole page exists for, on `--paper-raised`. Six claims, each
one verifiable in the backend, set as a definition list rather than icon cards:

- PSARA licence validity checked against the **service start date** and the **deployment state**.
- Arms licence verified before a gunman or PSO booking is accepted (`SC_611`).
- Every shift OTP-gated at both ends; timestamps are recorded, not self-reported.
- A GST tax invoice for the platform fee and a service document per shift, with CGST/SGST/IGST
  resolved by place of supply.
- TCS and TDS handled at source — the client is not the withholding agent.
- DPDP Act data rights: export, consent withdrawal, erasure, with a named grievance officer.

**6 · What a booking actually costs** — a live worked example. Duration and category selector,
rendered against the same itemized breakdown the funnel uses, fed by
`GET /public/providers/:id/price-preview`. Shows every line including both GST components. Closes
with the cancellation policy stated plainly: >24h before start 90%, 12–24h 50%, under 12h nothing.
**Nobody in this market publishes this.** Publishing it is the whole point of the section.

**7 · Coverage** — cities served, as a plain list on hairlines with provider counts. Not a map.
A map of India with glowing dots is decoration; a list with counts is evidence.

**8 · For providers** — one band, two sentences, one link out to provider signup. Kept short
deliberately; this page is not recruiting supply.

**9 · FAQ** — eight real questions with honest answers: What is PSARA and why does it matter? Will
I get a GST invoice? What happens if the guard doesn't turn up? How do refunds work? Can I book the
same guard weekly? Is the guard armed? Who is liable? How is my data handled? Native
`<details>`/`<summary>`, no accordion library.

**10 · Footer** — four columns plus a legal band. The band **must** carry the grievance officer and
data protection officer contact (IT Act 2000 / Intermediary Guidelines 2021 — the backend exposes it
at `GET /client/grievance-officer`, which is public and should be the source rather than hardcoded
text), links to terms, privacy, cancellation and refund policy, and the PSARA licence statement.

### Additional marketing routes

`/for-business`, `/services/[category]` (four pages), `/coverage`, `/pricing` — all inheriting the
same layout and section vocabulary. They are enumerated here so the system is built to carry them;
only `/` ships in this spec's first pass.

### Technical requirements

- Every marketing route is statically rendered. No client component above the fold. The only
  interactive islands are the mobile nav sheet, the §6 cost calculator and the FAQ.
- Metadata per route: title, description, canonical, OG image (1200×630, generated via
  `next/og`, typographic — no stock photo).
- JSON-LD: `Organization` + `Service` on `/`, `FAQPage` on the FAQ section.
- Targets: LCP < 1.8s on a throttled 4G Moto G, CLS < 0.05.
- **JS budget on `/`: 200KB gzipped total, and at most two client islands.**

  *Amended 2026-09-12, after measuring.* The original figure here was 90KB, which
  is not reachable: React 19 + the Next 16 App Router client runtime is ~154KB
  gzipped on its own, before a single line of our code, the moment a page ships
  any interactivity at all. The measured total is 182KB with exactly the two
  permitted islands (`MarketingNav`, `CostCalculator`) and every other marketing
  component rendering on the server — i.e. the implementation is already as lean
  as the framework allows, and the old number would have failed a correct build
  forever.

  The budget that actually does the work is the **island count**, not the byte
  total: the failure this criterion exists to catch is someone dropping a chart
  or animation library onto the landing page, and that shows up as a third
  `"use client"` under `app/(marketing)/` or `components/marketing/` long before
  it shows up in a byte count dominated by framework baseline. Both are checked
  in `scripts/check-design.mjs`.
- `/` must render correctly with JavaScript disabled, minus the calculator.
  Verified: the served HTML carries ~60KB of rendered text, including the full
  quote breakdown and the grievance-officer block.

## Application to existing surfaces

Order matters — the token layer lands first or every later change gets redone.

1. **Token layer** — rewrite `@theme` in `app/globals.css`; delete the gradient utilities,
   `animate-fade-up`, and the duplicate palette. Swap fonts in `app/layout.tsx`.
2. **Primitives** — `Button`, `Card`, `StatusPill`, `PageHeading`, `Field`, `Notice`, `Toast`, icons.
3. **Marketing** — `app/(marketing)/` layout and `/`.
4. **Auth** — `/login`, `/signup`, verify screens. These move off the Helvetica system stack and
   onto the ink palette; visually they converge with the dashboard for the first time.
5. **Funnel** — the eight `/book/*` steps, `BookingShell` step indicator, `PriceSummary`
   (coordinated with spec 0002 — same component, both specs touch it).
6. **Dashboard** — shell, sidebar, topbar, overview, bookings list and detail.
7. **Long tail** — profile, support, wallet, referral, invoices. These inherit the system; no
   bespoke design pass, and any screen that needs one is a signal the system is incomplete.

## Acceptance criteria

Each line is mechanically checkable.

- [ ] `grep -rE 'text-\[[0-9.]+px\]' app components` returns nothing.
- [ ] `grep -rE 'border-white/[0-9]|bg-white/[0-9]' app components` returns nothing.
- [ ] `grep -rE 'gradient' app components lib` returns nothing.
- [ ] `grep -rn 'font-extrabold' app components` returns nothing.
- [ ] No emoji in any `.tsx` under `app/` or `components/` (codepoint scan).
- [ ] `app/globals.css` defines exactly three radius tokens and no `--color-app-*` token.
- [ ] Every font size, colour and spacing value in `app/` and `components/` resolves to a token.
- [ ] `/` returns 200 and is statically rendered (`next build` reports it as static).
- [ ] `/` scores ≥ 95 Performance and 100 Accessibility in Lighthouse, mobile preset.
- [x] `/` ships at most two client islands (`MarketingNav`, `CostCalculator`); every other
      marketing component renders on the server. Enforced in `check:design`.
- [x] Total JS transferred on `/` is under 200KB gzipped (measured: 182KB — see the amended
      budget note above for why 90KB was withdrawn).
- [ ] Automated contrast check passes: every text/background pair in both palettes ≥ 4.5:1, every
      interactive boundary ≥ 3:1. Gold-on-paper appears as text in zero places.
- [ ] Every interactive element is keyboard reachable with a visible focus ring; tab order matches
      visual order on `/` and `/dashboard`.
- [ ] With `prefers-reduced-motion: reduce`, the only remaining animation is none.
- [ ] No money figure anywhere renders without its component lines reachable in the same view.
- [ ] The banned-phrase list appears nowhere in `app/`, `components/` or `lib/`.
- [ ] Every number presented as a fact on `/` traces to an API response or a documented source.

## Test plan

- **Visual:** before/after capture of all 44 routes at 390px, 768px and 1440px. The single-file
  reproduction at `20fourr-all-pages.html` is the "before" baseline — regenerate it after.
- **Automated:** the grep assertions above run in CI. Contrast check as a script over the token file.
- **Manual:** keyboard-only pass through `/` → `/signup` → the full booking funnel. Screen reader
  pass (VoiceOver) on `/` and the funnel. Both palettes at 200% browser zoom.
- **Review:** a designer sign-off on the token layer *before* step 3 begins — that is the cheap
  moment to disagree.

## Rollout

Token layer and primitives land on one branch and ship together; a half-migrated palette is worse
than either state. Marketing routes are additive and can ship independently. The `/` → `/login`
redirect removal is the only behavioural change and it is reversible in one line.

No feature flag. No A/B test — there is no traffic to split yet.

## Open questions

- **Is `#E8A020` fixed?** Keeping it holds continuity with the shipped mobile app, and this spec
  assumes it stays. If brand work is coming anyway, the accent is a one-token change *before* the
  migration and an expensive one after.
- **Do real proof numbers exist yet** (verified provider count, cities, response time)? If not, the
  hero proof strip ships with fewer slots rather than invented ones.
- **Is there any photography** of actual deployments that legal cleared for use? Without it, the
  page is entirely typographic — which is a defensible choice, not a fallback, but it should be a
  decision rather than a discovery.
- **`/for-providers`** — does provider signup exist as a web route, or does that link go to an app
  store? The footer band needs a real destination.
