"use client";

import Link from "next/link";
import { Card } from "@/components/dashboard/primitives";
import { ListRow } from "@/components/dashboard/ListRow";
import { BriefcaseIcon, CalendarIcon, ClockIcon, PinIcon } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import { serviceLabel } from "@/lib/api/adapters";
import type { ApiContract, ContractListResponse } from "@/lib/api/types";
import { contractStatus, formatDay, formatRange, isLiveContract } from "@/lib/contracts";
import { formatPaiseRounded } from "@/lib/money";

/**
 * Backend spec 0014, GET /contracts. Live contracts first; each row's right-hand figure is the
 * next thing the client pays, read from the contract's cycles, never added up here.
 */
export function ContractsList() {
  const { data, loading, error, refetch } = useApiQuery<ContractListResponse>("contracts", {
    query: { limit: 50 },
  });

  const contracts = [...(data?.contracts ?? [])].sort(
    (a, b) => Number(isLiveContract(b)) - Number(isLiveContract(a)),
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-2.5">
        {[0, 1].map((i) => (
          <div key={i} className="h-[86px] animate-pulse rounded-lg border border-hairline bg-panel" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="px-6 py-14 text-center">
        <p role="alert" className="text-body-sm text-fault">
          {error}
        </p>
        <button
          type="button"
          onClick={refetch}
          className="mt-4 rounded-sm border border-edge px-6 py-2.5 text-body-sm font-medium text-fg"
        >
          Try again
        </button>
      </Card>
    );
  }

  if (contracts.length === 0) {
    return (
      <Card className="px-6 py-14 text-center">
        <p className="text-body text-fg">No contracts yet.</p>
        <p className="mx-auto mt-1.5 max-w-[440px] text-body-sm leading-relaxed text-fg-faint">
          Book cover for longer than a month and it becomes a contract: the provider accepts once, and
          you pay one month at a time.
        </p>
        <Link
          href="/book/service"
          className="mt-5 inline-block rounded-sm bg-brand px-6 py-2.5 text-body-sm font-semibold text-brand-ink"
        >
          Book cover
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {contracts.map((c) => {
        const style = contractStatus(c.status);
        const next = nextCharge(c);
        return (
          <ListRow
            key={c._id}
            href={`/dashboard/contracts/${c._id}`}
            railClass={style.rail}
            muted={!isLiveContract(c) && c.status !== "requested"}
            icon={<BriefcaseIcon size={19} />}
            title={`${c.headcount > 1 ? `${c.headcount} × ` : ""}${serviceLabel(c.serviceCategory)}`}
            badge={
              <span className={`inline-block whitespace-nowrap rounded-sm border px-2 py-0.5 text-label font-medium ${style.className}`}>
                {style.label}
              </span>
            }
            primaryMeta={[
              { icon: <CalendarIcon size={12} />, text: formatRange(c.startDate, c.endDate) },
              { icon: <ClockIcon size={12} />, text: `${c.dailyStartTime}–${c.dailyEndTime} daily` },
            ]}
            secondaryMeta={[
              { icon: <PinIcon size={12} />, text: c.deployment?.city || c.deployment?.addressLine || "—", flexible: true },
              { text: `${c.cycles.length} ${c.cycles.length === 1 ? "month" : "months"}` },
            ]}
            amount={
              next ? (
                <span className="flex flex-col items-start sm:items-end">
                  <span className="tabular-nums">{formatPaiseRounded(next.amountPaise)}</span>
                  <span className={`text-label font-sans ${next.due ? "text-attention" : "text-fg-faint"}`}>{next.label}</span>
                </span>
              ) : null
            }
            reference={c.contractId}
          />
        );
      })}
    </div>
  );
}

/** The month the client pays next: the one due now, else the next one not yet billed. */
function nextCharge(c: ApiContract): { amountPaise: number; label: string; due: boolean } | null {
  if (c.dueCycle) {
    return { amountPaise: c.dueCycle.clientTotalPaise, label: c.status === "suspended" ? "Overdue" : "Due now", due: true };
  }
  if (!isLiveContract(c) && c.status !== "requested") return null;
  const upcoming = c.cycles.find((x) => !x.bookingStatus);
  if (!upcoming) return null;
  const first = upcoming.index === 0;
  return {
    amountPaise: upcoming.clientTotalPaise,
    label: first && c.status === "requested" ? "First month" : `Next, ${formatDay(upcoming.startDate, true)}`,
    due: false,
  };
}
