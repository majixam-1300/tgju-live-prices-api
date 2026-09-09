/**
 * Demo/mock prices for development when tgju.org is unreachable.
 * Activated by setting DEMO_MODE=true in .env.local
 */
import { CachedPrice } from "./cache";
import { formatPersianNumber, formatPersianChange } from "./normalize";

function make(label: string, unit: string, value: number, change: number): CachedPrice {
  return {
    value,
    formatted: formatPersianNumber(value),
    unit,
    label,
    change,
    changeFormatted: formatPersianChange(change),
    stale: false,
    suspicious: false,
    error: false,
    updatedAt: new Date().toISOString(),
    cachedAt: new Date().toISOString(),
    ttlSeconds: 30,
  };
}

/**
 * Simulates the tiny tick-by-tick fluctuation a live price feed would show.
 * The base values in DEMO_PRICES are fixed realistic prices; this adds ±0.2%
 * movement so the UI doesn't look frozen — identical to what a real feed does
 * between two consecutive fetches in normal market conditions.
 * NO fabricated prices — only symbols explicitly listed in DEMO_PRICES are used.
 */
function jitter(v: number): number {
  const factor = 1 + (Math.random() - 0.5) * 0.004; // ±0.2%
  return v < 10
    ? parseFloat((v * factor).toFixed(6))
    : Math.round(v * factor);
}

