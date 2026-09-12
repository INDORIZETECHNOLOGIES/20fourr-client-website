import type { SVGProps } from "react";
import type { ServiceIcon } from "@/lib/dashboard-data";

/**
 * Icons for the dashboard shell, extracted verbatim from the design file.
 * Stroke icons inherit `currentColor`; the shield is a fill icon.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Stroke({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Filled shield — the 20fourr mark used throughout the dashboard. */
export function ShieldFill({ size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
    </svg>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </Stroke>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Stroke>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </Stroke>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Stroke>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Stroke>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Stroke>
  );
}

export function CardIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </Stroke>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </Stroke>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Stroke>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Stroke size={13} {...props}>
      <path d="M9 18l6-6-6-6" />
    </Stroke>
  );
}

export function ChevronUpIcon(props: IconProps) {
  return (
    <Stroke size={10} strokeWidth={2.5} {...props}>
      <polyline points="18 15 12 9 6 15" />
    </Stroke>
  );
}

export function DotsIcon(props: IconProps) {
  return (
    <Stroke size={13} {...props}>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </Stroke>
  );
}

export function StarFill({ size = 14, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export function ActivityIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </Stroke>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </Stroke>
  );
}

/**
 * Pistol silhouette — slide along the top, receiver, grip raking down and back.
 * Replaces the design file's `gun` path, which was a cluster of eight rounded
 * bars that read as a logo mark rather than a firearm.
 */
export function PistolIcon(props: IconProps) {
  return (
    <Stroke strokeLinejoin="round" {...props}>
      <path d="M3.5 6.5h17V10h-8.5v2.5h-1.8l-2.2 5.5H3.2l2.2-5.5H3.5z" />
      <path d="M11 12.5v-2.5" />
    </Stroke>
  );
}

/** Event ticket — for Event Security, which the design gave a house icon. */
export function TicketIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M3 8.5V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.5a2.8 2.8 0 0 0 0 5.6V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2.9a2.8 2.8 0 0 0 0-5.6z" />
      <path d="M14.5 5v2M14.5 11v2M14.5 17v2" />
    </Stroke>
  );
}

/** Police badge: shield with a star — for PSO (Police Service Officer). */
export function PoliceBadgeIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3z" />
      <path d="m12 7.6 1.3 2.7 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z" />
    </Stroke>
  );
}

/** Service medal on a ribbon — for Ex-Servicemen. */
export function MedalIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M8.6 10.2 5.5 2.5h4L12 7l2.5-4.5h4l-3.1 7.7" />
      <circle cx="12" cy="15.5" r="5.5" />
      <path d="m12 12.6 1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" />
    </Stroke>
  );
}

/** A person behind a shield — for Personal Guard (close protection). */
export function UserShieldIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <circle cx="9" cy="7" r="3.8" />
      <path d="M2.5 20.5v-1.6a4.4 4.4 0 0 1 4.4-4.4h3.4" />
      <path d="M18 12.4 14.2 14v2.6c0 2.2 1.6 3.8 3.8 4.7 2.2-.9 3.8-2.5 3.8-4.7V14z" />
    </Stroke>
  );
}

export function BriefcaseIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </Stroke>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Stroke>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </Stroke>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 15 19.79 19.79 0 0 1 1.62 6.38A2 2 0 0 1 3.62 4.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 11.1a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 19" />
    </Stroke>
  );
}

/* ---------------------------------------------------------------------------
   Profile screen. These mirror the mobile app's Profile: solid glyphs in tinted
   gold discs. The `evenodd` fill rule turns the inner subpaths into knock-outs,
   which is how the pin gets its hole and the shield its exclamation mark.
   --------------------------------------------------------------------------- */

export function CameraIcon({ size = 16, ...props }: IconProps) {
  return (
    <Stroke size={size} {...props}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.8-2.6h6.4L17 7h3a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13.5" r="3.6" />
    </Stroke>
  );
}

export function CheckCircleFill({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      fillRule="evenodd"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm5 7.2-6.3 6.9-3.7-3.6 1.4-1.45 2.2 2.15 4.9-5.4z" />
    </svg>
  );
}

