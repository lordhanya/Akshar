import { NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/auth";
import {
  checkRateLimit,
  evictExpiredRateLimitEntries,
} from "@/lib/rate-limit";

const handler = toNextJsHandler(auth);

/**
 * Rate-limit the password-reset request endpoint to prevent abuse.
 * 5 requests per 15 minutes per IP:email pair.
 */
const RESET_RATE_LIMIT = { maxRequests: 5, windowMs: 15 * 60 * 1000 };

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

async function rateLimitedPost(request: Request) {
  evictExpiredRateLimitEntries();

  const url = new URL(request.url);
  const isResetRequest =
    request.method === "POST" &&
    url.pathname.endsWith("/request-password-reset");

  if (isResetRequest) {
    let email = "unknown";
    try {
      const body = await request.clone().json();
      email = String(body.email ?? "unknown").toLowerCase();
    } catch {
      // body may not be JSON; fall through with "unknown"
    }

    const ip = getClientIp(request);
    const key = `reset:${ip}:${email}`;
    const result = checkRateLimit(
      key,
      RESET_RATE_LIMIT.maxRequests,
      RESET_RATE_LIMIT.windowMs,
    );

    if (!result.ok) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfterMs: result.retryAfterMs,
        },
        { status: 429 },
      );
    }
  }

  return handler.POST(request);
}

export const GET = handler.GET;
export const POST = rateLimitedPost;
export const PUT = handler.PUT;
export const PATCH = handler.PATCH;
export const DELETE = handler.DELETE;
