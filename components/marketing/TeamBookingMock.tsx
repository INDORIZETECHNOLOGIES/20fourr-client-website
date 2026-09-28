/**
 * A team booking as the client sees it before paying (backend specs 0011, 0012, 0013, 0017).
 * Illustrative: the people are examples and shown only as the client would see them before
 * payment — first initial, experience and languages. Names and phones arrive after payment.
 */
const TEAM = [
  { initial: "R", years: 6, languages: "Marathi, Hindi" },
  { initial: "I", years: 8, languages: "Hindi, Urdu" },
  { initial: "V", years: 11, languages: "Hindi, English" },
];

export function TeamBookingMock() {
  return (
    <figure className="rounded-lg border border-rule bg-paper transition-colors duration-150 hover:border-edge">
      <div className="flex items-center justify-between border-b border-rule px-4 py-3">
        <p className="text-label text-ink-mid">Booking</p>
        <p className="text-mono text-ink-faint">6 × bouncer · 3 nights</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 border-b border-rule px-4 py-5">
        <div>
          <dt className="text-label text-ink-faint">Headcount</dt>
          <dd className="mt-0.5 text-body-sm text-ink">6 each night</dd>
        </div>
        <div>
          <dt className="text-label text-ink-faint">Priced from</dt>
          <dd className="mt-0.5 text-body-sm text-ink">Mumbai rate card</dd>
        </div>
        <div>
          <dt className="text-label text-ink-faint">Rate basis</dt>
          <dd className="mt-0.5 text-body-sm text-ink">Daily rate, under a month</dd>
        </div>
        <div>
          <dt className="text-label text-ink-faint">Payment</dt>
          <dd className="mt-0.5 text-body-sm text-ink">One, for the whole team</dd>
        </div>
      </dl>

      <div className="px-4 py-5">
        <div className="flex items-center justify-between">
          <p className="text-h3 text-ink">Your team</p>
          <span className="rounded-sm border border-live px-2 py-0.5 text-label font-medium text-live">Assigned</span>
        </div>
        <ul className="mt-3 divide-y divide-rule border-y border-rule">
          {TEAM.map((p) => (
            <li key={p.initial} className="flex items-center gap-3 py-3">
              <span
                aria-hidden
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rule bg-paper-raised text-body-sm font-medium text-ink"
              >
                {p.initial}.
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-body-sm font-medium text-ink">{p.initial}. · Bouncer</span>
                <span className="block text-label text-ink-mid">
                  {p.years} years · {p.languages}
                </span>
              </span>
              <span className="text-label text-ink-faint">PSARA trained</span>
            </li>
          ))}
          <li className="py-3 text-label text-ink-mid">and 3 more</li>
        </ul>
        <p className="mt-3 text-body-sm text-ink-mid">Full names and phone numbers appear once you pay.</p>
      </div>

      <figcaption className="border-t border-rule bg-paper-raised px-4 py-3 text-label text-ink-faint">
        Illustration. You see the real team once the agency assigns it, and rate each person after the job.
      </figcaption>
    </figure>
  );
}
