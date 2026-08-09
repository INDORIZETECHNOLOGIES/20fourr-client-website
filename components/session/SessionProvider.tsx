"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchSession, signOut as signOutRequest, type AuthUser } from "@/lib/auth";
import { SESSION_EXPIRED_EVENT, api } from "@/lib/api/client";
import { adaptProfile, type ProfileView } from "@/lib/api/adapters";
import type { ApiClientProfile } from "@/lib/api/types";

type SessionState = {
  user: AuthUser | null;
  /**
   * User and ClientProfile merged into what the screens render. Null until both
   * have loaded. Fetched once here rather than per component — the sidebar,
   * topbar and profile hero all want the same two documents.
   */
  profile: ProfileView | null;
  /** True until the first /auth/me answers — render skeletons, not "signed out". */
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function useSession(): SessionState {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside <SessionProvider>");
  return context;
}

/** The two screens that finish an unverified signup — never redirect away from them. */
const VERIFY_ROUTES = ["/verify-phone", "/verify-email"];

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [clientProfile, setClientProfile] = useState<ApiClientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await fetchSession();
    setUser(next);
    setLoading(false);

    if (!next) {
      setClientProfile(null);
      return;
    }
    try {
      const { profile } = await api<{ profile: ApiClientProfile }>("client/profile");
      setClientProfile(profile);
    } catch {
      // A missing or unreachable ClientProfile shouldn't blank the shell — the
      // adapter fills sensible defaults from the User document alone.
      setClientProfile(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await signOutRequest();
    setUser(null);
    router.replace("/login");
  }, [router]);

  // A 401 from any proxied call means the refresh token is gone too — the proxy
  // route has already cleared the cookies, so all that's left is to leave.
  useEffect(() => {
    function handleExpiry() {
      setUser(null);
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpiry);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpiry);
  }, [router]);

  /**
   * Verification gate.
   *
   * The API refuses every feature route until both identifiers are verified
   * (its `requireVerified` middleware), so a half-verified user reaching the
   * dashboard would see nothing but errors. The route guard in proxy.ts can't
   * catch this — the JWT carries only the user id and role — so it lands here,
   * once we actually have the user.
   */
  const redirectedTo = useRef<string | null>(null);
  useEffect(() => {
    if (loading || !user) return;
    if (VERIFY_ROUTES.some((route) => pathname.startsWith(route))) return;

    const destination = !user.phoneVerified
      ? "/verify-phone"
      : !user.emailVerified
        ? "/verify-email"
        : null;

    if (destination && redirectedTo.current !== destination) {
      redirectedTo.current = destination;
      router.replace(destination);
    }
  }, [loading, user, pathname, router]);

  const profile = useMemo(
    () => (user ? adaptProfile(user, clientProfile) : null),
    [user, clientProfile],
  );

  const value = useMemo(
    () => ({ user, profile, loading, refresh, signOut }),
    [user, profile, loading, refresh, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
