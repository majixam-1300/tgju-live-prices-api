import { NextRequest, NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { loadCatalog } from "@/lib/catalog";
import { fetchSymbolPrice } from "@/lib/tgju";
import { applyRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const config = await getConfig();
  const rl = applyRateLimit(req, config.rateLimitPerMinute);
  if (!rl.ok) return rl.response;

  const { symbol } = await params;

  const catalog = await loadCatalog();
  const entry = catalog.find((s) => s.id === symbol);
  if (!entry) {
    return NextResponse.json(
      { success: false, error: "Unknown symbol" },
      { status: 404, headers: rl.headers }
    );
  }

  const price = await fetchSymbolPrice(symbol, entry.label, entry.unit);

  return NextResponse.json(
    { success: !price.error, symbol, ...price },
    { headers: { ...rl.headers, "Cache-Control": "public, max-age=30" } }
  );
}
