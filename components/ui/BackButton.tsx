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
          ? "h-13 w-13 rounded-full bg-gold-soft text-gold"
          : "h-11 w-11 text-text-input",
        className,
      ].join(" ")}
    >
      <ArrowLeftIcon size={variant === "circle" ? 22 : 24} />
    </Link>
  );
}
