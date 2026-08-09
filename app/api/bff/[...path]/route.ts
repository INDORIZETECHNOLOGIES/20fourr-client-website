import { NextResponse, type NextRequest } from "next/server";
import { callBackend, callBackendRaw } from "@/lib/api/backend";
import { errorResponse } from "@/lib/api/route-helpers";
import { getAccessToken, refreshSession, clearTokens } from "@/lib/api/session";

/**
 * The authenticated pass-through to the API.
 *
 * Everything the dashboard fetches from the browser comes through here:
 * `/api/bff/client/bookings` → `GET {API}/client/bookings` with the session's
 * Bearer token attached server-side. The token never enters the page.
 *
 * Status and body are forwarded verbatim, so callers see the API's own error
 * codes and its `fields` map for validation failures.
 */

/**
 * Only these path prefixes may be proxied.
 *
 * The token's role already stops a client reaching provider or admin routes,
 * but relying on that alone would make this endpoint an "anything the session
 * can do" hole — one missed authorization check on the API and it is reachable
 * from any page on this site. The allowlist is the second lock: adding a screen
 * means adding its prefix here on purpose.
 */
const ALLOWED_PREFIXES = [
  "client/",
  "bookings",
  "ratings",
  "payments/",
  "tickets",
  "notifications",
  "wallet",
  "referral",
  "invoices",
  "coupons/",
  "recurring",
  "protection/",
  "duty/",
  "chat/",
];

/** Paths whose responses are files, not JSON. */
const BINARY_PATHS =
  /^(invoices\/[^/]+\/pdf|client\/bookings\/[^/]+\/invoice)$/;

function passThrough(upstream: Response): NextResponse {
  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/octet-stream",
      ...(upstream.headers.get("content-disposition")
        ? { "content-disposition": upstream.headers.get("content-disposition") as string }
        : {}),
    },
  });
}

function isAllowed(path: string): boolean {
  if (path.includes("..")) return false;
  return ALLOWED_PREFIXES.some((prefix) =>
    prefix.endsWith("/") ? path.startsWith(prefix) : path === prefix || path.startsWith(`${prefix}/`),
  );
}

async function proxy(request: NextRequest, ctx: RouteContext<"/api/bff/[...path]">) {
  try {
    const { path: segments } = await ctx.params;
    const path = segments.join("/");

    if (!isAllowed(path)) {
      return NextResponse.json(
        { message: "Not found.", code: "SC_NOT_PROXIED" },
        { status: 404 },
      );
    }

    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json(
        { message: "Your session has expired. Please sign in again.", code: "SC_SESSION_EXPIRED" },
        { status: 401 },
      );
    }

    const method = request.method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    const hasBody = method !== "GET" && method !== "DELETE";

    let body: unknown;
    if (hasBody) {
      const contentType = request.headers.get("content-type") ?? "";
      if (contentType.includes("multipart/form-data")) {
        body = await request.formData();
      } else {
        const text = await request.text();
        body = text ? JSON.parse(text) : undefined;
      }
    }

    const query = Object.fromEntries(request.nextUrl.searchParams.entries());

    // Binary endpoints — the GST invoice PDF — must not go through the JSON
    // path, which would read the bytes as text and corrupt the file. Stream the
    // upstream response back with its own content type and filename.
    if (BINARY_PATHS.test(path)) {
      const upstream = await callBackendRaw({ path: `/${path}`, method, token, query });
      if (upstream.status === 401) {
        const rotated = await refreshSession();
        if (!rotated) {
          await clearTokens();
          return NextResponse.json(
            { message: "Your session has expired. Please sign in again.", code: "SC_SESSION_EXPIRED" },
            { status: 401 },
          );
        }
        const retried = await callBackendRaw({
          path: `/${path}`,
          method,
          token: rotated.accessToken,
          query,
        });
        return passThrough(retried);
      }
      return passThrough(upstream);
    }

    let response = await callBackend({ path: `/${path}`, method, body, token, query });

    if (response.status === 401) {
      const rotated = await refreshSession();
      if (!rotated) {
        await clearTokens();
        return NextResponse.json(
          { message: "Your session has expired. Please sign in again.", code: "SC_SESSION_EXPIRED" },
          { status: 401 },
        );
      }
      response = await callBackend({
        path: `/${path}`,
        method,
        body,
        token: rotated.accessToken,
        query,
      });
    }

    if (response.status === 204) return new NextResponse(null, { status: 204 });
    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
