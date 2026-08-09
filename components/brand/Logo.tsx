import Image from "next/image";
import logoWhite from "@/assets/logo-white.png";
import logoDark from "@/assets/logo-dark.png";
import { SmsIcon } from "@/components/icons";

/**
 * The 20fourr wordmark.
 *
 * Two files ship in `assets/`: `logo-white.png` (white artwork, for dark grounds)
 * and `logo-dark.png` (near-black artwork, for light grounds). Everything in this
 * app sits on #0a1220, so `white` is the default; `dark` is here for light
 * surfaces later — a printed invoice, a light-theme email, a PDF header.
 *
 * Imported as modules rather than served from /public so Next can hash, size and
 * optimize them, and so a missing file is a build error instead of a 404.
 */
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

/**
 * The Login hero mark: two concentric gold rings and a radial glow, with the
 * wordmark centred inside.
 *
 * The rings are 200/158px. At 120px wide the logo's diagonal is ~144px, so it
 * clears the inner ring with room to spare.
 */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative flex h-[200px] w-[200px] shrink-0 items-center justify-center ${className}`}
    >
      <span className="animate-ring-pulse absolute h-[200px] w-[200px] rounded-full border border-gold/30" />
      <span className="absolute h-[158px] w-[158px] rounded-full border border-gold/50" />
      {/* A halo with a clear centre rather than the design's solid radial fill.
          There the glow sat behind an opaque gold tile; here the wordmark is
          transparent, so a filled glow would wash straight through the letterforms. */}
      <span
        className="absolute h-[190px] w-[190px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, transparent 56%, rgba(232,160,32,0.26) 72%, transparent 92%)",
        }}
      />
      <Logo width={112} priority className="relative" />
    </div>
  );
}

/** The VerifyPhone hero mark: rings around an SMS bubble on the soft gold ground. */
export function PhoneMark() {
  return (
    <div className="relative flex h-[170px] w-[170px] items-center justify-center">
      <span className="animate-ring-pulse absolute h-[170px] w-[170px] rounded-full border border-gold/20" />
      <span className="absolute h-[132px] w-[132px] rounded-full border border-gold/40" />
      <span className="flex h-[92px] w-[92px] items-center justify-center rounded-full border border-gold/50 bg-gold-soft text-gold">
        <SmsIcon size={38} />
      </span>
    </div>
  );
}
