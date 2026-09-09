import { NextRequest, NextResponse } from "next/server";
import { getConfig, verifyAdminKey } from "@/lib/config";
import { loadCatalog } from "@/lib/catalog";
import { fetchMultiplePrices } from "@/lib/tgju";
import { applyRateLimit } from "@/lib/rate-limit";
import { CachedPrice } from "@/lib/cache";

export const dynamic = "force-dynamic";

const MAX_SYMBOLS_PER_REQUEST = 40;

export async function GET(req: NextRequest) {
  const config = await getConfig();

  const rl = applyRateLimit(req, config.rateLimitPerMinute);
  if (!rl.ok) return rl.response;
  const rlHeaders = rl.headers;

  const url = new URL(req.url);
  const symbolsParam = url.searchParams.get("symbols");

  const catalog = await loadCatalog();
  const catalogMap = new Map(catalog.map((s) => [s.id, s]));

  let symbolIds: string[];
  if (symbolsParam) {
    const requested = [...new Set(symbolsParam.split(",").map((s) => s.trim()).filter(Boolean))];
    symbolIds = requested.filter((id) => catalogMap.has(id)).slice(0, MAX_SYMBOLS_PER_REQUEST);
    if (symbolIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid catalog symbols in ?symbols=" },
        { status: 400, headers: rlHeaders }
      );
    }
  } else {
    symbolIds = config.selectedItems.filter((id) => catalogMap.has(id)).slice(0, MAX_SYMBOLS_PER_REQUEST);
  }

  const inputs = symbolIds.map((id) => {
    const entry = catalogMap.get(id)!;
    return { id, label: entry.label, unit: entry.unit };
  });

  const adminKey = req.headers.get("x-admin-key") ?? "";
  const forceRefresh = url.searchParams.has("force") && verifyAdminKey(adminKey, config);
  const prices = await fetchMultiplePrices(inputs, forceRefresh);

  const data: Record<string, CachedPrice> = prices;
  let staleCount = 0, errorCount = 0, latestUpdatedAt = "";
  for (const p of Object.values(data)) {
    if (p.stale) staleCount++;
    if (p.error) errorCount++;
    if (!latestUpdatedAt || p.updatedAt > latestUpdatedAt) latestUpdatedAt = p.updatedAt;
  }

  const demoMode = process.env.DEMO_MODE === "true";

  return NextResponse.json(
    {
      success: true,
      updatedAt: latestUpdatedAt || new Date().toISOString(),
      cachedAt: new Date().toISOString(),
      ttlSeconds: config.ttlSeconds,
      staleCount,
      errorCount,
      demoMode,
      data,
    },
    { headers: { ...rlHeaders, "Cache-Control": "public, max-age=30" } }
  );
}
