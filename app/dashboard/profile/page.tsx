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

type Row = {
  href: string;
  label: string;
  Icon: ComponentType<{ size?: number }>;
};

const ACCOUNT_SETTINGS: Row[] = [
  { href: "/dashboard/profile/edit", label: "Edit profile", Icon: UserEditIcon },
  { href: "/dashboard/profile/addresses", label: "Saved addresses", Icon: PinFill },
  { href: "/dashboard/profile/providers", label: "Preferred and blocked", Icon: UsersIcon },
  { href: "/dashboard/profile/membership", label: "20fourr Pass", Icon: CrownFill },
  { href: "/dashboard/profile/referral", label: "Refer and earn", Icon: GiftIcon },
  { href: "/dashboard/profile/threat-assessment", label: "Threat assessment", Icon: ShieldAlertFill },
  { href: "/dashboard/profile/wallet", label: "Wallet", Icon: WalletIcon },
  { href: "/dashboard/profile/invoices", label: "Documents", Icon: InvoiceIcon },
  { href: "/dashboard/profile/penalties", label: "Account standing", Icon: AlertCircleIcon },
  { href: "/dashboard/profile/privacy", label: "Privacy and data rights", Icon: ShieldLockIcon },
  { href: "/dashboard/profile/change-password", label: "Change password", Icon: LockIcon },
];

const SUPPORT_ROWS: Row[] = [
  { href: "/dashboard/support", label: "Help centre", Icon: HelpCircleIcon },
];

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <ProfileHero />
      <SectionLabel>Account</SectionLabel>
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
    <h3 className="mb-3 mt-8 text-label font-semibold uppercase tracking-[1.2px] text-fg-faint">
      {children}
    </h3>
  );
}

function SettingsCard({ rows }: { rows: Row[] }) {
  return (
    <Card className="overflow-hidden">
      {rows.map(({ href, label, Icon }, i) => (
        <Link
          key={label}
          href={href}
          className="group flex items-center gap-4 px-5 transition-colors hover:bg-panel-raised"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-panel-raised text-fg">
            <Icon size={19} />
          </span>

          {/* The rule is inset past the icon, as in the app, so it starts where
              the label starts. Row height comes from this span's padding so the
              rule lands on the row boundary rather than mid-row. */}
          <span
            className={[
              "flex flex-1 items-center justify-between gap-3 py-5",
              i < rows.length - 1 ? "border-b border-hairline" : "",
            ].join(" ")}
          >
            <span className="text-body font-medium text-fg">{label}</span>
            <span className="shrink-0 text-fg-faint transition-colors group-hover:text-fg-mid">
              <ChevronRightIcon size={16} />
            </span>
          </span>
        </Link>
      ))}
    </Card>
  );
}

