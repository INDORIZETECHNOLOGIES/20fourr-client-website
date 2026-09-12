import type { ReactNode } from "react";
import { InfoIcon } from "@/components/icons";

export function Notice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "danger" | "gold";
}) {
  const danger = tone === "danger";
  return (
    <div
      className={[
        "flex w-full items-start gap-3 rounded-lg border px-4 py-4",
        danger ? "border-fault text-fault" : "border-hairline text-fg",
      ].join(" ")}
    >
      <span className={danger ? "mt-0.5 shrink-0 text-fault" : "mt-0.5 shrink-0 text-fg-mid"}>
        <InfoIcon size={20} />
      </span>
      <p className="text-body leading-relaxed">{children}</p>
    </div>
  );
}
