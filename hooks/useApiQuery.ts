"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";

type QueryOptions = {
  /** Query string parameters. Changing these re-runs the request. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Pass null/false to hold off — e.g. until an id is known. */
  enabled?: boolean;
};

export type QueryResult<T> = {
  data: T | null;
  loading: boolean;
  /** Human-readable message, already unwrapped from ApiError. */
  error: string | null;
  refetch: () => void;
};

/**
 * Minimal GET hook for the proxied API.
 *
 * No cache and no dedupe — deliberately. Everything this dashboard reads is
 * per-user and changes underneath us (booking status, wallet balance, ticket
 * threads), so a stale-while-revalidate layer would mostly be a way to show
 * someone yesterday's booking state. Screens that need sharing across
 * components lift the call into a provider instead.
 */
export function useApiQuery<T>(path: string | null, options: QueryOptions = {}): QueryResult<T> {
  const { query, enabled = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path) && enabled);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  // Serialised so a fresh object literal each render doesn't loop the effect.
  const queryKey = JSON.stringify(query ?? {});

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!path || !enabled) {
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    api<T>(path, { query: JSON.parse(queryKey), signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(errorMessage(cause));
        setLoading(false);
      });

    return () => controller.abort();
  }, [path, queryKey, enabled, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, refetch };
}
