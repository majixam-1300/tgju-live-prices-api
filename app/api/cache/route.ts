import { NextRequest, NextResponse } from "next/server";
import { clearAllPrices } from "@/lib/cache";
import { getConfig, verifyAdminKey } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
  const key = req.headers.get("x-admin-key") ?? "";
  const config = await getConfig();

  if (!verifyAdminKey(key, config)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const count = await clearAllPrices();
  return NextResponse.json({ success: true, clearedCount: count });
}