export function PinFill({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      fillRule="evenodd"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M12 2a7.2 7.2 0 0 0-7.2 7.2C4.8 14.6 12 22 12 22s7.2-7.4 7.2-12.8A7.2 7.2 0 0 0 12 2zm0 4.6a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2z" />
    </svg>
  );
}

export function CrownFill({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M2.2 7.6 7.1 11 12 4.2 16.9 11l4.9-3.4-1.8 10.1H4z" />
      <rect x="4" y="19.4" width="16" height="1.9" rx="0.9" />
    </svg>
  );
}

export function ShieldAlertFill({ size = 16, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      fillRule="evenodd"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M12 1.6 3.4 4.8v6.4c0 5.3 3.7 9.1 8.6 10.7 4.9-1.6 8.6-5.4 8.6-10.7V4.8zM11 6.6h2v6.6h-2zm0 8.4h2v2.1h-2z" />
    </svg>
  );
}

/** A person with a pencil — Edit Profile. */
export function UserEditIcon({ size = 16, ...props }: IconProps) {
  return (
    <Stroke size={size} {...props}>
      <circle cx="9.5" cy="7" r="3.6" />
      <path d="M3 20v-1.1A4.9 4.9 0 0 1 7.9 14h3.2" />
      <path d="m19.4 12.2-5.6 5.6-2.9.6.6-2.9 5.6-5.6a1.63 1.63 0 0 1 2.3 2.3z" />
    </Stroke>
  );
}

export function WalletIcon({ size = 16, ...props }: IconProps) {
  return (
    <Stroke size={size} {...props}>
      <path d="M3 8.2a2.2 2.2 0 0 1 2.2-2.2h11.6A2.2 2.2 0 0 1 19 8.2v9.6a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 17.8z" />
      <path d="M19 11.2h2.4v4.2H19a2.1 2.1 0 0 1 0-4.2z" />
    </Stroke>
  );
}

/** Receipt with a torn edge — My Invoices. */
export function InvoiceIcon({ size = 16, ...props }: IconProps) {
  return (
    <Stroke size={size} strokeLinejoin="round" {...props}>
      <path d="M5 2.8h14v18.4l-2.3-1.6-2.3 1.6-2.4-1.6-2.4 1.6-2.3-1.6L5 21.2z" />
      <path d="M9 8h6M9 12h6" />
    </Stroke>
  );
}

export function AlertCircleIcon({ size = 16, ...props }: IconProps) {
  return (
    <Stroke size={size} {...props}>
      <circle cx="12" cy="12" r="9.2" />
      <path d="M12 7.4v5.2M12 16.2h.01" />
    </Stroke>
  );
}

/** Shield with a padlock — Privacy & Data Rights. */
export function ShieldLockIcon({ size = 16, ...props }: IconProps) {
  return (
    <Stroke size={size} {...props}>
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5z" />
      <rect x="9.2" y="10.9" width="5.6" height="4.7" rx="1.1" />
      <path d="M10.7 10.9V9.7a1.3 1.3 0 0 1 2.6 0v1.2" />
    </Stroke>
  );
}

/** Padlock — Change Password. */
export function LockIcon({ size = 16, ...props }: IconProps) {
  return (
    <Stroke size={size} {...props}>
      <rect x="4.8" y="10.6" width="14.4" height="9.4" rx="2.1" />
      <path d="M8.4 10.6V7.8a3.6 3.6 0 0 1 7.2 0v2.8" />
      <path d="M12 14.4v2" />
    </Stroke>
  );
}

export function SunIcon({ size = 16, ...props }: IconProps) {
  return (
    <Stroke size={size} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.2v2.2M12 19.6v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.2 12h2.2M19.6 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
    </Stroke>
  );
}

export function MoonIcon({ size = 16, ...props }: IconProps) {
  return (
    <Stroke size={size} {...props}>
      <path d="M21 12.9A9.1 9.1 0 1 1 11.1 3a7.1 7.1 0 0 0 9.9 9.9z" />
    </Stroke>
  );
}

