import { NextRequest, NextResponse } from "next/server";
import { loadCatalog, filterCatalog } from "@/lib/catalog";
import { getConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? undefined;
  const search = url.searchParams.get("search") ?? undefined;
  const availableParam = url.searchParams.get("available");
  const available = availableParam !== null ? availableParam === "true" : undefined;

  const [catalog, config] = await Promise.all([loadCatalog(), getConfig()]);
  const selectedSet = new Set(config.selectedItems);

  let items = filterCatalog(catalog, { category, search, available });
  const result = items.map((item) => ({
    ...item,
    selected: selectedSet.has(item.id),
  }));

  return NextResponse.json({ success: true, total: result.length, data: result });
}
