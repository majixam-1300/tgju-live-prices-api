import { NextResponse } from "next/server";
import { getCacheStatus, getMemoryStoreSize } from "@/lib/cache";
import { loadCatalog } from "@/lib/catalog";
import { getConfig } from "@/lib/config";
import { getRecentLogs } from "@/lib/tgju";

export const dynamic = "force-dynamic";

const startTime = Date.now();
let lastFetch: string | null = null;

export function setLastFetch(ts: string) {
  lastFetch = ts;
}

export async function GET() {
  const [catalog, config] = await Promise.all([loadCatalog(), getConfig()]);
  const cacheStatus = getCacheStatus();

  return NextResponse.json({
    status: "ok",
    redis: cacheStatus,
    lastFetch: lastFetch ?? "never",
    catalogSize: catalog.length,
    selectedCount: config.selectedItems.length,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    memoryStoreSize: getMemoryStoreSize(),
    recentLogs: getRecentLogs(20),
  });
}
