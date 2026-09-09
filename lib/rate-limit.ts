/**
 * Sliding-window rate limiter (in-memory, per IP).
 */
import { NextRequest, NextResponse } from "next/server";

const windowMs = 60_000; // 1 minute
const ipMap = new Map<string, number[]>();

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp (seconds)
  retryAfter?: number; // seconds
}

export function checkRateLimit(ip: string, limitPerMinute: number): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get or create entry
  let timestamps = ipMap.get(ip) ?? [];
  // Drop old timestamps
  timestamps = timestamps.filter((t) => t > windowStart);

  const remaining = Math.max(0, limitPerMinute - timestamps.length);
  const oldestInWindow = timestamps[0] ?? now;
  const reset = Math.ceil((oldestInWindow + windowMs) / 1000);

  if (timestamps.length >= limitPerMinute) {
    return {
      ok: false,
      limit: limitPerMinute,
      remaining: 0,
      reset,
      retryAfter: Math.ceil((oldestInWindow + windowMs - now) / 1000),
    };
  }

  timestamps.push(now);
  ipMap.set(ip, timestamps);

  // Cleanup old IPs periodically
  if (Math.random() < 0.01) {
    for (const [key, ts] of ipMap.entries()) {
      if (ts.every((t) => t <= windowStart)) {
        ipMap.delete(key);
      }
    }
  }

  return {
    ok: true,
    limit: limitPerMinute,
    remaining: remaining - 1,
    reset,
  };
}

export function getClientIp(req: NextRequest): string {
  // Prefer the platform-controlled header on Vercel.
  const vercelFwd = req.headers.get("x-vercel-forwarded-for");
  if (vercelFwd) {
    const ip = vercelFwd.split(",")[0].trim();
    if (ip) return ip;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    if (ip) return ip;
  }
  return "unknown";
}

export function applyRateLimit(
  req: NextRequest,
  limitPerMinute: number
):
  | { ok: true; headers: Record<string, string> }
  | { ok: false; headers: Record<string, string>; response: NextResponse } {
  const ip = getClientIp(req);
  const skipRateLimit = isLocalhost(ip) && process.env.NODE_ENV === "development";
  const rl = skipRateLimit
    ? { ok: true, limit: 999, remaining: 999, reset: 0 }
    : checkRateLimit(ip, limitPerMinute);

  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(rl.limit),
    "X-RateLimit-Remaining": String(rl.remaining),
    "X-RateLimit-Reset": String(rl.reset),
  };

  if (!rl.ok) {
    return {
      ok: false,
      headers,
      response: NextResponse.json(
        { success: false, error: "Too Many Requests" },
        {
          status: 429,
          headers: { ...headers, "Retry-After": String(rl.retryAfter ?? 60) },
        }
      ),
    };
  }

  return { ok: true, headers };
}

const LOCALHOST_IPS = new Set(["localhost", "127.0.0.1", "::1", "::ffff:127.0.0.1"]);

/** Returns true when the request comes from localhost (dev). */
export function isLocalhost(ip: string): boolean {
  return LOCALHOST_IPS.has(ip);
}
