import { ShieldIcon } from "@/components/icons";

/** The "PSARA Licensed Platform" pill on Login and Signup. */
export function PsaraBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-[18px] py-2 ${className}`}
    >
      <span className="text-gold">
        <ShieldIcon size={14} />
      </span>
      <span className="text-[13px] text-text-secondary">20fourr Licensed Platform</span>
    </div>
  );
}
