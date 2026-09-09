import { NextRequest, NextResponse } from "next/server";
import { loadCatalog } from "@/lib/catalog";
import { fetchSymbolPrice } from "@/lib/tgju";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;

  const catalog = await loadCatalog();
  const entry = catalog.find((s) => s.id === symbol);

  const label = entry?.label ?? symbol;
  const unit = entry?.unit ?? "تومان";

  const price = await fetchSymbolPrice(symbol, label, unit);

  return NextResponse.json(
    { success: !price.error, symbol, ...price },
    { headers: { "Cache-Control": "public, max-age=30" } }
  );
}
