/**
 * App configuration: persisted in Redis/memory.
 */
import { timingSafeEqual } from "crypto";
import { getConfigCache, setConfigCache } from "./cache";
import { defaultSelectedSymbols } from "@/data/seed-symbols";

export interface AppConfig {
  selectedItems: string[];
  ttlSeconds: number;
  rateLimitPerMinute: number;
  sanityCheckEnabled: boolean;
  sanityCheckThreshold: number; // percent
  adminKey: string;
}

const WEAK_ADMIN_KEYS = new Set(["", "change-me-please", "admin", "password"]);

function resolveAdminKey(): string {
  const fromEnv = process.env.ADMIN_KEY?.trim() ?? "";
  if (WEAK_ADMIN_KEYS.has(fromEnv)) {
    // Fail closed in production: unset/weak keys never authenticate.
    if (process.env.NODE_ENV === "production") return "";
    return fromEnv || "change-me-please";
  }
  return fromEnv;
}

const defaultConfig: AppConfig = {
  selectedItems: defaultSelectedSymbols,
  ttlSeconds: Number(process.env.CACHE_TTL_SECONDS ?? 30),
  rateLimitPerMinute: Number(process.env.RATE_LIMIT_PER_MINUTE ?? 60),
  sanityCheckEnabled: true,
  sanityCheckThreshold: Number(process.env.SANITY_CHECK_THRESHOLD ?? 25),
  adminKey: resolveAdminKey(),
};

let _cachedConfig: AppConfig | null = null;

export async function getConfig(): Promise<AppConfig> {
  if (_cachedConfig) return _cachedConfig;
  const stored = await getConfigCache<AppConfig>();
  if (stored) {
    _cachedConfig = { ...defaultConfig, ...stored };
    return _cachedConfig;
  }
  return { ...defaultConfig };
}

export async function saveConfig(partial: Partial<AppConfig>): Promise<AppConfig> {
  const current = await getConfig();
  const updated: AppConfig = { ...current, ...partial };
  await setConfigCache(updated);
  _cachedConfig = updated;
  return updated;
}

export function invalidateConfigCache(): void {
  _cachedConfig = null;
}

export function verifyAdminKey(key: string, config: AppConfig): boolean {
  const expected = resolveAdminKey() || config.adminKey;
  if (!key || !expected || WEAK_ADMIN_KEYS.has(expected)) return false;
  const a = Buffer.from(key);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
