/**
 * Cache abstraction: Upstash Redis (if configured) or in-memory Map fallback.
 */

export interface CachedPrice {
  value: number;
  formatted: string;
  unit: string;
  label: string;
  change: number;
  changeFormatted: string;
  stale: boolean;
  suspicious: boolean;
  error: boolean;
  updatedAt: string;   // ISO – timestamp from tgju
  cachedAt: string;    // ISO – when we stored it
  ttlSeconds: number;
}

interface MemoryEntry<T> {
  data: T;
  expiresAt: number; // ms
}

// ── In-Memory Fallback ────────────────────────────────────────────────────────

const memoryStore = new Map<string, MemoryEntry<unknown>>();

export type CacheStatus = "connected" | "disconnected" | "memory-fallback";
let cacheStatus: CacheStatus = "memory-fallback";

// ── Redis Client (lazy) ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redisClient: any = null;

async function getRedis() {
  if (redisClient) return redisClient;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  try {
    const { Redis } = await import("@upstash/redis");
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    cacheStatus = "connected";
    return redisClient;
  } catch {
    cacheStatus = "disconnected";
    return null;
  }
}

// ── Generic get/set/del ───────────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = await getRedis();
  if (redis) {
    try {
      const val = await redis.get(key);
      if (val === null || val === undefined) return null;
      return (typeof val === "string" ? JSON.parse(val) : val) as T;
    } catch {
      // fall through to memory
    }
  }
  const entry = memoryStore.get(key) as MemoryEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.data;
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    try {
      await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
      return;
    } catch {
      // fall through to memory
    }
  }
  memoryStore.set(key, { data: value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheDel(key: string): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    try {
      await redis.del(key);
    } catch {/* ignore */}
  }
  memoryStore.delete(key);
}

export async function cacheFlushPattern(pattern: string): Promise<number> {
  const redis = await getRedis();
  let count = 0;
  if (redis) {
    try {
      let cursor = 0;
      do {
        const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 });
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
          count += keys.length;
        }
      } while (cursor !== 0);
      return count;
    } catch {/* fall through */}
  }
  // Memory fallback: iterate and delete matching keys
  for (const key of memoryStore.keys()) {
    if (matchPattern(key, pattern)) {
      memoryStore.delete(key);
      count++;
    }
  }
  return count;
}

function matchPattern(key: string, pattern: string): boolean {
  const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
  return regex.test(key);
}

// ── Domain helpers ────────────────────────────────────────────────────────────

const PRICE_PREFIX = "tgju:prices:";
const CATALOG_KEY = "tgju:catalog";
const CONFIG_KEY = "tgju:config";
const LAST_VALUES_PREFIX = "tgju:lastValues:";
const PRICE_TTL = Number(process.env.CACHE_TTL_SECONDS ?? 30);

export async function getPriceCache(symbol: string): Promise<CachedPrice | null> {
  return cacheGet<CachedPrice>(`${PRICE_PREFIX}${symbol}`);
}

export async function setPriceCache(symbol: string, data: CachedPrice, ttl?: number): Promise<void> {
  return cacheSet(`${PRICE_PREFIX}${symbol}`, data, ttl ?? PRICE_TTL);
}

export async function getLastValue(symbol: string): Promise<number | null> {
  return cacheGet<number>(`${LAST_VALUES_PREFIX}${symbol}`);
}

export async function setLastValue(symbol: string, value: number): Promise<void> {
  return cacheSet(`${LAST_VALUES_PREFIX}${symbol}`, value, 86400 * 7); // 7 days
}

export async function getCatalogCache<T>(): Promise<T | null> {
  return cacheGet<T>(CATALOG_KEY);
}

export async function setCatalogCache<T>(data: T): Promise<void> {
  return cacheSet(CATALOG_KEY, data, 86400); // 24h
}

export async function getConfigCache<T>(): Promise<T | null> {
  return cacheGet<T>(CONFIG_KEY);
}

export async function setConfigCache<T>(data: T): Promise<void> {
  return cacheSet(CONFIG_KEY, data, 86400 * 365); // very long TTL = persistent
}

export async function clearLastValue(symbol: string): Promise<void> {
  return cacheDel(`${LAST_VALUES_PREFIX}${symbol}`);
}

export async function clearAllPrices(): Promise<number> {
  // Clear both cached prices AND sanity-check lastValues so stale references don't block new prices
  const priceCount = await cacheFlushPattern(`${PRICE_PREFIX}*`);
  await cacheFlushPattern(`${LAST_VALUES_PREFIX}*`);
  return priceCount;
}

export function getCacheStatus(): CacheStatus {
  return cacheStatus;
}

export function getMemoryStoreSize(): number {
  return memoryStore.size;
}
