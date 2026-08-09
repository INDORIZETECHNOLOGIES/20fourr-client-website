import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType } from "react";
import { Card } from "@/components/dashboard/primitives";
import { AppearanceToggle } from "./AppearanceToggle";
import { SignOutButton } from "./SignOutButton";
import { ProfileHero } from "./ProfileHero";
import {
  AlertCircleIcon,
  ChevronRightIcon,
  CrownFill,
  GiftIcon,
  HelpCircleIcon,
  InvoiceIcon,
  LockIcon,
  PinFill,
  ShieldAlertFill,
  ShieldLockIcon,
  UserEditIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/dashboard/icons";

export const metadata: Metadata = { title: "Profile" };

type Tint = "gold" | "green" | "red" | "blue";

const TINTS: Record<Tint, string> = {
  gold: "bg-app-gold/12 text-app-gold",
  green: "bg-green-500/12 text-green-500",
  red: "bg-red-500/12 text-red-500",
  blue: "bg-app-info/12 text-app-info",
};

type Row = {
  href: string;
  label: string;
  Icon: ComponentType<{ size?: number }>;
  tint: Tint;
};

const ACCOUNT_SETTINGS: Row[] = [
  { href: "/dashboard/profile/edit", label: "Edit Profile", Icon: UserEditIcon, tint: "gold" },
  { href: "/dashboard/profile/addresses", label: "Saved Addresses", Icon: PinFill, tint: "gold" },
  { href: "/dashboard/profile/providers", label: "Preferred & Blocked", Icon: UsersIcon, tint: "gold" },
  { href: "/dashboard/profile/membership", label: "20fourr Pass", Icon: CrownFill, tint: "gold" },
  { href: "/dashboard/profile/referral", label: "Refer & Earn", Icon: GiftIcon, tint: "gold" },
  { href: "/dashboard/profile/threat-assessment", label: "Threat Assessment", Icon: ShieldAlertFill, tint: "gold" },
  { href: "/dashboard/profile/wallet", label: "My Wallet", Icon: WalletIcon, tint: "green" },
  { href: "/dashboard/profile/invoices", label: "My Invoices", Icon: InvoiceIcon, tint: "gold" },
  { href: "/dashboard/profile/penalties", label: "Account Standing", Icon: AlertCircleIcon, tint: "red" },
  { href: "/dashboard/profile/privacy", label: "Privacy & Data Rights", Icon: ShieldLockIcon, tint: "blue" },
  { href: "/dashboard/profile/change-password", label: "Change Password", Icon: LockIcon, tint: "red" },
];

const SUPPORT_ROWS: Row[] = [
  { href: "/dashboard/support", label: "Help Center", Icon: HelpCircleIcon, tint: "gold" },
];

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <ProfileHero />
      <SectionLabel>Account Settings</SectionLabel>
      <SettingsCard rows={ACCOUNT_SETTINGS} />

      <SectionLabel>Appearance</SectionLabel>
      <Card className="px-5 py-5">
        <AppearanceToggle />
      </Card>

      <SectionLabel>Support</SectionLabel>
      <SettingsCard rows={SUPPORT_ROWS} />

      <div className="mt-8">
        <SignOutButton />
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 mt-8 text-[12px] font-semibold uppercase tracking-[1.2px] text-slate-500">
      {children}
    </h3>
  );
}

function SettingsCard({ rows }: { rows: Row[] }) {
  return (
    <Card className="overflow-hidden">
      {rows.map(({ href, label, Icon, tint }, i) => (
        <Link
          key={label}
          href={href}
          className="group flex items-center gap-4 px-5 transition-colors hover:bg-white/3"
        >
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${TINTS[tint]}`}
          >
            <Icon size={19} />
          </span>

          {/* The rule is inset past the icon, as in the app, so it starts where
              the label starts. Row height comes from this span's padding so the
              rule lands on the row boundary rather than mid-row. */}
          <span
            className={[
              "flex flex-1 items-center justify-between gap-3 py-5",
              i < rows.length - 1 ? "border-b border-white/6" : "",
            ].join(" ")}
          >
            <span className="text-[16px] font-medium text-slate-100">{label}</span>
            <span className="shrink-0 text-slate-500 transition-colors group-hover:text-slate-300">
              <ChevronRightIcon size={16} />
            </span>
          </span>
        </Link>
      ))}
    </Card>
  );
}

