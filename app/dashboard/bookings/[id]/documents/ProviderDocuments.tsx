"use client";

import { SubPage } from "@/components/dashboard/SubPage";
import { Card } from "@/components/dashboard/primitives";
import { CheckCircleFill, ShieldFill } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import { formatApiDate } from "@/lib/api/adapters";
import { DOCUMENT_LABELS, type ApiBookingDocument } from "@/lib/api/types";

/**
 * The provider's verified documents for a booking.
 *
 * Two gates, and the second is easy to miss: the booking must be paid, AND
 * while it is still `payment_done` the API only reveals documents from 24h
 * before duty start. So a 403 here is often "too early", not "not allowed" —
 * the copy says so rather than showing a bare error.
 *
 * `fileUrl` is a short-lived presigned S3 URL. It is opened directly and never
 * stored or proxied through next/image, which would cache a link that expires.
 */
export function ProviderDocuments({ bookingId }: { bookingId: string }) {
  const { data, loading, error } = useApiQuery<{ documents: ApiBookingDocument[] }>(
    `bookings/${bookingId}/documents`,
  );

  const documents = data?.documents ?? [];

  return (
    <SubPage
      title="Provider Documents"
      subtitle="Verified credentials for the guard on this booking."
      backHref={`/dashboard/bookings/${bookingId}`}
      backLabel="Booking"
      width={720}
    >
      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[76px] animate-pulse rounded-lg bg-panel" />
          ))}
        </div>
      ) : error ? (
        <Card className="px-6 py-12 text-center">
          <p className="text-body text-fg-mid">{error}</p>
          <p className="mx-auto mt-2 max-w-[440px] text-body-sm leading-relaxed text-fg-faint">
            Documents are released once the booking is paid, and from 24 hours before the
            duty starts. If the shift is further out, check back nearer the time.
          </p>
        </Card>
      ) : documents.length === 0 ? (
        <Card className="px-6 py-12 text-center">
          <p className="text-body text-fg-mid">No documents to show.</p>
          <p className="mx-auto mt-2 max-w-[440px] text-body-sm leading-relaxed text-fg-faint">
            This provider has no verified documents attached to the booking yet.
          </p>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            {documents.map((doc) => (
              <Card key={doc._id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-panel-raised text-fg">
                  <ShieldFill size={18} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-body font-semibold text-fg">
                      {DOCUMENT_LABELS[doc.documentType ?? ""] ??
                        (doc.documentType ?? "Document").replace(/_/g, " ")}
                    </p>
                    {doc.verificationStatus === "verified" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-live px-2.5 py-[3px] text-eyebrow font-semibold text-live">
                        <CheckCircleFill size={11} />
                        Verified
                      </span>
                    ) : null}
                  </div>
                  {doc.expiryDate ? (
                    <p className="mt-0.5 text-body-sm text-fg-faint">
                      Valid until {formatApiDate(doc.expiryDate)}
                    </p>
                  ) : null}
                </div>

                {doc.fileUrl ? (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-sm border border-edge px-5 py-2 text-body-sm font-medium text-fg transition-colors hover:bg-panel-raised"
                  >
                    View
                  </a>
                ) : null}
              </Card>
            ))}
          </div>

          <p className="mt-4 text-body-sm leading-relaxed text-fg-faint">
            These are shared with you for this booking only. Document links expire after a
            few minutes — reload the page if one stops opening.
          </p>
        </>
      )}
    </SubPage>
  );
}
