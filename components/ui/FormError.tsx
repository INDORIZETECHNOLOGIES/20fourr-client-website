import { InfoIcon } from "@/components/icons";

/** Form-level failure banner. The designs have no equivalent — nothing can fail in them. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-notice border border-danger/40 border-l-4 border-l-danger bg-danger/10 px-[18px] py-3.5"
    >
      <span className="mt-0.5 shrink-0 text-danger">
        <InfoIcon />
      </span>
      <p className="text-[15px] font-medium text-danger">{message}</p>
    </div>
  );
}
