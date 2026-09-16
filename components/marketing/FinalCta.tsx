import { MarketingCta } from "@/components/marketing/MarketingCta";
import { productSurface, type ProductSurface } from "@/components/marketing/product-surface";

export function FinalCta({ surface = "paper" }: { surface?: ProductSurface }) {
  const t = productSurface[surface];

  return (
    <section className={t.band}>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-16 lg:flex-row lg:items-end lg:justify-between lg:px-6 lg:py-24">
        <div className="max-w-[36rem]">
          <h2 className={`text-h1 ${surface === "ink" ? "text-ground-ink" : "text-paper"}`}>
            Your next shift is one booking away.
          </h2>
          <p className={`mt-4 text-body ${t.bandMid}`}>
            Verified guard. OTP duty. GST document. No follow-up calls.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <MarketingCta href="/#find" variant="inverse" className="w-full sm:w-auto">
            Find security
          </MarketingCta>
          <MarketingCta href="/pricing" variant="secondary" className={t.ctaSecondary}>
            Get a quote
          </MarketingCta>
        </div>
      </div>
    </section>
  );
}
