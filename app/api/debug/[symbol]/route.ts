/**
 * Debug endpoint: returns raw tgju API response for a symbol.
 * Usage: GET /api/debug/geram18
 * Only active in development or when ADMIN_KEY is provided.
 */
import { NextRequest, NextResponse } from "next/server";
import { getConfig, verifyAdminKey } from "@/lib/config";

export const dynamic = "force-dynamic";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;

  const isDev = process.env.NODE_ENV === "development";
  const config = await getConfig();
  const key = req.headers.get("x-admin-key") ?? "";
  if (!isDev && !verifyAdminKey(key, config)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiUrl = `https://api.tgju.org/v1/market/indicator/summary-table-data/${symbol}`;
  const profileUrl = `https://tgju.org/profile/${symbol}/`;

  let apiResult: unknown = null;
  let apiError: string | null = null;
  let apiStatus: number | null = null;

  try {
    const res = await fetch(apiUrl, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    apiStatus = res.status;
    const text = await res.text();
    try { apiResult = JSON.parse(text); }
    catch { apiResult = text.slice(0, 500); }
  } catch (e) {
    apiError = String(e);
  }

  let htmlSnippet: string | null = null;
  let htmlError: string | null = null;

  try {
    const res = await fetch(profileUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const html = await res.text();
    // Return only a snippet to keep response small
    const bodyMatch = html.match(/<body[^>]*>([\s\S]{0,3000})/);
    htmlSnippet = bodyMatch ? bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, "").slice(0, 1500) : html.slice(0, 1500);
  } catch (e) {
    htmlError = String(e);
  }

  return NextResponse.json({
    symbol,
    api: { url: apiUrl, status: apiStatus, error: apiError, data: apiResult },
    html: { url: profileUrl, error: htmlError, snippet: htmlSnippet },
  }, { headers: { "Content-Type": "application/json" } });
}
