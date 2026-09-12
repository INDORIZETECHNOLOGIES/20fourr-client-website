import { ShieldCheckIcon } from "@/components/icons";

/**
 * Shared by Login and Signup.
 *
 * Was "256-bit encrypted · Your data is always safe": TLS is not a feature, and
 * "always safe" is an absolute no one can stand behind. Replaced with the DPDP
 * rights this platform actually implements — export, consent withdrawal and
 * erasure are live endpoints under /client/account/*, and the same claim is
 * made on the marketing site's compliance section.
 */
export function TrustLine({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-live">
        <ShieldCheckIcon size={16} />
      </span>
      <span className="text-body-sm text-fg-faint">
        DPDP data rights &middot; export, withdraw consent or erase at any time
      </span>
    </div>
  );
}
