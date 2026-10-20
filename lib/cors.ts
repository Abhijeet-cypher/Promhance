/**
 * CORS support for the Promhance browser extension.
 *
 * The extension's background service worker calls the hosted API from a
 * `chrome-extension://` / `moz-extension://` origin, which the browser blocks
 * by default. These helpers add the required headers and answer preflight
 * requests. Only the public, unauthenticated enhance/promai endpoints use them.
 */

const ALLOWED_ORIGIN_RE = /^(chrome|moz)-extension:\/\/[a-z0-9]+$/i;

/** Returns the CORS headers for a request, echoing only extension origins. */
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  if (!ALLOWED_ORIGIN_RE.test(origin)) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/** Handles a CORS preflight request. */
export function preflight(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

/** Adds CORS headers to a JSON response. */
export function withCors(req: Request, res: Response): Response {
  const headers = corsHeaders(req);
  for (const [key, value] of Object.entries(headers)) res.headers.set(key, value);
  return res;
}
