import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";

/**
 * Two variants appear in the designs: a gold circle on Signup/VerifyPhone,
 * and a bare arrow on VerifyEmail.
 */
export function BackButton({
  href,
  label,
  variant = "circle",
  className = "",
}: {
  href: string;
  label: string;
  variant?: "circle" | "bare";
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={[
        "flex items-center justify-center transition-opacity hover:opacity-80",
        variant === "circle"
          ? "h-12 w-12 rounded-full bg-panel-raised text-fg"
          : "h-11 w-11 text-fg",
        className,
      ].join(" ")}
    >
      <ArrowLeftIcon size={variant === "circle" ? 22 : 24} />
    </Link>
  );
}
