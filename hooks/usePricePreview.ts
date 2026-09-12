"use client";

import type { BookingDraft } from "@/app/book/BookingContext";
import { useApiQuery } from "@/hooks/useApiQuery";
import { previewQuery, tagPriceQuote } from "@/lib/api/pricing";

export function usePricePreview(draft: BookingDraft) {
  const query = previewQuery(draft);
  const result = useApiQuery<unknown>(
    draft.providerId ? `client/providers/${draft.providerId}/price-preview` : null,
    { query: query ?? undefined, enabled: Boolean(query) },
  );

  return {
    ...result,
    data: result.data != null ? tagPriceQuote(result.data) : null,
  };
}
