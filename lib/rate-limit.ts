/**
 * Sliding-window rate limiter (in-memory, per IP).
 */
import { NextRequest } from "next/server";

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
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    if (ip) return ip;
  }
  // Try other common proxy headers
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "localhost";
}

const LOCALHOST_IPS = new Set(["localhost", "127.0.0.1", "::1", "::ffff:127.0.0.1"]);

/** Returns true when the request comes from localhost (dev). */
export function isLocalhost(ip: string): boolean {
  return LOCALHOST_IPS.has(ip);
}
