import { InfoIcon } from "@/components/icons";

/** Form-level failure banner. The designs have no equivalent — nothing can fail in them. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-fault border-l-4 border-l-fault bg-transparent px-4 py-3.5"
    >
      <span className="mt-0.5 shrink-0 text-fault">
        <InfoIcon />
      </span>
      <p className="text-body font-medium text-fault">{message}</p>
    </div>
  );
}
