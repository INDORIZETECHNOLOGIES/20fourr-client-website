import { QuoteBreakdown } from "@/components/marketing/QuoteBreakdown";
import { DEFAULT_QUOTE } from "@/lib/sample-quote";
import { formatPaiseRounded } from "@/lib/money";
import type { MaskedProvider } from "@/lib/provider-display";

export function ProductShowcase({ provider }: { provider: MaskedProvider | null }) {
  const rate = provider?.hourlyRatePaise
    ? `From ${formatPaiseRounded(provider.hourlyRatePaise)}/hr`
    : provider?.dailyRatePaise
      ? `From ${formatPaiseRounded(provider.dailyRatePaise)}/day`
      : null;

  const frames = [
    {
      id: "find",
      title: "Find",
      caption: "Pick a category and the city of the shift.",
      body: (
        <ul className="flex flex-col gap-2">
          {["Security guard", "Bouncer", "Gunman", "PSO"].map((name, i) => (
            <li
              key={name}
              className={[
                "flex items-center justify-between rounded-sm border px-3 py-2 text-body-sm",
                i === 0 ? "border-ink bg-ink text-paper" : "border-rule text-ink",
              ].join(" ")}
            >
              {name}
              {i === 0 ? <span className="text-label">Selected</span> : null}
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "compare",
      title: "Compare",
      caption: "Trading names and personal names stay off the public list.",
      body: (
        <div className="rounded-sm border border-rule px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-body font-medium text-ink">
              {provider?.title ?? "Licensed professional"}
            </p>
            {provider?.isVerified !== false ? (
              <span className="rounded-sm border border-live px-2 py-0.5 text-label text-live">
                Verified
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-mono text-ink-faint">{provider?.code ?? "P-····"}</p>
          <p className="mt-2 text-body-sm text-ink-mid">
            {[provider?.categoryLabel, provider?.city].filter(Boolean).join(" · ") ||
              "Category and city from the listing"}
          </p>
          {rate ? <p className="mt-2 text-mono text-ink">{rate}</p> : null}
        </div>
      ),
    },
    {
      id: "quote",
      title: "Quote",
      caption: "Service, platform fee and GST lines before you commit.",
      body: <QuoteBreakdown quote={DEFAULT_QUOTE} className="rounded-sm bg-paper p-4" />,
    },
    {
      id: "book",
      title: "Book",
      caption: "Four acknowledgements are stored on the booking.",
      body: (
        <ol className="flex flex-col gap-2 text-body-sm text-ink">
          {["Purpose of the shift", "Risk acknowledgement", "Absence terms", "Safety briefing"].map(
            (item, i) => (
              <li
                key={item}
                className="flex items-center gap-3 border-b border-rule py-2 last:border-0"
              >
                <span className="text-mono text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                {item}
              </li>
            ),
          )}
        </ol>
      ),
    },
    {
      id: "track",
      title: "Track",
      caption: "Duty starts and ends with an OTP shown in person.",
      body: (
        <dl className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-3">
            <dt className="text-body-sm text-ink">Start OTP</dt>
            <dd className="text-mono text-ink-mid">Pending on site</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-3">
            <dt className="text-body-sm text-ink">End OTP</dt>
            <dd className="text-mono text-ink-mid">After duty starts</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-body-sm text-ink">Timestamp</dt>
            <dd className="text-mono text-ink-mid">Recorded, not self-reported</dd>
          </div>
        </dl>
      ),
    },
    {
      id: "complete",
      title: "Complete",
      caption: "A GST tax invoice and a service document for the shift.",
      body: (
        <ul className="flex flex-col gap-2 text-body-sm text-ink">
          <li className="flex justify-between gap-3 border-b border-rule py-2">
            <span>Platform-fee invoice</span>
            <span className="text-mono text-ink-mid">GST</span>
          </li>
          <li className="flex justify-between gap-3 border-b border-rule py-2">
            <span>Service document</span>
            <span className="text-mono text-ink-mid">Shift</span>
          </li>
          <li className="flex justify-between gap-3 py-2">
            <span>Place of supply</span>
            <span className="text-mono text-ink-mid">CGST/SGST or IGST</span>
          </li>
        </ul>
      ),
    },
  ];

  return (
    <section id="product" className="border-t border-rule">
      <div className="mx-auto max-w-[1200px] px-4 py-16 lg:px-6 lg:py-24">
        <p className="text-eyebrow text-ink-faint">The product</p>
        <h2 className="text-h1 mt-3 max-w-[22ch] text-ink">What you actually use, in order</h2>
        <p className="mt-4 max-w-prose text-body text-ink-mid">
          Discovery, quote, booking, OTP duty and documents are the same path as the signed-in
          app. These frames are the interface, not a campaign illustration.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {frames.map((frame) => (
            <article key={frame.id} className="flex flex-col rounded-lg border border-rule bg-paper">
              <header className="border-b border-rule px-4 py-3">
                <h3 className="text-h3 text-ink">{frame.title}</h3>
                <p className="mt-1 text-body-sm text-ink-mid">{frame.caption}</p>
              </header>
              <div className="flex-1 bg-paper-raised p-4">{frame.body}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
