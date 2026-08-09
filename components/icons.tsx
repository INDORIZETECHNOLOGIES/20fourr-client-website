import type { SVGProps } from "react";

/**
 * Every icon here is a verbatim path extraction from the approved design files
 * (Login / Signup / VerifyPhone / VerifyEmail). Stroke color and size come from
 * the call site via `currentColor` + width/height so a single definition can
 * serve the several places each icon appears at different sizes.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 18, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Plain shield — the PSARA badge mark. */
export function ShieldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3z" />
    </Icon>
  );
}

/** Shield with a check — the "256-bit encrypted" trust line. */
export function ShieldCheckIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2} {...props}>
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 6h18v12H3z" />
      <path d="m3 6 9 7 9-7" />
    </Icon>
  );
}

/** Mail with a check — the VerifyEmail hero mark. */
export function MailCheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 7h18v10H3z" />
      <path d="m3 7 9 6 9-6" />
      <path d="m15.5 15 1.5 1.5 3-3" />
    </Icon>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Icon>
  );
}

/** Lock with a check — the confirm-password field. */
export function LockCheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="m9.5 15 1.5 1.5 3-3" />
    </Icon>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <Icon size={20} {...props}>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}

/** Not in the source — the designs show only the open eye, never a toggled state. */
export function EyeOffIcon(props: IconProps) {
  return (
    <Icon size={20} {...props}>
      <path d="M1 12s4-7 11-7c2.1 0 3.9.6 5.4 1.5M23 12s-4 7-11 7c-2.1 0-3.9-.6-5.4-1.5" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="M3 3l18 18" />
    </Icon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </Icon>
  );
}

/** User with a plus — the "Don't have an account?" footer on Login. */
export function UserPlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </Icon>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
    </Icon>
  );
}

/** Chat bubble with lines — the VerifyPhone hero mark (SMS). */
export function SmsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.3L3 21l1.2-4.5A8.4 8.4 0 1 1 21 11.5z" />
      <path d="M8 11h8M8 14h5" />
    </Icon>
  );
}

export function GiftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="8" width="18" height="4" />
      <path d="M5 12v8h14v-8M12 8v12M12 8S9 3 6.5 5.5 12 8 12 8zM12 8s3-5 5.5-2.5S12 8 12 8z" />
    </Icon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Icon size={22} strokeWidth={2} {...props}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </Icon>
  );
}

/** Sign-in arrow — the "Already have an account?" footer on Signup. */
export function SignInIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5M15 12H3" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2.5} {...props}>
      <path d="m5 12 4 4 10-10" />
    </Icon>
  );
}

/** Not in the source — needed for the button loading state, which the designs lack. */
export function SpinnerIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin-slow"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2.5} opacity={0.25} />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </svg>
  );
}
