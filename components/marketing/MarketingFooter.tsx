import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import type { SiteContacts } from "@/lib/marketing-data";

function officerLine(
  label: string,
  officer?: { name?: string; email?: string; phone?: string },
) {
  if (!officer?.name && !officer?.email) return null;
  const bits = [officer.name, officer.email, officer.phone].filter(Boolean);
  return (
    <p>
      {label}: {bits.join(" · ")}
    </p>
  );
}

export function MarketingFooter({ contacts }: { contacts: SiteContacts | null }) {
  const go = officerLine("Grievance officer", contacts?.grievanceOfficer);
  const dpo = officerLine("Data protection officer", contacts?.dataProtectionOfficer);

  return (
    <footer className="border-t border-rule bg-paper">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <div>
          <Logo variant="dark" width={104} />
          <p className="mt-4 max-w-xs text-body-sm text-ink-mid">
            Licensed guards. Documented shifts. A marketplace a procurement team can audit.
          </p>
        </div>
        <div>
          <p className="text-eyebrow text-ink-faint">Product</p>
          <ul className="mt-3 flex flex-col gap-2 text-body text-ink-mid">
            <li>
              <a href="/#how-it-works">How it works</a>
            </li>
            <li>
              <a href="/#services">Services</a>
            </li>
            <li>
              <a href="/#compliance">Verification</a>
            </li>
            <li>
              <Link href="/pricing">Pricing</Link>
            </li>
            <li>
              <a href="/#faq">FAQ</a>
            </li>
            <li>
              <Link href="/coverage">Coverage</Link>
            </li>
            <li>
              <Link href="/for-business">For business</Link>
            </li>
            <li>
              <Link href="/#find">Find security</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-eyebrow text-ink-faint">Company</p>
          <ul className="mt-3 flex flex-col gap-2 text-body text-ink-mid">
            <li>
              <a href="/#providers">For providers</a>
            </li>
            <li>
              <Link href="/login">Sign in</Link>
            </li>
            <li>
              <Link href="/signup">Create an account</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-eyebrow text-ink-faint">Legal</p>
          <ul className="mt-3 flex flex-col gap-2 text-body text-ink-mid">
            <li>
              <Link href="/terms">Terms</Link>
            </li>
            <li>
              <Link href="/terms">Privacy</Link>
            </li>
            <li>
              <Link href="/terms">Cancellation and refunds</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-rule">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-6 text-body-sm text-ink-mid lg:px-6">
          {go}
          {dpo}
          {!go && !dpo ? (
            <p>
              Grievance officer and data protection officer contacts come from the platform&rsquo;s
              published grievance endpoint. This band stays empty when that endpoint is unreachable
              at build time rather than being filled with a placeholder &mdash; a contact nobody can
              reach is worse than a visible gap.
            </p>
          ) : null}
          <p>
            20fourr is a marketplace for PSARA-licensed private security providers and is not
            itself a private security agency.
          </p>
        </div>
      </div>
    </footer>
  );
}
