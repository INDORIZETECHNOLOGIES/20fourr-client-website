import { MarketingCta } from "@/components/marketing/MarketingCta";

/** Full-width dark CTA band above the footer, landing page only. */
export function LandingFooterCta() {
  return (
    <section className="bg-ground">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-6 px-4 py-16 lg:flex-row lg:items-end lg:justify-between lg:px-6 lg:py-24">
        <div className="max-w-[36rem]">
          <h2 className="text-h1 text-ground-ink">Your next shift is one booking away.</h2>
          <p className="mt-4 text-body text-ground-mid">
            Verified guard, OTP duty, GST document. No follow-up calls.
          </p>
        </div>
        <MarketingCta href="/#find" variant="inverse">
          Find security now
        </MarketingCta>
      </div>
    </section>
  );
}
