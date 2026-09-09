import { NextRequest, NextResponse } from "next/server";
import { loadCatalog } from "@/lib/catalog";
import { getConfig, verifyAdminKey } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") ?? req.headers.get("x-admin-key") ?? "";
  const config = await getConfig();

  if (!verifyAdminKey(key, config)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const catalog = await loadCatalog(true);
  return NextResponse.json({ success: true, catalogSize: catalog.length });
}