export const DEMO_PRICES: Record<string, CachedPrice> = {
  // ── طلا — مقادیر واقعی از tgju.org (ریال ÷۱۰ = تومان) ─────────────────────
  // تاریخ آخرین بروزرسانی demo prices: ۱۴۰۵/۰۶/۱۷ (۸ سپتامبر ۲۰۲۶)
  geram18:               make("طلای ۱۸ عیار",        "تومان",  23_061_300,     +2.43),
  geram24:               make("طلای ۲۴ عیار",        "تومان",  30_748_100,     +2.43),
  geram1:                make("طلای ۱ گرمی",         "تومان",  2_940_000,      +2.40),
  mesghal:               make("مثقال طلا",            "تومان",  100_855_000,    +2.43),
  onz:                   make("اونس طلا",             "تومان",  726_630_000,    +0.95), // xau=$3250 × 223265
  gold_global:           make("طلای جهانی",           "دلار",   3_250.79,       +0.95), // xau USD

  // ── سکه — مقادیر واقعی از tgju.org ─────────────────────────────────────────
  sekeb:                 make("سکه امامی",            "تومان",  226_130_000,    +2.23),
  sekeb_old:             make("سکه بهار آزادی",      "تومان",  230_010_000,    +2.17), // sekee API
  rob_sekkeh:            make("ربع سکه",              "تومان",  61_500_000,     +4.07), // rob API
  nim_sekeh:             make("نیم سکه",              "تومان",  116_000_000,    +2.15), // nim API
  gerami:                make("سکه گرمی",             "تومان",  34_000_000,     +2.30),

  // ── ارز — مقادیر واقعی از tgju.org (ریال ÷۱۰ = تومان) ──────────────────────
  price_dollar_rl:       make("دلار آمریکا",          "تومان",  223_265,        +2.07),
  price_dollar_sana:     make("دلار سنا",             "تومان",  220_000,        +0.12),
  price_dollar_nima:     make("دلار نیما",            "تومان",  218_000,        +0.08),
  price_eur:             make("یورو",                 "تومان",  246_000,        -0.32),
  price_gbp:             make("پوند انگلیس",          "تومان",  285_000,        -0.18),
  price_aed:             make("درهم امارات",          "تومان",  60_800,         +0.20),
  price_try:             make("لیر ترکیه",            "تومان",  6_500,          -0.10),
  price_cny:             make("یوان چین",             "تومان",  30_800,         +0.05),
  price_jpy:             make("ین ژاپن",              "تومان",  1_480,          -0.22),
  price_chf:             make("فرانک سوئیس",          "تومان",  252_000,        +0.30),
  price_cad:             make("دلار کانادا",          "تومان",  164_000,        -0.15),
  price_aud:             make("دلار استرالیا",        "تومان",  148_000,        -0.25),
  price_kwd:             make("دینار کویت",           "تومان",  605_130,        +0.18), // 6,051,300 rials /10
  price_iqd:             make("دینار عراق",           "تومان",  170,            -0.05),
  price_sgd:             make("دلار سنگاپور",         "تومان",  168_000,        +0.10),
  price_hkd:             make("دلار هنگ‌کنگ",         "تومان",  28_700,         +0.02),
  price_rub:             make("روبل روسیه",           "تومان",  2_396,          -0.40), // 23,960 rials /10
  price_inr:             make("روپیه هند",            "تومان",  2_670,          +0.05),
  price_pkr:             make("روپیه پاکستان",        "تومان",  800,            -0.15),
  price_afn:             make("افغانی",               "تومان",  3_250,          +0.03),
  price_sar:             make("ریال عربستان",         "تومان",  59_500,         +0.10),
  price_nok:             make("کرون نروژ",            "تومان",  20_900,         -0.20),
  price_sek:             make("کرون سوئد",            "تومان",  21_400,         -0.18),
  price_dkk:             make("کرون دانمارک",         "تومان",  32_900,         -0.22),
  mablex:                make("مابلکس (آزاد)",        "تومان",  224_000,        +0.20),

  // ── کریپتو — به دلار ────────────────────────────────────────────────────────
  "crypto-bitcoin":      make("بیت‌کوین",             "دلار",   97_500,         +2.10),
  "crypto-ethereum":     make("اتریوم",               "دلار",   3_450,          +1.75),
  "crypto-tether":       make("تتر",                  "دلار",   1,              +0.01),
  "crypto-bnb":          make("بایننس کوین",          "دلار",   680,            +1.20),
  "crypto-xrp":          make("ریپل",                 "دلار",   2.18,           +0.80),
  "crypto-solana":       make("سولانا",               "دلار",   185,            +3.20),
  "crypto-cardano":      make("کاردانو",              "دلار",   0.78,           +1.10),
  "crypto-dogecoin":     make("دوج‌کوین",             "دلار",   0.32,           +1.50),
  "crypto-polkadot":     make("پولکادات",             "دلار",   5.8,            +0.90),
  "crypto-avalanche":    make("اوالانچ",              "دلار",   28,             +2.40),
  "crypto-litecoin":     make("لایت‌کوین",            "دلار",   108,            +0.60),
  "crypto-chainlink":    make("چین‌لینک",             "دلار",   18.5,           +1.80),
  "crypto-uniswap":      make("یونی‌سواپ",            "دلار",   10.2,           +1.30),
  "crypto-shiba":        make("شیبا اینو",            "دلار",   0.000023,       +2.20),
  "crypto-ton":          make("تون‌کوین",             "دلار",   3.5,            +1.60),
  "crypto-tron":         make("ترون",                 "دلار",   0.23,           +0.70),
  "crypto-near":         make("نییر پروتکل",          "دلار",   4.1,            +1.40),
  "crypto-atom":         make("کازموس",               "دلار",   5.9,            +0.50),
  "crypto-usdc":         make("یو اس دی سی",          "دلار",   1,              0.00),
  // کریپتو به تومان = قیمت دلاری × نرخ دلار (۲۲۳٬۲۶۵ تومان/دلار)
  "crypto-bitcoin-toman":make("بیت‌کوین (تومان)",     "تومان",  21_768_337_500, +2.10),
  "crypto-ethereum-toman":make("اتریوم (تومان)",      "تومان",  769_264_500,    +1.75),
  "crypto-tether-toman": make("تتر (تومان)",          "تومان",  223_265,        +0.01), // = price_dollar_rl

  // ── نفت و انرژی — به دلار ────────────────────────────────────────────────────
  "oil-brent":           make("نفت برنت",             "دلار",   83,             -0.65),
  "oil-wti":             make("نفت وست تگزاس",        "دلار",   79,             -0.72),
  natural_gas:           make("گاز طبیعی",            "دلار",   2.4,            +0.50),

  // ── فلزات — به دلار ─────────────────────────────────────────────────────────
  silver:                make("نقره جهانی",           "دلار",   27,             +0.44),
  platinum:              make("پلاتین",               "دلار",   980,            +0.30),
  palladium:             make("پالادیوم",             "دلار",   1_020,          -0.80),
  copper:                make("مس جهانی",             "دلار",   4.5,            +0.20),
  steel:                 make("فولاد",                "دلار",   680,            -0.15),
  aluminium:             make("آلومینیوم",            "دلار",   2_400,          +0.35),
  zinc:                  make("روی (زینک)",           "دلار",   2_850,          +0.25),
  nickel:                make("نیکل",                 "دلار",   18_500,         -0.40),
  wheat:                 make("گندم جهانی",           "دلار",   540,            -0.30),
  corn:                  make("ذرت جهانی",            "دلار",   460,            -0.20),

  // ── بورس — به واحد ──────────────────────────────────────────────────────────
  "tse-index":           make("شاخص کل بورس",        "واحد",   3_450_000,      -0.22),
  "tse-index-eq":        make("شاخص هم‌وزن",         "واحد",   1_240_000,      -0.35),
  "tse-index-fara":      make("شاخص فرابورس",        "واحد",   35_800,         -0.18),
};

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

export function getDemoPrice(symbolId: string, label: string, unit: string): CachedPrice {
  const base = DEMO_PRICES[symbolId];
  const now = new Date().toISOString();

  if (base) {
    // Apply tiny jitter (±0.2%) to simulate live movement — still realistic
    const jittered = jitter(base.value);
    return {
      ...base,
      value: jittered,
      formatted: formatPersianNumber(jittered),
      updatedAt: now,
      cachedAt: now,
    };
  }

  // Symbol has no demo data — return error, never fabricate a price
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
    updatedAt: now,
    cachedAt: now,
    ttlSeconds: 30,
  };
}
