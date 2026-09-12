"use client";

import { Card } from "@/components/dashboard/primitives";
import { CheckCircleFill } from "@/components/dashboard/icons";
import { ShareCode } from "./ShareCode";
import { useApiQuery } from "@/hooks/useApiQuery";
import { relativeTime } from "@/lib/api/adapters";
import { formatRupees } from "@/lib/money";

/**
 * Referral, from `/referral/my-code` and `/referral/stats`.
 *
 * Amounts here are **whole rupees, not paise** — referral rewards are credited
 * as SecurePoints, and a point is a rupee (see lib/money.ts). The API's own
 * copy gives it away: "₹{n} more SecurePoints will be credited". Running these
 * through formatPaise would divide every figure by 100.
 */

type CodeResponse = { referralCode: string; shareLink: string };

type StatsResponse = {
  totalReferred: number;
  successfulBookings: number;
  /** Whole rupees. */
  totalEarned: number;
  milestones: { count: number; reward: number; achieved: boolean }[];
  referrals: {
    id: string;
    refereeName: string;
    refereeEmail: string;
    status: string;
    createdAt: string;
  }[];
};

const STEPS = [
  { title: "Share your code", body: "Send it to a friend by link, WhatsApp or message." },
  { title: "Friend books", body: "They get a discount on their first booking." },
  { title: "Both get rewards", body: "You receive SecurePoints once their first duty completes." },
];

/** The Referral model's status values, in plain words. */
const STATUS_LABELS: Record<string, string> = {
  pending: "Signed up",
  signed_up: "Signed up",
  first_booking_complete: "Booked",
  rewarded: "Rewarded",
  expired: "Expired",
};

export function ReferralClient() {
  const { data: code, loading: codeLoading } = useApiQuery<CodeResponse>(
    "referral/my-code",
  );
  const { data: stats, loading: statsLoading, error } = useApiQuery<StatsResponse>(
    "referral/stats",
  );

  return (
    <>
      {codeLoading ? (
        <div className="h-[120px] animate-pulse rounded-lg bg-panel" />
      ) : code?.referralCode ? (
        <ShareCode code={code.referralCode} shareLink={code.shareLink} />
      ) : (
        <Card className="px-6 py-8 text-center">
          <p className="text-body text-fg-faint">
            No referral code has been issued for your account yet.
          </p>
        </Card>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <Stat label="Referrals" value={statsLoading ? null : String(stats?.totalReferred ?? 0)} />
        <Stat
          label="Earned"
          value={statsLoading ? null : formatRupees(stats?.totalEarned ?? 0)}
        />
        <Stat
          label="Completed bookings"
          value={statsLoading ? null : String(stats?.successfulBookings ?? 0)}
        />
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-body-sm text-fault">
          {error}
        </p>
      ) : null}

      <h3 className="mb-3 mt-8 text-label font-semibold uppercase tracking-[1.2px] text-fg-faint">
        How It Works
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <Card key={s.title} className="p-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-panel-raised text-body-sm font-semibold text-fg">
              {i + 1}
            </span>
            <p className="mt-3 text-body font-semibold text-fg">{s.title}</p>
            <p className="mt-1 text-body-sm leading-relaxed text-fg-faint">{s.body}</p>
          </Card>
        ))}
      </div>

      {(stats?.milestones ?? []).length > 0 ? (
        <>
          <h3 className="mb-3 mt-8 text-label font-semibold uppercase tracking-[1.2px] text-fg-faint">
            Milestone Rewards
          </h3>
          <Card className="overflow-hidden">
            {(stats?.milestones ?? []).map((m, i, arr) => (
              <div
                key={m.count}
                className={[
                  "flex items-center gap-4 px-5 py-4",
                  i < arr.length - 1 ? "border-b border-hairline" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    m.achieved
                      ? "border border-live text-live"
                      : "bg-panel-raised text-fg-faint",
                  ].join(" ")}
                >
                  {m.achieved ? (
                    <CheckCircleFill size={17} />
                  ) : (
                    <span className="text-body-sm font-semibold">{m.count}</span>
                  )}
                </span>
                <p className="flex-1 text-body text-fg">
                  {m.count} successful referrals
                </p>
                <p className="text-mono text-fg">
                  {formatRupees(m.reward)}
                </p>
              </div>
            ))}
          </Card>
        </>
      ) : null}

      <h3 className="mb-3 mt-8 text-label font-semibold uppercase tracking-[1.2px] text-fg-faint">
        Your Referrals
      </h3>
      {statsLoading ? (
        <div className="h-[120px] animate-pulse rounded-lg bg-panel" />
      ) : (stats?.referrals ?? []).length === 0 ? (
        <Card className="px-6 py-10 text-center">
          <p className="text-body text-fg-faint">
            Nobody has signed up with your code yet.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {(stats?.referrals ?? []).map((r, i, arr) => (
            <div
              key={r.id}
              className={[
                "flex items-center gap-4 px-5 py-4",
                i < arr.length - 1 ? "border-b border-hairline" : "",
              ].join(" ")}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-semibold text-fg">
                  {r.refereeName}
                </p>
                <p className="mt-0.5 text-body-sm text-fg-faint">
                  {relativeTime(r.createdAt)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-panel-raised px-3 py-1 text-label font-semibold text-fg-mid">
                {STATUS_LABELS[r.status] ?? r.status.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <Card className="px-5 py-4">
      <p className="text-label font-medium text-fg-faint">{label}</p>
      <p className="mt-2 text-mono-lg leading-none text-fg">
        {value === null ? (
          <span className="inline-block h-[26px] w-16 animate-pulse rounded bg-panel-raised" />
        ) : (
          value
        )}
      </p>
    </Card>
  );
}
