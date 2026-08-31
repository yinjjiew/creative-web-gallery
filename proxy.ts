import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

/**
 * The whole catalogue sits behind HTTP basic auth while it is confidential.
 *
 * One tier only: there is no admin surface here, because the catalogue is
 * authored in the repository rather than edited through the site. That is a
 * deliberate simplification over a database-backed project — there is no
 * write path to protect.
 *
 * In Next.js 16 this file is `proxy.ts`; the middleware convention was renamed.
 */
const REALM = 'Basic realm="Creative Web Reference Gallery", charset="UTF-8"';

const CHALLENGE = {
  status: 401,
  headers: {
    "WWW-Authenticate": REALM,
    // Nothing behind the gate should be cached by an intermediary or indexed.
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
  },
} as const;

/**
 * Digest first so the comparison is over fixed-length buffers. `timingSafeEqual`
 * throws on a length mismatch, which would otherwise leak credential length.
 */
function matches(supplied: string, expected: string) {
  const a = createHash("sha256").update(supplied, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

function decodeCredentials(header: string) {
  try {
    // TextDecoder rather than atob: a password may contain characters outside
    // Latin-1, which atob would mangle.
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(
      Buffer.from(header.slice(6), "base64")
    );
    const separator = decoded.indexOf(":");
    if (separator === -1) return null;
    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const username = process.env.SITE_USERNAME;
  const password = process.env.SITE_PASSWORD;

  if (!username || !password) {
    // Fail closed. A missing environment variable must never be the reason a
    // confidential site becomes readable.
    return new NextResponse(
      "Site access is not configured. Set SITE_USERNAME and SITE_PASSWORD.",
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Basic ")) {
    return new NextResponse("Authentication required.", CHALLENGE);
  }

  const supplied = decodeCredentials(authorization);
  if (!supplied) {
    return new NextResponse("Authentication required.", CHALLENGE);
  }

  // Both halves are always checked, without short-circuiting, so failure timing
  // does not reveal which half was wrong.
  const usernameOk = matches(supplied.username, username);
  const passwordOk = matches(supplied.password, password);
  if (!usernameOk || !passwordOk) {
    return new NextResponse("Authentication required.", CHALLENGE);
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  // Build assets are excluded: they carry no catalogue content, and gating them
  // would force a credential check on every font and chunk request.
  matcher: ["/((?!_next/static/|_next/image/|favicon\\.ico$).*)"],
};
