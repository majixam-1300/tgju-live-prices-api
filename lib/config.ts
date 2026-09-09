/**
 * App configuration: persisted in Redis/memory.
 */
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

const defaultConfig: AppConfig = {
  selectedItems: defaultSelectedSymbols,
  ttlSeconds: Number(process.env.CACHE_TTL_SECONDS ?? 30),
  rateLimitPerMinute: Number(process.env.RATE_LIMIT_PER_MINUTE ?? 60),
  sanityCheckEnabled: true,
  sanityCheckThreshold: Number(process.env.SANITY_CHECK_THRESHOLD ?? 25),
  adminKey: process.env.ADMIN_KEY ?? "change-me-please",
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
  const expected = process.env.ADMIN_KEY ?? config.adminKey;
  return key === expected && key.length > 0;
}
