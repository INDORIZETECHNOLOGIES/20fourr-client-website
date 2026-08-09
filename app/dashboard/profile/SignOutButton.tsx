"use client";

import { useState } from "react";
import { SignOutIcon } from "@/components/dashboard/icons";
import { useSession } from "@/components/session/SessionProvider";
import { clearPendingSignup } from "@/lib/session";

export function SignOutButton() {
  const { signOut } = useSession();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    // Drops the session cookies here and the stored refresh token on the API,
    // so the session can't be resumed from another tab that still has one.
    clearPendingSignup();
    await signOut();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={busy}
      className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-app-gold px-6 py-4 text-[16px] font-bold text-app-gold transition-colors hover:bg-app-gold/10 disabled:opacity-60"
    >
      <SignOutIcon size={19} />
      {busy ? "Signing out…" : "Sign Out"}
    </button>
  );
}
