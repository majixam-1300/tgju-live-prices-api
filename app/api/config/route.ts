import { NextRequest, NextResponse } from "next/server";
import { getConfig, saveConfig, verifyAdminKey } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getConfig();
  // Don't expose admin key
  const { adminKey: _, ...safe } = config;
  void _;
  return NextResponse.json({ success: true, data: safe });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const key = body.adminKey ?? req.headers.get("x-admin-key") ?? "";
  const config = await getConfig();

  if (!verifyAdminKey(key, config)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { adminKey: _ak, ...updates } = body;
  void _ak;
  const updated = await saveConfig(updates);
  const { adminKey: _k, ...safe } = updated;
  void _k;
  return NextResponse.json({ success: true, data: safe });
}
