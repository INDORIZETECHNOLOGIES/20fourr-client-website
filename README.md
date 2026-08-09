# 20fourr — client website

Auth flow for a PSARA-licensed security services platform, built from the approved
Claude Design screens (`Login`, `Signup`, `VerifyPhone`, `VerifyEmail`).

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4. No other runtime deps.

```bash
npm run dev     # http://localhost:3000 → redirects to /login
npm run build
```

## Flow

```
/login  ⇄  /signup  →  /verify-phone  →  /verify-email  →  /dashboard
   ↓
/forgot-password
```

`/dashboard` is a placeholder. `/forgot-password` is not one of the four imported
screens — the Login design links to it but no such screen exists in the project, so
it was built from the same components rather than left as a dead link.

## Demo behaviour

There is no backend. `lib/auth.ts` is a stubbed service with realistic latency and
failure modes — it is the **only** file that needs rewriting to wire a real API.

| Input | Result |
| --- | --- |
| OTP `123456` | verifies (any other 6 digits are rejected) |
| password `wrongpassword` on sign-in | "Incorrect password" |
| email `unknown@email.com` on sign-in | "No account found" |
| email `taken@email.com` on sign-up | "Account already exists" |
| anything else | succeeds |

The accepted OTP is shown on-screen in dev builds only (`NODE_ENV !== "production"`).

## Structure

```
app/(auth)/            the four screens; each page.tsx is a server component
                       wrapping a client form component
components/ui/         Field, PasswordField, PasswordStrength, OtpInput,
                       Button, Notice, Toast, FormError, BackButton
components/brand/      BrandMark, PhoneMark, PsaraBadge, TrustLine
components/icons.tsx   every SVG, extracted verbatim from the designs
hooks/useOtp.ts        OTP state machine ported from the designs' DCLogic block
hooks/useCountdown.ts  resend timer
lib/auth.ts            ← swap this for the real API
lib/validation.ts      field validators + the 4-part password rule
lib/session.ts         carries signup identity to the verify screens
```

Design tokens live in `app/globals.css` under `@theme`. Every color is lifted
verbatim from the source files; `--color-danger` is the one addition, since the
designs have no error state and therefore define no error color.

### Units: px, not rem

Breakpoints (`--breakpoint-*`), the spacing base (`--spacing`), and the display
type scale are all pinned to px, overriding Tailwind's rem defaults.

Tailwind v4 defines breakpoints in `rem`, and inside a media query `rem` resolves
against the browser's **default** font size — not the `html` element's. A reader
who sets Chrome to a 20px default therefore gets every breakpoint scaled 1.25×
(`sm` 640→800, `lg` 1024→1280) and sees the wrong layout for their window width.
The same root font also inflated rem spacing while the design's own absolute
values (`px-[18px]`, `max-w-[620px]`) stayed put, so the two drifted apart and
the OTP boxes fell short of their 74px cap.

These are px comps, so px units reproduce them for every reader. If you would
rather have the layout scale with the reader's font preference, delete those
overrides and accept that the breakpoints move.

## Deviations from the source designs

Intentional, to make the screens function as a real auth flow:

- **Responsive.** The designs are fixed desktop layouts. The two-column screens
  stack below `lg`; OTP boxes flex and hold a 5:6 ratio, reaching the designs'
  exact 80×96 / 74×88 at desktop and scaling down instead of overflowing.
- **Signup fields are paired** (name, email/phone, password/confirm) so the card
  fits on screen without scrolling. The design stacks all seven full-width.
- **Validation and error states**, which the designs have none of.
- **The password eye toggles.** In the designs it is a decorative icon.
- **The password rule strip became a live strength meter**, same panel treatment.
- **The toast is transient.** The design pins it permanently visible with no trigger.
- **VerifyEmail gained a resend control** to match VerifyPhone; the design has none,
  despite telling the user the code expires.
- **Accessibility**: real `<label>`s, `aria-invalid`/`aria-describedby`, `aria-live`
  regions, `autocomplete="one-time-code"`, and visible focus rings — the source sets
  `outline:none` everywhere without a replacement.

`support.js` in the design project was not ported: it is the generated `dc-runtime`
that renders `<x-dc>` templates in the Design preview, not application code.
