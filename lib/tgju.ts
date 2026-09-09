/**
 * tgju.org price fetcher with full fallback chain.
 */
import * as cheerio from "cheerio";
import {
  getPriceCache,
  setPriceCache,
  getLastValue,
  setLastValue,
  CachedPrice,
} from "./cache";
import {
  normalizeToToman,
  formatPersianNumber,
  formatPersianChange,
  parseRawPrice,
  parseChangePercent,
  sanityCheck,
} from "./normalize";
import { getConfig } from "./config";
import { isDemoMode, getDemoPrice } from "./mock-prices";

// Live profile endpoint: returns real-time price + today's change
const TGJU_API_BASE =
  "https://api.tgju.org/v1/market/indicator/profile";
// Historical OHLC (fallback if profile fails)
const TGJU_OHLC_BASE =
  "https://api.tgju.org/v1/market/indicator/summary-table-data";
const TGJU_PROFILE_BASE = "https://www.tgju.org/profile";

/**
 * tgju.org uses different slug identifiers than our internal symbol IDs.
 * Map: internalId → tgju API slug.
 */
const SYMBOL_API_ALIAS: Record<string, string> = {
  nim_sekeh:            "nim",           // نیم سکه
  rob_sekkeh:           "rob",           // ربع سکه
  // tgju slugs: sekeb=بهار آزادی, sekee=امامی (opposite of their names!)
  sekeb:                "sekee",         // سکه امامی → tgju slug is "sekee"
  sekeb_old:            "sekeb",         // سکه بهار آزادی → tgju slug is "sekeb"
  gold_global:          "ons",           // اونس/طلای جهانی (USD) → tgju slug "ons"
  "crypto-tether-toman": "crypto-tether", // تتر (تومان) → read irr_price field
  onz:                  "gold_futures",  // اونس طلا به تومان ≈ قرارداد آتی (مستقیم تومان)
};
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 8000;

// ── Simple logger ─────────────────────────────────────────────────────────────
type LogLevel = "info" | "warn" | "error";
interface LogEntry {
  ts: string;
  level: LogLevel;
  msg: string;
}
const recentLogs: LogEntry[] = [];

export function addLog(level: LogLevel, msg: string): void {
  recentLogs.unshift({ ts: new Date().toISOString(), level, msg });
  if (recentLogs.length > 100) recentLogs.pop();
  if (level === "error") console.error(`[tgju] ${msg}`);
  else console.log(`[tgju][${level}] ${msg}`);
}

export function getRecentLogs(n = 20): LogEntry[] {
  return recentLogs.slice(0, n);
}

// ── Fetch with timeout + retry ────────────────────────────────────────────────

