"use client";

import { useState } from "react";
import { Card } from "@/components/dashboard/primitives";
import { UserIcon } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { initialOf } from "@/lib/api/adapters";

/**
 * Preferred and blocked providers.
 *
 * The two lists are independent server-side flags, not one relation with two
 * values — `PUT /client/providers/:id/preferred` and `.../blocked` each take a
 * boolean. So "move from blocked to preferred" is two calls, and the UI only
 * offers the transitions that make sense.
 *
 * Blocking has a real consequence worth surfacing: provider search excludes
 * blocked providers entirely (`excludeProviderIds` in the discovery service),
 * so a blocked provider disappears from the booking funnel.
 */

type Related = {
  _id: string;
  name?: string;
  profilePhoto?: string | null;
};

type RelationshipsResponse = { preferred: Related[]; blocked: Related[] };

export function ProvidersManager() {
  const { data, loading, error, refetch } =
    useApiQuery<RelationshipsResponse>("client/provider-relationships");

  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function setFlag(id: string, flag: "preferred" | "blocked", value: boolean) {
    setBusyId(id);
    setActionError(null);
    try {
      await api(`client/providers/${id}/${flag}`, {
        method: "PUT",
        body: { [flag]: value },
      });
      refetch();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-app-card" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="px-6 py-12 text-center">
        <p role="alert" className="text-[14px] text-red-300">
          {error}
        </p>
        <button
          type="button"
          onClick={refetch}
          className="mt-4 rounded-full border border-app-gold px-6 py-2.5 text-[13px] font-bold text-app-gold"
        >
          Try again
        </button>
      </Card>
    );
  }

  const preferred = data?.preferred ?? [];
  const blocked = data?.blocked ?? [];

  return (
    <>
      {actionError ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-[14px] text-red-300"
        >
          {actionError}
        </p>
      ) : null}

      <Group
        label={`Preferred (${preferred.length})`}
        empty="No preferred providers yet. Mark one from a completed booking to see them first in search."
      >
        {preferred.map((p) => (
          <Row
            key={p._id}
            provider={p}
            busy={busyId === p._id}
            actions={[
              {
                label: "Remove",
                onClick: () => setFlag(p._id, "preferred", false),
              },
              {
                label: "Block",
                tone: "danger",
                onClick: async () => {
                  // Blocking implies un-preferring; leaving both set would put a
                  // provider in two contradictory lists.
                  await setFlag(p._id, "preferred", false);
                  await setFlag(p._id, "blocked", true);
                },
              },
            ]}
          />
        ))}
      </Group>

      <Group
        label={`Blocked (${blocked.length})`}
        empty="No blocked providers. Blocking one hides them from search and stops them being matched to you."
      >
        {blocked.map((p) => (
          <Row
            key={p._id}
            provider={p}
            busy={busyId === p._id}
            actions={[
              {
                label: "Unblock",
                onClick: () => setFlag(p._id, "blocked", false),
              },
            ]}
          />
        ))}
      </Group>
    </>
  );
}

function Group({
  label,
  empty,
  children,
}: {
  label: string;
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <>
      <h3 className="mb-3 mt-8 text-[12px] font-semibold uppercase tracking-[1.2px] text-slate-500 first:mt-0">
        {label}
      </h3>
      {children.length === 0 ? (
        <Card className="px-6 py-10 text-center">
          <p className="mx-auto max-w-[420px] text-[14px] leading-relaxed text-slate-500">
            {empty}
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">{children}</div>
      )}
    </>
  );
}

function Row({
  provider,
  busy,
  actions,
}: {
  provider: Related;
  busy: boolean;
  actions: { label: string; tone?: "danger"; onClick: () => void }[];
}) {
  const name = provider.name || "Security provider";

  return (
    <Card
      className={[
        "flex flex-wrap items-center gap-4 px-5 py-4 transition-opacity",
        busy ? "pointer-events-none opacity-50" : "",
      ].join(" ")}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-app-gold-gradient text-[15px] font-extrabold text-black">
        {initialOf(name)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-slate-100">{name}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-slate-600">
          <UserIcon size={12} />
          Provider
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className={[
              "rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors",
              a.tone === "danger"
                ? "border-red-500/35 text-red-400 hover:bg-red-500/10"
                : "border-app-border text-slate-300 hover:bg-white/5",
            ].join(" ")}
          >
            {a.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
