"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Card } from "@/components/dashboard/primitives";
import { useSession } from "@/components/session/SessionProvider";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";

/** Mirrors the API's avatar filter (ALLOWED_IMAGE_TYPES, 10 MB cap). */
const ACCEPTED = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Uploads the profile photo on its own, not with the rest of the form.
 *
 * `PATCH /auth/profile-photo` is a separate multipart endpoint that takes the
 * file in a `file` field — `PUT /client/profile` has no path for it. So it
 * saves the moment a file is picked, and the form's Save button is unrelated.
 */
export function AvatarUploader() {
  const { profile, refresh } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [profile?.avatarUrl]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so picking the same file again after a failure still fires onChange.
    event.target.value = "";
    if (!file) return;

    setError(null);
    setDone(false);
    if (!ACCEPTED.includes(file.type)) {
      setError("Use a JPG, PNG, GIF or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That image is over 10 MB. Choose a smaller one.");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      await api("auth/profile-photo", { method: "PATCH", body });
      // The topbar and profile hero read the photo from the session.
      await refresh();
      setDone(true);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setUploading(false);
      setPreview(null);
    }
  }

  const src = preview ?? (failed ? null : profile?.avatarUrl) ?? null;

  return (
    <Card className="p-6">
      <h3 id="photo" className="mb-4 scroll-mt-24 font-sans text-body font-semibold text-fg">
        Profile Photo
      </h3>
      <div className="flex flex-wrap items-center gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline bg-panel-raised text-h2 text-fg">
          {src ? (
            // A presigned S3 URL or a local blob — neither suits next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              onError={() => setFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            (profile?.initial ?? "·")
          )}
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            onChange={onPick}
            className="sr-only"
            aria-label="Choose a profile photo"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-sm border border-edge px-5 py-2.5 text-body font-medium text-fg transition-colors hover:bg-panel-raised disabled:opacity-60"
          >
            {uploading ? "Uploading…" : profile?.avatarUrl ? "Change photo" : "Upload photo"}
          </button>
          <p className="mt-2 text-body-sm text-fg-faint">JPG, PNG, GIF or WebP, up to 10 MB.</p>
        </div>
      </div>
      <div aria-live="polite">
        {error ? (
          <p role="alert" className="mt-4 text-body-sm text-fault">
            {error}
          </p>
        ) : null}
        {done && !error ? <p className="mt-4 text-body-sm text-live">Photo updated.</p> : null}
      </div>
    </Card>
  );
}
