"use client";

import Link from "next/link";
import { SubPage } from "@/components/dashboard/SubPage";
import { Card } from "@/components/dashboard/primitives";
import { useApiQuery } from "@/hooks/useApiQuery";
import { serviceLabel } from "@/lib/api/adapters";
import type { ApiContract, ContractCycle } from "@/lib/api/types";
import { contractStatus, cycleState, formatDay, formatRange, isLiveContract } from "@/lib/contracts";
import { formatPaiseRounded } from "@/lib/money";
import { PayNowButton } from "@/app/dashboard/bookings/[id]/PayNowButton";
import { AutopayPanel } from "./AutopayPanel";
import { NoticePanel } from "./NoticePanel";
import { ResumePayment } from "./ResumePayment";

/**
 * Backend spec 0014, one contract. Every month is its own booking once it's created, so payment,
 * documents, the provider's invoice, disputes and chat all live on that booking's page; this page
 * is the term, what's due, autopay and notice.
 */
export function ContractDetail({ id }: { id: string }) {
  const { data: contract, loading, error, refetch } = useApiQuery<ApiContract>(`contracts/${id}`);

  if (loading) {
    return (
      <SubPage title="Contract" backHref="/dashboard/contracts" backLabel="Contracts" width={1040}>
        <div className="h-40 animate-pulse rounded-lg border border-hairline bg-panel" />
      </SubPage>
    );
  }

  if (error || !contract) {
    return (
      <SubPage title="Contract" backHref="/dashboard/contracts" backLabel="Contracts" width={1040}>
        <Card className="px-6 py-14 text-center">
          <p role="alert" className="text-body-sm text-fault">
            {error ?? "That contract could not be found."}
          </p>
        </Card>
      </SubPage>
    );
  }

  const style = contractStatus(contract.status);
  const live = isLiveContract(contract);
  const title = `${contract.headcount > 1 ? `${contract.headcount} × ` : ""}${serviceLabel(contract.serviceCategory)}`;

  return (
    <SubPage
      title={title}
      subtitle={`${contract.contractId} · ${formatRange(contract.startDate, contract.endDate)}`}
      backHref="/dashboard/contracts"
      backLabel="Contracts"
      width={1040}
      action={
        <span className={`inline-block whitespace-nowrap rounded-sm border px-2.5 py-1 text-label font-medium ${style.className}`}>
          {style.label}
        </span>
      }
    >
      <StatusPanel contract={contract} onChange={refetch} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="months-title">
          <h3 id="months-title" className="mb-3 text-label font-semibold uppercase tracking-[1.2px] text-fg-faint">
            Month by month
          </h3>
          <CycleTable contract={contract} />
          <p className="mt-3 text-label leading-relaxed text-fg-faint">
            Each month becomes a booking a few days before it starts. Its invoices, the provider&apos;s
            invoice and any dispute are on that booking.
          </p>
        </section>

        <aside className="flex flex-col gap-4">
          <Card className="p-5">
            <h3 className="mb-3 text-body font-semibold text-fg">Details</h3>
            <dl className="flex flex-col gap-2.5 text-body-sm">
              <Detail label="Service" value={serviceLabel(contract.serviceCategory)} />
              <Detail label="People" value={String(contract.headcount)} />
              <Detail label="Daily shift" value={`${contract.dailyStartTime}–${contract.dailyEndTime}`} />
              <Detail label="Term" value={`${contract.cycles.length} ${contract.cycles.length === 1 ? "month" : "months"}`} />
              <Detail
                label="Location"
                value={[contract.deployment?.addressLine, contract.deployment?.city, contract.deployment?.pincode]
                  .filter(Boolean)
                  .join(", ") || "—"}
              />
            </dl>
          </Card>
          {live ? <AutopayPanel contract={contract} onChange={refetch} /> : null}
          {live ? <NoticePanel contract={contract} onChange={refetch} /> : null}
        </aside>
      </div>
    </SubPage>
  );
}

