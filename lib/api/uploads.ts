import { api } from "@/lib/api/client";

type PresignResponse = {
  uploadUrl: string;
  key: string;
  expiresIn?: number;
  contentType: string;
  contentLength: number;
};

/**
 * Direct-to-S3 upload. `confirm` is mandatory — handlers reject unconfirmed keys.
 *
 * NOT YET WIRED, deliberately. Ticket attachments and rating photos currently
 * go through the dedicated multipart endpoints (`POST /tickets/:id/upload`,
 * `POST /ratings/photo`), which work and are simpler. This is the path for the
 * `attachments` / `photos` key arrays that `POST /tickets/` and `POST /ratings/`
 * accept, and it is the one to switch to when file size starts to matter: a
 * multipart POST buffers the whole file through this app's route handler, which
 * has a body limit and no streaming, whereas a presigned PUT goes browser → S3
 * directly. Switching needs an S3-configured backend to test against (`SC_503`
 * otherwise), which is why it has not happened yet.
 */
export async function uploadToS3(
  file: File,
  folder: "documents" | "avatars" | "gallery" | "chat" | "tickets" | "ratings",
): Promise<string> {
  const presign = await api<PresignResponse>("uploads/presign", {
    method: "POST",
    body: {
      folder,
      contentType: file.type || "application/octet-stream",
      contentLength: file.size,
      fileName: file.name,
    },
  });

  const put = await fetch(presign.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": presign.contentType },
  });
  if (!put.ok) {
    throw new Error("Upload failed. Try a smaller file.");
  }

  await api("uploads/confirm", { method: "POST", body: { key: presign.key } });
  return presign.key;
}