export function HelpCircleIcon({ size = 16, ...props }: IconProps) {
  return (
    <Stroke size={size} {...props}>
      <circle cx="12" cy="12" r="9.2" />
      <path d="M9.4 9.3a2.65 2.65 0 1 1 3.5 2.5c-.6.22-.9.75-.9 1.4v.45" />
      <path d="M12 16.9h.01" />
    </Stroke>
  );
}

export function SignOutIcon({ size = 16, ...props }: IconProps) {
  return (
    <Stroke size={size} {...props}>
      <path d="M9.6 21H6a2.1 2.1 0 0 1-2.1-2.1V5.1A2.1 2.1 0 0 1 6 3h3.6" />
      <path d="m15.6 16.4 4.4-4.4-4.4-4.4" />
      <path d="M20 12H9.4" />
    </Stroke>
  );
}

export function CheckIcon({ size = 14, ...props }: IconProps) {
  return (
    <Stroke size={size} strokeWidth={2.6} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </Stroke>
  );
}

export function PlusIcon({ size = 16, ...props }: IconProps) {
  return (
    <Stroke size={size} strokeWidth={2.2} {...props}>
      <path d="M12 5.2v13.6M5.2 12h13.6" />
    </Stroke>
  );
}

export function PencilIcon({ size = 16, ...props }: IconProps) {
  return (
    <Stroke size={size} {...props}>
      <path d="m17.6 3.6 2.8 2.8a1.4 1.4 0 0 1 0 2L9.2 19.6 4 20l.4-5.2L15.6 3.6a1.4 1.4 0 0 1 2 0z" />
      <path d="m14.6 5.6 3.8 3.8" />
    </Stroke>
  );
}

export function TrashIcon({ size = 16, ...props }: IconProps) {
  return (
    <Stroke size={size} {...props}>
      <path d="M3.8 6.2h16.4" />
      <path d="M8.4 6.2V4.6a1.6 1.6 0 0 1 1.6-1.6h4a1.6 1.6 0 0 1 1.6 1.6v1.6" />
      <path d="M18.4 6.2 17.6 19a1.8 1.8 0 0 1-1.8 1.7H8.2A1.8 1.8 0 0 1 6.4 19L5.6 6.2" />
      <path d="M10.3 10.4v6M13.7 10.4v6" />
    </Stroke>
  );
}

export function ArrowLeftIcon({ size = 18, ...props }: IconProps) {
  return (
    <Stroke size={size} strokeWidth={2.2} {...props}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </Stroke>
  );
}

export function GiftIcon({ size = 16, ...props }: IconProps) {
  return (
    <Stroke size={size} {...props}>
      <rect x="2.6" y="7.6" width="18.8" height="4.4" rx="1" />
      <path d="M4.6 12v8.4h14.8V12M12 7.6v12.8" />
      <path d="M12 7.6S9.2 2.6 6.6 5.1 12 7.6 12 7.6zM12 7.6s2.8-5 5.4-2.5S12 7.6 12 7.6z" />
    </Stroke>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Stroke size={18} {...props}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </Stroke>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Stroke size={18} {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </Stroke>
  );
}

/**
 * Resolves a Service's icon key to its component.
 *
 * All stroke-weight, deliberately: the design mixed a solid shield in with seven
 * outline glyphs, which read as an inconsistent set once they sit in one column.
 */
export function ServiceGlyph({ icon, size }: { icon: ServiceIcon; size?: number }) {
  switch (icon) {
    case "crowd":
      return <UsersIcon size={size} />;
    case "pistol":
      return <PistolIcon size={size} />;
    case "ticket":
      return <TicketIcon size={size} />;
    case "police":
      return <PoliceBadgeIcon size={size} />;
    case "medal":
      return <MedalIcon size={size} />;
    case "guard":
      return <UserShieldIcon size={size} />;
    case "building":
      return <BuildingIcon size={size} />;
    case "briefcase":
      return <BriefcaseIcon size={size} />;
    case "shield":
    default:
      return <ShieldIcon size={size} />;
  }
}

/** Duty verification — the start/end code a client reads out to the guard. */
export function KeyIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="M10.7 12.3 21 2" />
      <path d="M17 6l3 3" />
      <path d="M14 9l2.5 2.5" />
    </svg>
  );
}
