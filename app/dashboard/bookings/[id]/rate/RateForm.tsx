"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/dashboard/primitives";
import { Notice } from "@/components/ui/Notice";
import { StarFill } from "@/components/dashboard/icons";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";

const POSITIVES = [
  "Punctual",
  "Professional",
  "Alert and attentive",
  "Well presented",
  "Good communication",
  "Handled an incident well",
];

const CONCERNS = [
  "Arrived late",
  "Left the post",
  "Poor communication",
  "Uniform / presentation",
  "Phone use on duty",
  "Attitude",
];

export function RateForm({
  guard,
  bookingId,
  providerUserId,
}: {
  guard: string;
  bookingId: string;
  /** The user being rated. POST /ratings rejects the request without it (SC_209). */
  providerUserId: string | null;
}) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!providerUserId) {
      setError("This booking has no provider assigned, so there is nothing to rate.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api("ratings", {
        method: "POST",
        body: {
          bookingId,
          // Required by the API — it will not infer the recipient.
          toUserId: providerUserId,
          rating: stars,
          review: comment.trim() || undefined,
          tags,
        },
      });
      setSent(true);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  // Below 4 stars we ask what went wrong instead of what went well.
  const negative = stars > 0 && stars < 4;
  const pool = negative ? CONCERNS : POSITIVES;

  function toggle(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  if (sent) {
    return (
      <Card className="p-6">
        <Notice>
          Thanks — your rating is recorded and 50 SecurePoints have been credited.
          Ratings are shown to other clients but never attributed to you if you
          chose to post anonymously.
        </Notice>
        <Link
          href="/dashboard/bookings"
          className="mt-5 inline-block rounded-sm bg-brand text-brand-ink px-7 py-2.5 text-body font-semibold"
        >
          Back to bookings
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <p className="text-center text-body text-fg-mid">
        How was your experience with <strong className="text-fg">{guard}</strong>?
      </p>

      <div className="mt-5 flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            aria-pressed={stars === n}
            onClick={() => {
              setStars(n);
              setTags([]);
            }}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className={[
              "transition-opacity hover:scale-110",
              (hover || stars) >= n ? "text-fg" : "text-fg-faint",
            ].join(" ")}
          >
            <StarFill size={38} />
          </button>
        ))}
      </div>

      {stars > 0 ? (
        <>
          <p className="mt-6 text-label font-semibold uppercase tracking-[1.2px] text-fg-faint">
            {negative ? "Areas of concern" : "What went well"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pool.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tags.includes(t)}
                onClick={() => toggle(t)}
                className={[
                  "rounded-sm border px-4 py-2 text-body-sm font-semibold transition-colors",
                  tags.includes(t)
                    ? negative
                      ? "border-fault/50 bg-transparent text-fault"
                      : "border-brand bg-panel-raised text-brand"
                    : "border-hairline text-fg-mid hover:border-edge",
                ].join(" ")}
              >
                {t}
              </button>
            ))}
          </div>

          <label
            htmlFor="rating-comment"
            className="mb-2 mt-6 block text-body-sm font-medium text-fg-mid"
          >
            Anything else? <span className="text-fg-faint">(optional)</span>
          </label>
          <textarea
            id="rating-comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Your review helps other clients choose."
            className="w-full rounded-lg border border-hairline bg-panel-raised px-4 py-3 text-body text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-edge"
          />

          <label className="mt-4 flex cursor-pointer items-center gap-3 text-body text-fg-mid">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-5 w-5 accent-brand"
            />
            Post anonymously
          </label>

          {error ? (
            <p
              role="alert"
              className="mb-3 rounded-lg border border-fault bg-transparent px-4 py-3 text-body text-fault"
            >
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={submit}
            disabled={saving || stars === 0}
            className="mt-6 w-full rounded-sm bg-brand text-brand-ink py-3.5 text-body font-semibold transition-opacity   disabled:opacity-50"
          >
            {saving ? "Submitting…" : "Submit rating"}
          </button>
        </>
      ) : (
        <p className="mt-6 text-center text-body-sm text-fg-faint">
          Pick a rating to continue.
        </p>
      )}
    </Card>
  );
}
