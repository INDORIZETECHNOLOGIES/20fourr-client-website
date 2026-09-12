import Image from "next/image";
import logoWhite from "@/assets/logo-white.png";
import logoDark from "@/assets/logo-dark.png";
import { SmsIcon } from "@/components/icons";

export function Logo({
  variant = "white",
  width = 120,
  className = "",
  priority = false,
}: {
  variant?: "white" | "dark";
  width?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={variant === "white" ? logoWhite : logoDark}
      alt="20fourr"
      width={width}
      priority={priority}
      className={`h-auto w-auto ${className}`}
      style={{ width }}
    />
  );
}

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full border border-hairline ${className}`}
    >
      <Logo width={96} priority className="relative" />
    </div>
  );
}

export function PhoneMark() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-hairline">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-edge text-fg">
        <SmsIcon size={28} />
      </span>
    </div>
  );
}
