"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "../../BookingContext";
import { StepFooter, StepHeading } from "../../BookingShell";
import { api } from "@/lib/api/client";
import { errorMessage, isApiError } from "@/lib/api/errors";
import { serviceLabel } from "@/lib/api/adapters";
import type { ApiContract, ContractQuote } from "@/lib/api/types";
import { contractRequest, formatDay, formatRange, mandateMethodList } from "@/lib/contracts";
import { formatPaise, formatPaiseRounded } from "@/lib/money";

/**
 * Spec 0003 B — the whole contract, month by month, before it is sent. POST /contracts/quote
 * prices every month from the same rate snapshot the contract will keep; POST /contracts sends the
 * request. Nothing is charged until the provider accepts.
 */
export default function ContractReviewStep() {
  const { draft, hydrated } = useBooking();
  const router = useRouter();
  const [quote, setQuote] = useState<ContractQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const request = contractRequest(draft);
  const requestKey = JSON.stringify(request);

  // Reached only through the confirm step, which records the waiver.
  useEffect(() => {
    if (hydrated && !draft.waiverAccepted) router.replace("/book/confirm");
  }, [hydrated, draft.waiverAccepted, router]);

  useEffect(() => {
    if (!hydrated || !request) return;
    let cancelled = false;
    setQuote(null);
    setQuoteError(null);
    api<ContractQuote>("contracts/quote", { method: "POST", body: request })
      .then((q) => {
        if (!cancelled) setQuote(q);
      })
      .catch((cause) => {
        if (!cancelled) setQuoteError(errorMessage(cause));
      });
    return () => {
      cancelled = true;
    };
    // requestKey stands for `request`, which is a fresh object every render.
  }, [hydrated, requestKey]);

  async function send() {
    if (!request) return;
    setSending(true);
    setSendError(null);
    try {
      const contract = await api<ApiContract>("contracts", {
        method: "POST",
        body: {
          ...request,
          // All four, from the gates the client actually passed (SC_209 otherwise).
          clientRiskAcknowledged: draft.riskAccepted,
          safetyDisclaimerAccepted: draft.safetyAccepted,
          providerAbsencePolicyAcknowledged: draft.absencePolicyAccepted,
          bookingConfirmationWaiverAccepted: draft.waiverAccepted,
        },
      });
      // The success screen clears the draft; clearing it here would trip the step guard.
      router.push(`/book/success?contract=${contract._id}`);
    } catch (cause) {
      setSendError(isApiError(cause) ? errorMessage(cause) : "The request didn't go through. Try again.");
      setSending(false);
    }
  }

  const first = quote?.cycles[0];

  return (
    <>
      <StepHeading title="Review the contract" subtitle="Every month and what it costs, before anything is sent." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <section aria-labelledby="months-title">
          <h2 id="months-title" className="mb-3 text-label font-semibold uppercase tracking-[1.2px] text-fg-faint">
            Month by month
          </h2>
          {quoteError ? (
            <div className="rounded-lg border border-fault px-4 py-3.5">
              <p role="alert" className="text-body leading-relaxed text-fault">
                {quoteError}
              </p>
              <button
                type="button"
                onClick={() => router.push("/book/schedule")}
                className="mt-3 rounded-sm border border-edge px-5 py-2 text-body-sm font-medium text-fg hover:bg-panel-raised"
              >
                Change dates or people
              </button>
            </div>
          ) : !quote ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-sm bg-panel-raised" />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-hairline">
              <table className="w-full text-left text-body-sm">
                <thead className="bg-panel-raised text-label uppercase tracking-[1px] text-fg-faint">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Month</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Dates</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">Days</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">You pay</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.cycles.map((c) => (
                    <tr key={c.index} className="border-t border-hairline text-fg">
                      <td className="px-4 py-3 tabular-nums">{c.index + 1}</td>
                      <td className="px-4 py-3">
                        {formatRange(c.startDate, c.endDate)}
                        {c.index === 0 ? <span className="block text-label text-attention">Paid once accepted</span> : null}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-fg-mid">{c.days}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{formatPaise(c.clientTotalPaise)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-edge bg-panel">
                    <td colSpan={3} className="px-4 py-3 font-medium text-fg">
                      Whole term, {quote.cycles.length} months
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-mono tabular-nums text-fg">
                      {formatPaise(quote.termClientTotalPaise)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          {quote ? (
            <p className="mt-3 text-label leading-relaxed text-fg-faint">
              Each amount includes the 20fourr platform fee and GST.{" "}
              {quote.basis === "package"
                ? "Whole months are priced from the provider's monthly package; a part month is charged for its days."
                : "Priced at the provider's daily rate."}{" "}
              The rates are fixed for the whole term.
            </p>
          ) : null}
        </section>

        <aside className="flex h-fit flex-col gap-4 lg:sticky lg:top-[130px]">
          <div className="rounded-lg border border-hairline bg-panel p-5">
            <h2 className="mb-3 text-body font-semibold text-fg">The contract</h2>
            <dl className="flex flex-col gap-2.5 text-body-sm">
              <Detail label="Service" value={draft.serviceName ?? serviceLabel(draft.serviceCategory)} />
              <Detail label="People" value={String(draft.headcount)} />
              <Detail label="Dates" value={draft.endDate ? formatRange(draft.date, draft.endDate) : "—"} />
              <Detail label="Daily shift" value={request ? `${request.startTime}–${request.endTime}` : "—"} />
              <Detail label="Location" value={[draft.deployment.city || draft.city, draft.deployment.pincode].filter(Boolean).join(" ") || "—"} />
            </dl>
          </div>

          <div className="rounded-lg border border-hairline bg-panel p-5">
            <h2 className="mb-3 text-body font-semibold text-fg">How it&apos;s billed</h2>
            <ul className="flex flex-col gap-3 text-body-sm leading-relaxed text-fg-mid">
              <li>
                <strong className="font-medium text-fg">First month</strong>
                {first ? `, ${formatPaiseRounded(first.clientTotalPaise)},` : ""} is paid once the provider accepts,
                before {formatDay(draft.date)}. Nothing is charged until then.
              </li>
              <li>
                <strong className="font-medium text-fg">Later months</strong> are due before each starts. Pay them from
                the contract, or set up autopay{quote ? ` by ${mandateMethodList(quote.mandateMethods)}` : ""} once it
                starts.
              </li>
              <li>
                <strong className="font-medium text-fg">If a month starts unpaid</strong>, service pauses
                {quote && quote.graceDays > 0 ? ` after ${quote.graceDays} ${quote.graceDays === 1 ? "day" : "days"}` : " that day"}{" "}
                until it&apos;s paid. Missed days aren&apos;t billed.
              </li>
              <li>
                <strong className="font-medium text-fg">To end it</strong>, give {quote ? `${quote.noticeDays} days'` : ""}{" "}
                notice. It then runs to the end of the month the notice ends in.
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {sendError ? (
        <p role="alert" className="mt-6 rounded-lg border border-fault px-4 py-3.5 text-body leading-relaxed text-fault">
          {sendError}
        </p>
      ) : null}

      <StepFooter
        continueLabel={sending ? "Sending request…" : "Send contract request"}
        disabled={!quote || sending}
        hint={quote ? "The provider has to accept before anything is charged." : undefined}
        onContinue={send}
      />
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-fg-faint">{label}</dt>
      <dd className="text-right text-fg">{value}</dd>
    </div>
  );
}
