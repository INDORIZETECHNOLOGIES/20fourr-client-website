# Website specs

Same convention as `SecureConnect/specs` — a spec is a contract written before the code, numbered
sequentially, and `approved` is the gate where implementation starts. Statuses: `draft` →
`approved` → `building` → `shipped` (or `parked` / `superseded`).

These are numbered independently of the backend's specs; a reference to "spec 0005" without a repo
name means the backend's.

| # | Spec | Status | Summary |
| --- | --- | --- | --- |
| 0001 | [Design system v2 and the public landing page](0001-design-system-v2-and-landing-page.md) | building | One palette, one type scale, two radii, applied across marketing, auth, funnel and dashboard — plus the landing page the site doesn't have. |
| 0002 | [v6 billing and API realignment](0002-v6-billing-and-api-realignment.md) | building | Make the site engine-aware: v6 quotes, deployment location, tax documents, and honest refund copy. |

0001 and 0002 both touch `app/book/PriceSummary.tsx`. 0002 owns its data contract, 0001 owns its
appearance — 0002's union landed first, as planned.

## Checks

Both specs' mechanically checkable criteria are enforced by two scripts. Run them before any
commit that touches UI or the money path:

```
npm run check:design   # spec 0001 bans + contrast + island budget, and spec 0002's copy bans
npm run test:quote     # toDisplayLines on both engines + the marketing worked example
```

`check:design` uses `grep` and only reaches for `rg` when it is actually installed — it silently
never ran for its first day because it assumed ripgrep was present.

## Sources

The authority for v6 behaviour, in descending order: the platform architecture document
(`SecureConnect/new-architecture/20fourr_Platform_Architecture_v6.0_FINAL.docx` — CA Audit 2), then
the backend specs `0004`–`0008` that implement it, then `CLIENT_API_REFERENCE.md` which is a
snapshot of what is actually built. They disagree in places, and where they do the architecture says
what *should* happen and the reference says what *does* — 0002's open questions name each gap.

## What is verified, and what is not

Verified mechanically, green as of 2026-09-12: typecheck, production build, every grep ban in both
specs, WCAG contrast on all eleven token pairs, the emoji scan, the two-island budget on `/`, the
v1/v6 display-line fixtures, and the marketing worked example against spec 0005's commission rule.

## Does the backend need work for these specs?

**No, and the two gaps found while auditing are now fixed.** Audited 2026-09-12 against the architecture document and the live routes: every endpoint
specs 0001 and 0002 depend on exists and is mounted — `/public/billing-flags`, `/public/providers*`,
`/documents/*` (`taxDocument.routes.ts` at `/documents`), price-preview with `deploymentState`,
`POST /bookings` with `deployment`, `/client/service-cities`, `/client/grievance-officer`, and
`state` on provider search. The website is not blocked on backend work.

The backend does have architecture gaps, but none of them block this repo:

| Gap | Client-visible? | Blocks the website? |
| --- | --- | --- |
| ~~**v6 refund disbursement**~~ — **specified and built**: SecureConnect `specs/0009-refund-payable-release.md`, merged to `main` in PR #123. The cron is registered but deliberately not started, pending a Razorpay test-mode check. | Yes — `refundState` on the booking read | No |
| ~~**`GET /client/grievance-officer` is not public**~~ despite both API reference docs saying so — the whole `/client` tree is behind `authenticate`, so it returned SC_106 and the marketing footer silently fell back to prose. **Fixed**: `GET /public/grievance-officer` on branch `fix/public-grievance-officer`. | Yes — the footer | It was, for a legal requirement |
| Razorpay Route `on_hold` entitlement (spec 0007) — provider payouts | No | No |
| Flags off: `billingV6.enabled`, `REQUIRE_PSARA_STATE_MATCH`, `REQUIRE_ARMED_CLIENT_KYC` | No | No — all three are handled on both settings |

**Not verified, and not claimable yet:**

- **v6 has never been exercised end to end against a real server.** Note that the local API at
  `:3000` now reports `{"v6Enabled": true}` — so the v6 path is live on this environment and the
  funnel *can* finally be walked through against it. That has not been done yet. Until it is, every
  v6 response shape is trusted from `backend/src/billing/quote/types.ts` rather than observed, and
  the v6 money path should not be called tested. **This is now the single highest-value remaining
  task on either spec**, and it is no longer blocked.
- Lighthouse, keyboard-only and screen-reader passes on `/` and the funnel — all still manual.
- The before/after visual capture across all routes; `20fourr-all-pages.html` is still the old
  "before" baseline and has not been regenerated.