async function fetchWithRetry(
  url: string,
  retries = 2,
  delaysMs = [500, 1500]
): Promise<Response> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json, text/html, */*",
        "Accept-Language": "fa,en;q=0.9",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } catch (err) {
    if (retries <= 0) throw err;
    const delay = delaysMs[0] ?? 500;
    await new Promise((r) => setTimeout(r, delay));
    return fetchWithRetry(url, retries - 1, delaysMs.slice(1));
  }
}

// ── API response parser — profile endpoint (live prices) ─────────────────────
//
// GET https://api.tgju.org/v1/market/indicator/profile/{symbol}
//
// Returns:
//   response.summary.price.plain          → current live price (RIALS for تومان assets)
//   response.summary.day_tolerance_dp.plain  → change magnitude (always positive)
//   response.summary.day_tolerance_dp.value  → HTML with class "high"/"low" = sign
//   response.info.datetime               → "YYYY-MM-DD HH:MM:SS"

// Symbols where we use irr_price (rial price) from the API instead of the default USD price
const SYMBOLS_USE_IRR_PRICE = new Set([
  "crypto-tether-toman", // USDT: price field = 1 USD, irr_price = actual rial price in Iran market
]);

function parseProfileResponse(
  data: unknown,
  symbolId: string,
  unit: string
): { value: number; change: number; updatedAt: string } | null {
  if (!data || typeof data !== "object") return null;

  const resp = (data as Record<string, unknown>).response as Record<string, unknown> | undefined;
  if (!resp) return null;

  const summary = resp.summary as Record<string, Record<string, unknown>> | undefined;
  if (!summary) return null;

  // For crypto symbols priced in تومان, use irr_price (rial market price in Iran)
  // e.g. crypto-tether-toman: summary.price.plain = 1 (USD), irr_price = 2355600 (ریال)
  let rawPrice: unknown;
  if (SYMBOLS_USE_IRR_PRICE.has(symbolId)) {
    rawPrice = summary.irr_price?.plain ?? summary.irr_price;
  } else {
    rawPrice = summary.price?.plain ?? summary.price?.value;
  }

  const value = parseRawPrice(rawPrice as string | number);
  if (!value || value <= 0) return null;

  const normalized = normalizeToToman(value, symbolId, unit);

  // Change %: prefer today's intraday change, fallback to yesterday's change
  const todayMag = summary.day_tolerance_dp?.plain;
  const todayHtml = String(summary.day_tolerance_dp?.value ?? "");
  const yesterdayMag = summary.yesterday_dp?.plain;
  const yesterdayHtml = String(summary.yesterday_dp?.value ?? "");

  const hasTodayChange = todayMag !== null && todayMag !== undefined &&
    todayMag !== "" && todayMag !== "-" && String(todayMag) !== "0";

  const activeMag = hasTodayChange ? todayMag : yesterdayMag;
  const activeHtml = hasTodayChange ? todayHtml : yesterdayHtml;

  const isDown = /class=["']low["']/.test(activeHtml);
  let change: number;
  if (typeof activeMag === "number" && activeMag !== 0) {
    change = isDown ? -activeMag : activeMag;
  } else {
    change = parseChangePercent(String(activeMag ?? ""));
    if (change !== 0 && isDown && change > 0) change = -change;
  }

  // Timestamp from info.datetime
  const info = resp.info as Record<string, unknown> | undefined;
  const datetime = String(info?.datetime ?? "");
  let updatedAt: string;
  try {
    updatedAt = datetime.length >= 10
      ? new Date(datetime).toISOString()
      : new Date().toISOString();
  } catch {
    updatedAt = new Date().toISOString();
  }

  return { value: normalized, change, updatedAt };
}

// ── OHLC fallback parser — summary-table-data endpoint ───────────────────────
//
// GET https://api.tgju.org/v1/market/indicator/summary-table-data/{symbol}
// Returns DataTables format; most-recent row = data[0]
// Columns: [close, open, high, low, <span>change</span>, <span>pct%</span>, date, jalali]

function parseOhlcResponse(
  data: unknown,
  symbolId: string,
  unit: string
): { value: number; change: number; updatedAt: string } | null {
  if (!data || typeof data !== "object") return null;

  const rows = (data as Record<string, unknown>).data;
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const row = rows[0] as string[];
  if (!Array.isArray(row) || row.length < 6) return null;

  const value = parseRawPrice(row[0]);
  if (!value || value <= 0) return null;

  const normalized = normalizeToToman(value, symbolId, unit);

  const rawPct = String(row[5] ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/[^0-9.\-+]/g, "")
    .trim();
  const change = parseChangePercent(rawPct);

  return { value: normalized, change, updatedAt: new Date().toISOString() };
}

// ── HTML fallback parser ──────────────────────────────────────────────────────

async function fetchFromHtml(
  symbol: string,
  unit = "تومان"
): Promise<{ value: number; change: number; updatedAt: string } | null> {
  const url = `${TGJU_PROFILE_BASE}/${symbol}/`;
  try {
    const res = await fetchWithRetry(url, 1, [1000]);
    const html = await res.text();
    const $ = cheerio.load(html);

    // Ordered list of selectors to try
    const selectors = [
      ".last-price-value",
      ".market-profile-data-table td:nth-child(2)",
      "td[data-col='price']",
      "[data-price]",
      ".market-table-price",
      ".price-value",
      "td.text-left:first",
      "span[class*='price']",
      "div[class*='price'] span",
      "table tr:first-child td:nth-child(2)",
    ];

    let rawPrice: string | null = null;
    for (const sel of selectors) {
      const text = $(sel).first().text().trim();
      if (text && /[\d,۰-۹]{3,}/.test(text)) {
        rawPrice = text;
        break;
      }
    }

    // Fallback to og:description
    if (!rawPrice) {
      const metaDesc =
        $("meta[property='og:description']").attr("content") ??
        $("meta[name='description']").attr("content") ??
        "";
      const match = metaDesc.match(/[\d,۰-۹]{4,}/);
      if (match) rawPrice = match[0];
    }

    const value = parseRawPrice(rawPrice ?? "");
    if (!value) {
      addLog("warn", `HTML scraper: no price found for ${symbol} (url: ${url})`);
      return null;
    }

    const changeText = $(
      ".price-change, .change-percent, [class*='change']"
    )
      .first()
      .text()
      .trim();
    const change = parseChangePercent(changeText);

    return {
      value: normalizeToToman(value, symbol, unit ?? "تومان"),
      change,
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    addLog("warn", `HTML fallback failed for ${symbol}: ${String(err)}`);
    return null;
  }
}

// ── Main fetch function ───────────────────────────────────────────────────────

export async function fetchSymbolPrice(
  symbol: string,
  label: string,
  unit: string,
  forceRefresh = false
): Promise<CachedPrice> {
  // ── Demo mode shortcut ─────────────────────────────────────────────────────
  if (isDemoMode()) {
    return getDemoPrice(symbol, label, unit);
  }

  const config = await getConfig();
  const ttl = config.ttlSeconds;

  // Step 1 – Cache hit
  if (!forceRefresh) {
    const cached = await getPriceCache(symbol);
    if (cached) {
      return { ...cached, stale: false };
    }
  }

  // Resolve the tgju API slug (may differ from our internal symbol ID)
  const apiSlug = SYMBOL_API_ALIAS[symbol] ?? symbol;

  // Step 2a – Live profile endpoint (real-time price)
  let result: { value: number; change: number; updatedAt: string } | null = null;

  try {
    const url = `${TGJU_API_BASE}/${apiSlug}`;
    const res = await fetchWithRetry(url, 2, [500, 1500]);
    const raw = await res.text();
    const data = JSON.parse(raw);
    result = parseProfileResponse(data, symbol, unit);
    if (result) addLog("info", `Profile ok: ${symbol}(${apiSlug}) = ${result.value}`);
    else addLog("warn", `Profile parse fail: ${symbol}(${apiSlug}), raw: ${raw.slice(0, 200)}`);
  } catch (err) {
    addLog("warn", `Profile failed: ${symbol}(${apiSlug}): ${String(err)}`);
  }

  // Step 2b – OHLC fallback (last known price if live endpoint fails)
  if (!result) {
    try {
      const url = `${TGJU_OHLC_BASE}/${apiSlug}`;
      const res = await fetchWithRetry(url, 1, [1000]);
      const raw = await res.text();
      const data = JSON.parse(raw);
      result = parseOhlcResponse(data, symbol, unit);
      if (result) addLog("info", `OHLC ok: ${symbol}(${apiSlug}) = ${result.value}`);
    } catch (err) {
      addLog("warn", `OHLC failed: ${symbol}(${apiSlug}): ${String(err)}`);
    }
  }

  // Step 3 – HTML fallback (scrape profile page)
  if (!result) {
    result = await fetchFromHtml(apiSlug, unit);
    if (result) addLog("info", `HTML ok: ${symbol}(${apiSlug}) = ${result.value}`);
  }

  // Step 4 – Stale cache
  if (!result) {
    const stale = await getPriceCache(symbol);
    if (stale) {
      addLog("warn", `Using stale cache for ${symbol}`);
      const staleResult: CachedPrice = { ...stale, stale: true };
      await setPriceCache(symbol, staleResult, ttl);
      return staleResult;
    }
  }

  // Step 5 – Error
  if (!result) {
    addLog("error", `All sources failed for ${symbol}`);
    return {
      value: 0,
      formatted: "—",
      unit,
      label,
      change: 0,
      changeFormatted: "—",
      stale: false,
      suspicious: false,
      error: true,
      updatedAt: new Date().toISOString(),
      cachedAt: new Date().toISOString(),
      ttlSeconds: ttl,
    };
  }

  // Sanity check
  let suspicious = false;
  if (config.sanityCheckEnabled) {
    const lastValue = await getLastValue(symbol);
    const check = sanityCheck(result.value, lastValue, config.sanityCheckThreshold);
    if (!check.ok) {
      addLog("warn", `Sanity check failed for ${symbol}: ${check.reason}`);
      suspicious = true;
      if (lastValue && lastValue > 0) result.value = lastValue;
    } else {
      await setLastValue(symbol, result.value);
    }
  }

  const price: CachedPrice = {
    value: result.value,
    formatted: formatPersianNumber(result.value),
    unit,
    label,
    change: result.change,
    changeFormatted: formatPersianChange(result.change),
    stale: false,
    suspicious,
    error: false,
    updatedAt: result.updatedAt,
    cachedAt: new Date().toISOString(),
    ttlSeconds: ttl,
  };

  await setPriceCache(symbol, price, ttl);
  return price;
}

// ── Batch fetch ───────────────────────────────────────────────────────────────

export interface SymbolInput {
  id: string;
  label: string;
  unit: string;
}

export async function fetchMultiplePrices(
  symbols: SymbolInput[],
  forceRefresh = false
): Promise<Record<string, CachedPrice>> {
  const results = await Promise.allSettled(
    symbols.map((s) => fetchSymbolPrice(s.id, s.label, s.unit, forceRefresh))
  );

  const out: Record<string, CachedPrice> = {};
  for (let i = 0; i < symbols.length; i++) {
    const r = results[i];
    out[symbols[i].id] =
      r.status === "fulfilled"
        ? r.value
        : {
            value: 0,
            formatted: "—",
            unit: symbols[i].unit,
            label: symbols[i].label,
            change: 0,
            changeFormatted: "—",
            stale: false,
            suspicious: false,
            error: true,
            updatedAt: new Date().toISOString(),
            cachedAt: new Date().toISOString(),
            ttlSeconds: 30,
          };
  }
  return out;
}