/** Where the contract stands, and the one thing to do about it. */
function StatusPanel({ contract, onChange }: { contract: ApiContract; onChange: () => void }) {
  const due = contract.dueCycle;
  const notice = contract.terminationNotice;
  const first = contract.cycles[0];

  let heading: string;
  let body: string;
  let tone: "attention" | "fault" | "neutral" | "live" = "neutral";
  switch (contract.status) {
    case "requested":
      heading = "Waiting for the provider to accept";
      body = `Nothing is charged until they do. Once accepted, you pay the first month (${formatRange(first.startDate, first.endDate)}) to start.`;
      tone = "attention";
      break;
    case "accepted":
      heading = "Accepted. Pay the first month to start";
      body = `Service starts on ${formatDay(contract.startDate)}. If the first month is still unpaid that day, the contract is cancelled.`;
      tone = "attention";
      break;
    case "active":
      heading = due ? `Month ${due.index + 1} is due` : "Active";
      body = due
        ? `Pay before ${formatDay(due.startDate)}. If it's unpaid when the month starts, service pauses until it's paid.`
        : "Every month is paid up to date.";
      tone = due ? "attention" : "live";
      break;
    case "suspended":
      heading = "Service is paused";
      body =
        "A month started unpaid, so the provider isn't on duty. Pay to resume from tomorrow; the days already missed aren't billed. If it stays unpaid, the contract ends.";
      tone = "fault";
      break;
    case "completed":
      heading = "Completed";
      body = `The last month ended on ${formatDay(contract.endDate)}.`;
      break;
    case "rejected":
      heading = "The provider declined this contract";
      body = "Nothing was charged. You can book the same cover with another provider.";
      break;
    case "cancelled":
      heading = "Cancelled";
      body = "The contract was cancelled before it started. Nothing was charged.";
      break;
    default:
      heading = "Ended";
      body = contract.endedAt ? `The contract ended on ${formatDay(contract.endedAt.slice(0, 10))}.` : "The contract has ended.";
  }

  const ring = { attention: "border-attention", fault: "border-fault", live: "border-live", neutral: "border-hairline" }[tone];

  return (
    <div className={`rounded-lg border ${ring} bg-panel p-5 sm:p-6`}>
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-[560px]">
          <h3 className="text-h3 text-fg">{heading}</h3>
          <p className="mt-1.5 text-body-sm leading-relaxed text-fg-mid">{body}</p>
          {notice ? (
            <p className="mt-3 text-body-sm leading-relaxed text-fg">
              {notice.by === "client" ? "You gave" : notice.by === "provider" ? "The provider gave" : "20fourr gave"} notice on{" "}
              {formatDay(notice.givenAt.slice(0, 10))}. The contract ends on{" "}
              <strong className="font-semibold">{formatDay(notice.effectiveOn)}</strong>; no month after that is billed.
            </p>
          ) : null}
        </div>

        {due && contract.status !== "suspended" && isLiveContract(contract) ? (
          <div className="w-full shrink-0 md:w-[260px]">
            <p className="mb-2 text-label text-fg-faint">
              Month {due.index + 1} · {formatRange(due.startDate, due.endDate)}
            </p>
            {due.bookingId ? (
              <PayNowButton bookingId={due.bookingId} amountPaise={due.clientTotalPaise} billingEngine="v6" onPaid={onChange} />
            ) : null}
          </div>
        ) : null}

        {contract.status === "suspended" ? (
          <div className="w-full shrink-0 md:w-[260px]">
            <ResumePayment contract={contract} onPaid={onChange} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CycleTable({ contract }: { contract: ApiContract }) {
  const lastBilled = contract.terminationNotice?.effectiveCycleIndex ?? null;
  return (
    <div className="overflow-hidden rounded-lg border border-hairline">
      <table className="w-full text-left text-body-sm">
        <thead className="bg-panel-raised text-label uppercase tracking-[1px] text-fg-faint">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-semibold">Month</th>
            <th scope="col" className="px-4 py-2.5 font-semibold">Dates</th>
            <th scope="col" className="px-4 py-2.5 text-right font-semibold">Amount</th>
            <th scope="col" className="px-4 py-2.5 font-semibold">Status</th>
            <th scope="col" className="px-4 py-2.5"><span className="sr-only">Booking</span></th>
          </tr>
        </thead>
        <tbody>
          {contract.cycles.map((cycle) => (
            <CycleRow
              key={cycle.index}
              cycle={cycle}
              due={contract.dueCycle?.index === cycle.index}
              dropped={lastBilled !== null && cycle.index > lastBilled}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CycleRow({ cycle, due, dropped }: { cycle: ContractCycle; due: boolean; dropped: boolean }) {
  const state = dropped && !cycle.bookingStatus ? { label: "Not billed", className: "text-fg-faint" } : cycleState(cycle.bookingStatus);
  return (
    <tr className={`border-t border-hairline ${due ? "bg-panel-raised" : ""} ${dropped ? "text-fg-faint" : "text-fg"}`}>
      <td className="px-4 py-3 tabular-nums">{cycle.index + 1}</td>
      <td className="px-4 py-3">
        {formatRange(cycle.startDate, cycle.endDate)}
        <span className="block text-label text-fg-faint">{cycle.days} days</span>
      </td>
      <td className={`px-4 py-3 text-right font-mono tabular-nums ${dropped ? "line-through" : ""}`}>
        {formatPaiseRounded(cycle.clientTotalPaise)}
      </td>
      <td className={`px-4 py-3 font-medium ${state.className}`}>{state.label}</td>
      <td className="px-4 py-3 text-right">
        {cycle.bookingId ? (
          <Link
            href={`/dashboard/bookings/${cycle.bookingId}`}
            className="whitespace-nowrap text-fg-mid underline underline-offset-2 hover:text-fg"
          >
            Booking
          </Link>
        ) : null}
      </td>
    </tr>
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
