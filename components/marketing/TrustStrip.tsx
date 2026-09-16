import { ShieldCheckIcon } from "@/components/icons";

const ITEMS = [
  "Verified professionals",
  "Transparent pricing",
  "OTP attendance",
  "GST invoice",
  "Documented shifts",
];

export function TrustStrip() {
  return (
    <section aria-label="What every booking includes" className="border-y border-rule bg-paper-raised">
      <ul className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4 lg:px-6">
        {ITEMS.map((item) => (
          <li key={item} className="flex items-center gap-2 text-body-sm text-ink">
            <span className="text-live">
              <ShieldCheckIcon size={16} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
