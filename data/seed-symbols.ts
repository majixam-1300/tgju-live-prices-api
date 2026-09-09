export interface SeedSymbol {
  id: string;
  label: string;
  category: "gold" | "coin" | "currency" | "crypto" | "stock" | "commodity";
  unit: string;
  source: "tgju";
  available: boolean;
}

export const seedSymbols: SeedSymbol[] = [
  // ── طلا ──────────────────────────────────────────────
  { id: "geram18", label: "طلای ۱۸ عیار", category: "gold", unit: "تومان", source: "tgju", available: true },
  { id: "geram24", label: "طلای ۲۴ عیار", category: "gold", unit: "تومان", source: "tgju", available: true },
  { id: "gold_global", label: "طلای جهانی", category: "gold", unit: "دلار", source: "tgju", available: true },
  { id: "geram1", label: "طلای ۱ گرمی", category: "gold", unit: "تومان", source: "tgju", available: true },
  { id: "mesghal", label: "مثقال طلا", category: "gold", unit: "تومان", source: "tgju", available: true },
  { id: "onz", label: "اونس طلا", category: "gold", unit: "تومان", source: "tgju", available: true },

  // ── سکه ──────────────────────────────────────────────
  { id: "sekeb", label: "سکه امامی", category: "coin", unit: "تومان", source: "tgju", available: true },
  { id: "sekeb_old", label: "سکه بهار آزادی", category: "coin", unit: "تومان", source: "tgju", available: true },
  { id: "rob_sekkeh", label: "ربع سکه", category: "coin", unit: "تومان", source: "tgju", available: true },
  { id: "nim_sekeh", label: "نیم سکه", category: "coin", unit: "تومان", source: "tgju", available: true },
  { id: "gerami", label: "سکه گرمی", category: "coin", unit: "تومان", source: "tgju", available: true },

  // ── ارز ──────────────────────────────────────────────
  { id: "price_dollar_rl", label: "دلار آمریکا", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_eur", label: "یورو", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_gbp", label: "پوند انگلیس", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_aed", label: "درهم امارات", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_try", label: "لیر ترکیه", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_cny", label: "یوان چین", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_jpy", label: "ین ژاپن", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_chf", label: "فرانک سوئیس", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_cad", label: "دلار کانادا", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_aud", label: "دلار استرالیا", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_kwd", label: "دینار کویت", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_iqd", label: "دینار عراق", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_sgd", label: "دلار سنگاپور", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_hkd", label: "دلار هنگ‌کنگ", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_rub", label: "روبل روسیه", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_inr", label: "روپیه هند", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_pkr", label: "روپیه پاکستان", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_afn", label: "افغانی", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_sar", label: "ریال عربستان", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_nok", label: "کرون نروژ", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_sek", label: "کرون سوئد", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_dkk", label: "کرون دانمارک", category: "currency", unit: "تومان", source: "tgju", available: true },

  // ── کریپتو ───────────────────────────────────────────
  { id: "crypto-bitcoin", label: "بیت‌کوین", category: "crypto", unit: "دلار", source: "tgju", available: true },
  { id: "crypto-ethereum", label: "اتریوم", category: "crypto", unit: "دلار", source: "tgju", available: true },
  { id: "crypto-tether", label: "تتر", category: "crypto", unit: "دلار", source: "tgju", available: true },
  { id: "crypto-bnb", label: "بایننس کوین", category: "crypto", unit: "دلار", source: "tgju", available: true },
  { id: "crypto-xrp", label: "ریپل", category: "crypto", unit: "دلار", source: "tgju", available: true },
  { id: "crypto-solana", label: "سولانا", category: "crypto", unit: "دلار", source: "tgju", available: true },
  { id: "crypto-cardano", label: "کاردانو", category: "crypto", unit: "دلار", source: "tgju", available: true },
  { id: "crypto-dogecoin", label: "دوج‌کوین", category: "crypto", unit: "دلار", source: "tgju", available: true },
  { id: "crypto-polkadot", label: "پولکادات", category: "crypto", unit: "دلار", source: "tgju", available: true },
  { id: "crypto-avalanche", label: "اوالانچ", category: "crypto", unit: "دلار", source: "tgju", available: true },
  { id: "crypto-litecoin", label: "لایت‌کوین", category: "crypto", unit: "دلار", source: "tgju", available: true },
  { id: "crypto-chainlink", label: "چین‌لینک", category: "crypto", unit: "دلار", source: "tgju", available: true },
  { id: "crypto-uniswap", label: "یونی‌سواپ", category: "crypto", unit: "دلار", source: "tgju", available: true },
  { id: "crypto-shiba", label: "شیبا اینو", category: "crypto", unit: "دلار", source: "tgju", available: true },
  { id: "crypto-ton", label: "تون‌کوین", category: "crypto", unit: "دلار", source: "tgju", available: true },
  { id: "crypto-tron", label: "ترون", category: "crypto", unit: "دلار", source: "tgju", available: true },
  { id: "crypto-near", label: "نییر پروتکل", category: "crypto", unit: "دلار", source: "tgju", available: true },
  { id: "crypto-atom", label: "کازموس", category: "crypto", unit: "دلار", source: "tgju", available: true },
  { id: "crypto-usdc", label: "یو اس دی سی", category: "crypto", unit: "دلار", source: "tgju", available: true },

  // ── نفت و انرژی ──────────────────────────────────────
  { id: "oil-brent", label: "نفت برنت", category: "commodity", unit: "دلار", source: "tgju", available: true },
  { id: "oil-wti", label: "نفت وست تگزاس", category: "commodity", unit: "دلار", source: "tgju", available: true },
  { id: "natural_gas", label: "گاز طبیعی", category: "commodity", unit: "دلار", source: "tgju", available: true },

  // ── فلزات ────────────────────────────────────────────
  { id: "silver", label: "نقره جهانی", category: "commodity", unit: "دلار", source: "tgju", available: true },
  { id: "platinum", label: "پلاتین", category: "commodity", unit: "دلار", source: "tgju", available: true },
  { id: "palladium", label: "پالادیوم", category: "commodity", unit: "دلار", source: "tgju", available: true },
  { id: "copper", label: "مس جهانی", category: "commodity", unit: "دلار", source: "tgju", available: true },
  { id: "steel", label: "فولاد", category: "commodity", unit: "دلار", source: "tgju", available: true },
  { id: "aluminium", label: "آلومینیوم", category: "commodity", unit: "دلار", source: "tgju", available: true },
  { id: "zinc", label: "روی (زینک)", category: "commodity", unit: "دلار", source: "tgju", available: true },
  { id: "nickel", label: "نیکل", category: "commodity", unit: "دلار", source: "tgju", available: true },

  // ── شاخص بورس ────────────────────────────────────────
  { id: "tse-index", label: "شاخص کل بورس", category: "stock", unit: "واحد", source: "tgju", available: true },
  { id: "tse-index-eq", label: "شاخص هم‌وزن", category: "stock", unit: "واحد", source: "tgju", available: true },
  { id: "tse-index-fara", label: "شاخص فرابورس", category: "stock", unit: "واحد", source: "tgju", available: true },
  { id: "crypto-bitcoin-toman", label: "بیت‌کوین (تومان)", category: "crypto", unit: "تومان", source: "tgju", available: true },
  { id: "crypto-ethereum-toman", label: "اتریوم (تومان)", category: "crypto", unit: "تومان", source: "tgju", available: true },
  { id: "crypto-tether-toman", label: "تتر (تومان)", category: "crypto", unit: "تومان", source: "tgju", available: true },

  // ── سایر ─────────────────────────────────────────────
  { id: "mablex", label: "مابلکس (آزاد)", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_dollar_sana", label: "دلار سنا", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "price_dollar_nima", label: "دلار نیما", category: "currency", unit: "تومان", source: "tgju", available: true },
  { id: "wheat", label: "گندم جهانی", category: "commodity", unit: "دلار", source: "tgju", available: true },
  { id: "corn", label: "ذرت جهانی", category: "commodity", unit: "دلار", source: "tgju", available: true },
];

// ── لیست پیش‌فرض نمادها (بر اساس انتخاب کاربر) ─────────────────────────────
// برای اضافه کردن: تیک بزنید در تب «نمادها» و ذخیره کنید
// برای بازگشت به این پیش‌فرض: دکمه «↩ پیش‌فرض» در تب نمادها
export const defaultSelectedSymbols = [
  "geram18",           // طلای ۱۸ عیار       — tgju: geram18
  "geram24",           // طلای ۲۴ عیار       — tgju: geram24
  "gold_global",       // اونس/طلای جهانی USD — tgju: ons (~4400$)
  "mesghal",           // مثقال طلا           — tgju: mesghal
  "sekeb",             // سکه امامی           — tgju: sekee (alias!)
  "sekeb_old",         // سکه بهار آزادی      — tgju: sekeb (alias!)
  "rob_sekkeh",        // ربع سکه             — tgju: rob
  "nim_sekeh",         // نیم سکه             — tgju: nim
  "gerami",            // سکه گرمی            — tgju: gerami
  "price_dollar_rl",   // دلار آمریکا         — tgju: price_dollar_rl
  "crypto-tether-toman", // تتر (تومان)      — tgju: crypto-tether (irr_price)
];
