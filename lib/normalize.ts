/**
 * Normalize prices: Rial → Toman conversion, sanity checks, formatting.
 */

/**
 * Symbols whose tgju.org profile endpoint returns values already in TOMAN
 * (not rials). Exchange-traded instruments (futures, etc.) use toman directly.
 */
const SYMBOLS_ALREADY_IN_TOMAN = new Set([
  "onz",          // mapped to gold_futures (Tehran BME contract, priced in toman)
]);

/**
 * tgju.org API always returns prices in RIALS for OTC/physical assets.
 * Exchange-traded instruments return TOMAN directly.
 * This function converts rials → toman (÷10) where needed.
 *
 * For USD-denominated symbols (crypto, oil, metals) no conversion is needed.
 */
export function normalizeToToman(value: number, symbolId: string, unit = "تومان"): number {
  if (unit !== "تومان") return value; // USD/EUR denominated — no conversion

  // Some symbols (exchange-traded) already return toman
  if (SYMBOLS_ALREADY_IN_TOMAN.has(symbolId)) return Math.round(value);

  // OTC/physical market assets from tgju return RIALS — divide by 10 to get TOMAN.
  if (value >= 1_000) {
    return Math.round(value / 10);
  }
  return value;
}

/**
 * Persian number formatter (adds commas and converts digits to Persian).
 */
export function formatPersianNumber(value: number): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const str = value.toLocaleString("en-US");
  // Replace ASCII comma with Persian thousands separator ٬ and digits with Persian
  return str
    .replace(/,/g, "٬")
    .replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

/**
 * Format percentage change with sign and Persian digits.
 */
export function formatPersianChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  const abs = Math.abs(change).toFixed(2);
  const persian = abs.replace(/\d/g, (d) => ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"][parseInt(d)]);
  const persianSign = change >= 0 ? "\u200E+" : "\u200E-";
  return `${persianSign}${persian}٪`;
}

/**
 * Sanity check: verify the new price is plausible compared to the last known value.
 * Returns { ok, reason } where ok=false means the value is suspicious.
 */
export function sanityCheck(
  newValue: number,
  lastValue: number | null,
  threshold: number = 25
): { ok: boolean; reason?: string } {
  if (newValue <= 0) {
    return { ok: false, reason: "non-positive value" };
  }
  if (lastValue === null || lastValue <= 0) {
    return { ok: true };
  }
  const pct = Math.abs((newValue - lastValue) / lastValue) * 100;
  if (pct > threshold) {
    return {
      ok: false,
      reason: `price changed ${pct.toFixed(1)}% (threshold ${threshold}%)`,
    };
  }
  return { ok: true };
}

/**
 * Parse a raw price string coming from tgju (may contain commas, Persian digits, etc.)
 */
export function parseRawPrice(raw: string | number): number | null {
  if (typeof raw === "number") return (isFinite(raw) && raw > 0) ? raw : null;
  if (!raw) return null;
  // Convert Persian/Arabic digits to Latin and strip separators
  const normalized = raw
    .toString()
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[,،٬]/g, "")   // strip commas and Persian thousands separators
    .trim();
  const num = parseFloat(normalized);
  return isFinite(num) && num > 0 ? num : null;
}

/**
 * Parse change percentage from tgju response.
 */
export function parseChangePercent(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined) return 0;
  const parsed = parseRawPrice(raw);
  return parsed ?? 0;
}
