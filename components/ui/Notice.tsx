import type { ReactNode } from "react";
import { InfoIcon } from "@/components/icons";

/**
 * The gold left-bar info panel used on both verify screens
 * (#221a0d ground, 4px #e8a020 left border, #c9a765 text).
 */
export function Notice({
  children,
  tone = "gold",
}: {
  children: ReactNode;
  tone?: "gold" | "danger";
}) {
  return (
    <div
      className={[
        "flex w-full items-start gap-3.5 rounded-notice border-l-4 px-[22px] py-[18px]",
        tone === "danger"
          ? "border-l-danger bg-danger/10 text-danger"
          : "border-l-gold bg-notice-bg text-notice-fg",
      ].join(" ")}
    >
      <span
        className={
          tone === "danger" ? "mt-0.5 shrink-0 text-danger" : "mt-0.5 shrink-0 text-gold"
        }
      >
        <InfoIcon size={20} />
      </span>
      <p className="text-[15px] leading-relaxed sm:text-base">{children}</p>
    </div>
  );
}
