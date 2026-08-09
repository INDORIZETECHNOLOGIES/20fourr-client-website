import { ShieldCheckIcon } from "@/components/icons";

/** "256-bit encrypted · Your data is always safe" — shared by Login and Signup. */
export function TrustLine({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-success">
        <ShieldCheckIcon size={16} />
      </span>
      <span className="text-sm text-text-dim">
        256-bit encrypted &middot; Your data is always safe
      </span>
    </div>
  );
}
