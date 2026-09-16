const USE_CASES = [
  "Corporate offices",
  "Event venues",
  "Residential societies",
  "Construction sites",
];

export function SocialProofBand() {
  return (
    <section aria-label="Who books 20fourr" className="border-b border-rule bg-paper">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <p className="text-eyebrow text-ink-faint">Built for teams that need an audit trail</p>
        <ul className="flex flex-wrap gap-2">
          {USE_CASES.map((useCase) => (
            <li
              key={useCase}
              className="rounded-pill border border-rule px-3 py-1.5 text-body-sm text-ink-mid"
            >
              {useCase}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
