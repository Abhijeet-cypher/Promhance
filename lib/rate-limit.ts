import { NextResponse } from "next/server";

/**
 * Fixed-window rate limiter.
 *
 * With UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN set, counters live in
 * Redis and are shared across all serverless instances. Without them it falls
 * back to a per-instance in-memory map, which is only best-effort on
 * serverless (each instance keeps its own counters) but still blunts abuse.
 * If Redis is unreachable the limiter fails open so an outage never blocks
 * real users.
 */

type Entry = { count: number; resetAt: number };
const memoryStore = new Map<string, Entry>();

function memoryHit(key: string, windowSec: number): number {
  const now = Date.now();

  if (memoryStore.size > 10_000) {
    for (const [k, entry] of memoryStore) {
      if (entry.resetAt <= now) memoryStore.delete(k);
    }
  }

  const entry = memoryStore.get(key);
  if (!entry || entry.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

async function redisHit(key: string, windowSec: number): Promise<number | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(windowSec), "NX"],
      ]),
      signal: AbortSignal.timeout(1500),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: unknown }[];
    const count = Number(data?.[0]?.result);
    return Number.isFinite(count) ? count : null;
  } catch {
    return null;
  }
}

/** Returns true when `key` has exceeded `limit` hits in the current window. */
export async function isRateLimited(
  key: string,
  limit: number,
  windowSec: number
): Promise<boolean> {
  const fromRedis = await redisHit(`rl:${key}`, windowSec);
  if (fromRedis !== null) return fromRedis > limit;
  if (process.env.UPSTASH_REDIS_REST_URL) return false; // Redis configured but down: fail open
  return memoryHit(key, windowSec) > limit;
}

/**
 * Best-effort client IP. Prefers headers the hosting platform sets itself
 * over the client-appendable X-Forwarded-For chain.
 */
export function getClientIp(req: Request): string {
  const platform =
    req.headers.get("x-real-ip") ?? req.headers.get("x-vercel-forwarded-for");
  if (platform) return platform.split(",")[0].trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}

type Limit = { limit: number; windowSec: number };

/**
 * Applies a per-minute and a per-day limit for `scope` (e.g. "enhance").
 * Returns a 429 response when blocked, otherwise null.
 */
export async function enforceRateLimit(
  req: Request,
  scope: string,
  perMinute: number,
  perDay: number
): Promise<NextResponse | null> {
  const ip = getClientIp(req);
  const windows: Limit[] = [
    { limit: perMinute, windowSec: 60 },
    { limit: perDay, windowSec: 86_400 },
  ];

  for (const { limit, windowSec } of windows) {
    if (await isRateLimited(`${scope}:${windowSec}:${ip}`, limit, windowSec)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(windowSec === 60 ? 60 : 3600) } }
      );
    }
  }
  return null;
}
