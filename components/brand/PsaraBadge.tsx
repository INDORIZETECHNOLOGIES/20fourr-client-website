import { ShieldIcon } from "@/components/icons";

/** The "PSARA Licensed Platform" pill on Login and Signup. */
export function PsaraBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-pill border border-edge bg-panel px-[18px] py-2 ${className}`}
    >
      <span className="text-fg">
        <ShieldIcon size={14} />
      </span>
      <span className="text-body-sm text-fg-mid">20fourr Licensed Platform</span>
    </div>
  );
}
