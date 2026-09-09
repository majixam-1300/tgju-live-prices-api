/**
 * Symbol catalog: discovery from tgju.org + seed list fallback.
 */
import * as cheerio from "cheerio";
import { getCatalogCache, setCatalogCache } from "./cache";
import { seedSymbols, SeedSymbol } from "@/data/seed-symbols";
import { addLog } from "./tgju";

export type { SeedSymbol as CatalogSymbol };

const TGJU_API_SUMMARY = "https://api.tgju.org/v1/market/summary";
const TGJU_API_INDICATOR = "https://api.tgju.org/v1/market/indicator/list";
const TGJU_HOME = "https://tgju.org";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ── Category mapping ──────────────────────────────────────────────────────────

const categoryMap: Record<string, SeedSymbol["category"]> = {
  طلا: "gold",
  gold: "gold",
  سکه: "coin",
  coin: "coin",
  ارز: "currency",
  currency: "currency",
  دلار: "currency",
  کریپتو: "crypto",
  crypto: "crypto",
  بورس: "stock",
  stock: "stock",
  فلزات: "commodity",
  metal: "commodity",
  نفت: "commodity",
  oil: "commodity",
  commodity: "commodity",
};

function detectCategory(text: string): SeedSymbol["category"] {
  for (const [key, cat] of Object.entries(categoryMap)) {
    if (text.toLowerCase().includes(key.toLowerCase())) return cat;
  }
  return "commodity";
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function tryFetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Strategy 1: JSON API ──────────────────────────────────────────────────────

function parseApiCatalog(data: unknown): SeedSymbol[] | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  const items = Array.isArray(d.data)
    ? d.data
    : Array.isArray(d.response)
    ? d.response
    : Array.isArray(d.indicators)
    ? d.indicators
    : null;

  if (!items || items.length === 0) return null;

  return items
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => {
      const id = String(item.id ?? item.slug ?? item.key ?? "");
      const label = String(item.title ?? item.name ?? item.label ?? id);
      const cat = detectCategory(String(item.category ?? item.group ?? label));
      const unit = String(item.unit ?? "تومان");
      return { id, label, category: cat, unit, source: "tgju" as const, available: true };
    })
    .filter((s) => s.id.length > 0);
}

// ── Strategy 2: HTML Scrape ───────────────────────────────────────────────────

async function scrapeHomepage(): Promise<SeedSymbol[]> {
  try {
    const res = await fetch(TGJU_HOME, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const symbols: SeedSymbol[] = [];

    $("a[href*='/profile/']").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      const match = href.match(/\/profile\/([^/]+)\/?/);
      if (!match) return;
      const id = match[1];
      if (id.length < 2) return;
      const label = $(el).text().trim() || id;
      // Try to infer category from surrounding context
      const parent = $(el).closest("[class*='gold'],[class*='currency'],[class*='coin'],[class*='crypto'],[class*='stock']").attr("class") ?? "";
      const cat = detectCategory(parent + " " + label);
      symbols.push({ id, label, category: cat, unit: "تومان", source: "tgju", available: true });
    });

    return symbols;
  } catch (err) {
    addLog("warn", `Homepage scrape failed: ${String(err)}`);
    return [];
  }
}

// ── Main catalog loader ───────────────────────────────────────────────────────

// Version stamp — bump this when seed changes to auto-invalidate cached catalog
const CATALOG_VERSION = "v2";

export async function loadCatalog(forceRefresh = false): Promise<SeedSymbol[]> {
  // Cache check — also verify version matches
  if (!forceRefresh) {
    const cached = await getCatalogCache<{ version?: string; items: SeedSymbol[] } | SeedSymbol[]>();
    if (cached) {
      // Handle both old (array) and new (versioned object) cache shapes
      const isVersioned = !Array.isArray(cached) && "version" in cached;
      if (isVersioned && (cached as { version: string; items: SeedSymbol[] }).version === CATALOG_VERSION) {
        return (cached as { version: string; items: SeedSymbol[] }).items;
      }
      if (Array.isArray(cached) && cached.length > 0) {
        // Old format — re-save with version and deduplicate
        const deduped = deduplicateCatalog(cached as SeedSymbol[]);
        await setCatalogCache({ version: CATALOG_VERSION, items: deduped });
        return deduped;
      }
    }
  }

  addLog("info", "Loading catalog...");

  // Strategy 1 – JSON APIs (structured, no duplicates)
  for (const url of [TGJU_API_SUMMARY, TGJU_API_INDICATOR]) {
    const data = await tryFetchJson(url);
    if (data) {
      const symbols = parseApiCatalog(data);
      if (symbols && symbols.length > 0) {
        addLog("info", `Catalog loaded from API (${symbols.length} items): ${url}`);
        const merged = mergeCatalogs(seedSymbols, symbols);
        await setCatalogCache({ version: CATALOG_VERSION, items: merged });
        return merged;
      }
    }
  }

  // Strategy 2 – Seed list (HTML scraping skipped: unreliable, causes duplicates)
  addLog("info", `Using seed catalog (${seedSymbols.length} symbols)`);
  await setCatalogCache({ version: CATALOG_VERSION, items: seedSymbols });
  return [...seedSymbols];
}

/** Remove duplicate entries from a catalog array (by id, then by normalized label). */
function deduplicateCatalog(items: SeedSymbol[]): SeedSymbol[] {
  const byId    = new Map<string, SeedSymbol>();
  const byLabel = new Map<string, SeedSymbol>();
  for (const s of items) {
    if (byId.has(s.id)) continue;
    const nl = normalizeLabel(s.label);
    if (byLabel.has(nl)) continue;
    byId.set(s.id, s);
    byLabel.set(nl, s);
  }
  return Array.from(byId.values());
}

function normalizeLabel(label: string): string {
  return label
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[‌‍]/g, "") // zero-width joiners
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .toLowerCase();
}

function mergeCatalogs(seed: SeedSymbol[], remote: SeedSymbol[]): SeedSymbol[] {
  // Seed is the authoritative source — index by both id and normalized label
  const byId    = new Map<string, SeedSymbol>();
  const byLabel = new Map<string, SeedSymbol>();

  for (const s of seed) {
    byId.set(s.id, s);
    byLabel.set(normalizeLabel(s.label), s);
  }

  // Only add remote items that have neither a matching id nor a matching label
  for (const s of remote) {
    if (byId.has(s.id)) continue;
    if (byLabel.has(normalizeLabel(s.label))) continue;
    byId.set(s.id, s);
    byLabel.set(normalizeLabel(s.label), s);
  }

  return Array.from(byId.values());
}

export function filterCatalog(
  catalog: SeedSymbol[],
  opts: { category?: string; search?: string; available?: boolean }
): SeedSymbol[] {
  let result = catalog;
  if (opts.category && opts.category !== "all") {
    result = result.filter((s) => s.category === opts.category);
  }
  if (opts.search) {
    const q = opts.search.toLowerCase();
    result = result.filter((s) => s.label.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  }
  if (opts.available !== undefined) {
    result = result.filter((s) => s.available === opts.available);
  }
  return result;
}
