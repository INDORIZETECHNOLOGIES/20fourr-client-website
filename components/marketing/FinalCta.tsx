import { MarketingCta } from "@/components/marketing/MarketingCta";

export function FinalCta() {
  return (
    <section className="bg-ink text-paper">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-16 lg:flex-row lg:items-end lg:justify-between lg:px-6 lg:py-24">
        <div className="max-w-[36rem]">
          <h2 className="text-h1 text-paper">Need security for your next requirement?</h2>
          <p className="mt-4 text-body text-ground-mid">
            Search verified guards, bouncers, gunmen and PSOs. The quote is itemized before you
            book. Duty starts and ends on an OTP.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <MarketingCta href="/#find" variant="inverse">
            Find security
          </MarketingCta>
          <MarketingCta
            href="/pricing"
            variant="secondary"
            className="border-ground-edge text-paper hover:bg-surface"
          >
            Get a quote
          </MarketingCta>
        </div>
      </div>
    </section>
  );
}
