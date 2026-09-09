<div align="center">

<h1>📈 TGJU Live Prices API</h1>

<p>
  <strong>Real-time Iranian financial market data — gold, coins, currencies, crypto & more</strong><br/>
  <sub>قیمت لحظه‌ای بازارهای مالی ایران از tgju.org — طلا، سکه، ارز، کریپتو و بیشتر</sub>
</p>

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sabernoori/tgju-live-prices-api&env=ADMIN_KEY&envDescription=Set%20a%20secure%20admin%20password%20for%20the%20dashboard&envLink=https://github.com/sabernoori/tgju-live-prices-api%23environment-variables&project-name=tgju-live-prices&repository-name=tgju-live-prices)

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![tgju.org](https://img.shields.io/badge/data-tgju.org-green)](https://tgju.org)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📡 **Live Prices** | Real-time data from [tgju.org](https://tgju.org) — Iran's leading financial data platform |
| 🔄 **3-Layer Fallback** | JSON API → HTML scrape → stale cache — always returns a value |
| 🗂️ **80+ Symbols** | Gold, coins, currencies (30+), crypto, stock index, commodities |
| ⚡ **Redis Cache** | [Upstash Redis](https://upstash.com) or in-memory fallback — zero config needed |
| 📺 **SSE Stream** | Server-Sent Events for real-time dashboard updates |
| 🛡️ **Rate Limiting** | Sliding window per IP — configurable |
| ✅ **Sanity Checks** | Flags suspicious price spikes |
| 🖥️ **Admin Dashboard** | Symbol selector, settings, live preview, system logs |
| 🚀 **Vercel Ready** | Deploy in one click — works on free tier |

---

## 🚀 Quick Start

```bash
git clone https://github.com/sabernoori/tgju-live-prices-api
cd tgju-live-prices-api
cp .env.example .env.local
# Edit .env.local — set ADMIN_KEY to something secure
npm install
npm run dev
```

| URL | Description |
|---|---|
| `http://localhost:3000/api/prices` | Live prices (HTML table in browser, JSON for APIs) |
| `http://localhost:3000/admin` | Admin dashboard |
| `http://localhost:3000/api/health` | System status |

---

## 📡 API Reference

### `GET /api/prices`

Returns current prices for all configured symbols.

**Query parameters:**

| Param | Example | Description |
|---|---|---|
| `symbols` | `?symbols=geram18,price_dollar_rl` | Comma-separated symbol IDs to override the configured list |
| `force` | `?force=1` | Bypass cache and fetch fresh prices |
| `json` | `?json=1` | Force JSON response even in browser |

**Response:**

```jsonc
{
  "success": true,
  "updatedAt": "2026-09-10T09:00:00.000Z",
  "cachedAt": "2026-09-10T09:00:05.000Z",
  "ttlSeconds": 30,
  "staleCount": 0,
  "errorCount": 0,
  "demoMode": false,
  "data": {
    "geram18": {
      "value": 24342500,          // numeric value in stated unit
      "formatted": "۲۴٬۳۴۲٬۵۰۰", // Persian formatted string
      "unit": "تومان",
      "label": "طلای ۱۸ عیار",
      "change": 1.27,             // % change vs yesterday
      "changeFormatted": "‎+۱٫۲۷٪",
      "stale": false,
      "suspicious": false,
      "error": false,
      "updatedAt": "2026-09-10T09:00:00.000Z",
      "cachedAt": "2026-09-10T09:00:05.000Z",
      "ttlSeconds": 30
    },
    "price_dollar_rl": { ... },
    "gold_global": {
      "value": 4400.27,
      "unit": "دلار",             // USD — not converted to Toman
      ...
    }
  }
}
```

**Response headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1725958860
Cache-Control: public, max-age=30
```

---

### `GET /api/prices/{symbol}`

Price for a single symbol (bypasses the configured selection list).

```bash
curl https://your-app.vercel.app/api/prices/geram18
curl https://your-app.vercel.app/api/prices/crypto-bitcoin
curl https://your-app.vercel.app/api/prices/price_dollar_rl
```

---

### `GET /api/items`

Full symbol catalog with metadata.

**Query parameters:**

| Param | Example | Description |
|---|---|---|
| `category` | `?category=gold` | Filter: `gold` `coin` `currency` `crypto` `stock` `commodity` |
| `search` | `?search=طلا` | Search by label or ID |
| `available` | `?available=true` | Filter by availability |

---

### `GET /api/stream`

Server-Sent Events — pushed on every price update.

```javascript
const es = new EventSource('https://your-app.vercel.app/api/stream');
es.onmessage = (e) => {
  const { type, data } = JSON.parse(e.data);
  if (type === 'prices') {
    console.log(data.geram18.value); // live gold price
  }
};
```

---

### `GET /api/health`

System status and diagnostics.

```json
{
  "status": "ok",
  "redis": "memory-fallback",
  "catalogSize": 82,
  "selectedCount": 11,
  "demoMode": false,
  "uptime": 3600
}
```

---

### `POST /api/config` — Update Settings

```json
{
  "adminKey": "your-admin-key",
  "selectedItems": ["geram18", "sekeb", "price_dollar_rl"],
  "ttlSeconds": 30,
  "rateLimitPerMinute": 60,
  "sanityCheckEnabled": true,
  "sanityCheckThreshold": 25
}
```

### `DELETE /api/cache?key=ADMIN_KEY` — Clear Cache

Forces all symbols to re-fetch on next request.

---

## 🗂️ Available Symbols

<details>
<summary><strong>Gold (طلا)</strong></summary>

| ID | Label | Unit |
|---|---|---|
| `geram18` | طلای ۱۸ عیار | تومان |
| `geram24` | طلای ۲۴ عیار | تومان |
| `gold_global` | اونس طلای جهانی | دلار |
| `mesghal` | مثقال طلا | تومان |
| `geram1` | طلای ۱ گرمی | تومان |
| `onz` | اونس طلا (تومان) | تومان |

</details>

<details>
<summary><strong>Coins (سکه)</strong></summary>

| ID | Label | Unit |
|---|---|---|
| `sekeb` | سکه امامی | تومان |
| `sekeb_old` | سکه بهار آزادی | تومان |
| `rob_sekkeh` | ربع سکه | تومان |
| `nim_sekeh` | نیم سکه | تومان |
| `gerami` | سکه گرمی | تومان |

</details>

<details>
<summary><strong>Currencies (ارز) — 20+ symbols</strong></summary>

| ID | Label |
|---|---|
| `price_dollar_rl` | دلار آمریکا |
| `price_eur` | یورو |
| `price_gbp` | پوند انگلیس |
| `price_aed` | درهم امارات |
| `price_try` | لیر ترکیه |
| `price_cny` | یوان چین |
| ... | و ۱۵+ ارز دیگر |

</details>

<details>
<summary><strong>Crypto (کریپتو) — 15+ symbols</strong></summary>

| ID | Label | Unit |
|---|---|---|
| `crypto-bitcoin` | بیت‌کوین | دلار |
| `crypto-ethereum` | اتریوم | دلار |
| `crypto-tether-toman` | تتر | تومان |
| `crypto-solana` | سولانا | دلار |
| ... | و ۱۰+ ارز دیجیتال دیگر | |

</details>

<details>
<summary><strong>Commodities & Index</strong></summary>

| ID | Label | Unit |
|---|---|---|
| `oil-brent` | نفت برنت | دلار |
| `silver` | نقره جهانی | دلار |
| `tse-index` | شاخص کل بورس | واحد |

</details>

---

## 🛠️ Tech Stack

- **[Next.js 15](https://nextjs.org)** — App Router, API Routes, SSE
- **[TypeScript](https://www.typescriptlang.org)** — fully typed
- **[Tailwind CSS](https://tailwindcss.com)** — admin dashboard UI
- **[Upstash Redis](https://upstash.com)** — optional edge-compatible cache
- **[cheerio](https://cheerio.js.org)** — HTML scraping fallback
- **[Vitest](https://vitest.dev)** — unit tests

---

## 🔧 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ADMIN_KEY` | ✅ | `change-me-please` | Dashboard & API admin password |
| `UPSTASH_REDIS_REST_URL` | ☑️ | — | Upstash Redis URL (for persistent cache) |
| `UPSTASH_REDIS_REST_TOKEN` | ☑️ | — | Upstash Redis token |
| `CACHE_TTL_SECONDS` | ☑️ | `30` | Price cache TTL in seconds |
| `RATE_LIMIT_PER_MINUTE` | ☑️ | `60` | Max requests per IP per minute |
| `SANITY_CHECK_THRESHOLD` | ☑️ | `25` | Max allowed % change before flagging |
| `DEMO_MODE` | ☑️ | `false` | Return mock prices (for development) |

---

## ☁️ Upstash Redis Setup (Optional)

Without Redis, the app uses an in-memory cache (resets on server restart). For **persistent cache across serverless function restarts** (strongly recommended on Vercel):

1. Create a free database at [console.upstash.com](https://console.upstash.com/)
2. Copy the **REST URL** and **REST Token**
3. Add to `.env.local`:

```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxxxxxxxxxxxxx
```

---

## 🚀 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sabernoori/tgju-live-prices-api&env=ADMIN_KEY&envDescription=Set%20a%20secure%20admin%20password%20for%20the%20dashboard&project-name=tgju-live-prices&repository-name=tgju-live-prices)

Or manually:

```bash
# 1. Fork this repo on GitHub
# 2. Go to vercel.com/new → import your fork
# 3. Set environment variables (ADMIN_KEY at minimum)
# 4. Deploy — done!
```

The app runs on Vercel Hobby (free tier) with no config needed. Upgrade to Pro for longer function timeouts.

---

## 🧪 Running Tests

```bash
npm test          # run all unit tests
npm run test:watch # watch mode
```

---

## 📝 Notes & Limitations

- **Data source**: All prices come from [tgju.org](https://tgju.org). This project is not affiliated with tgju.org.
- **Accuracy**: Prices may be delayed by a few seconds due to caching and scraping latency.
- **Rate limits**: Be respectful to tgju.org — the default 30s TTL is intentional.
- **Production use**: For high-traffic deployments, use Redis and increase TTL.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, open an issue first.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feat/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT © 2026 — See [LICENSE](LICENSE) for details.

---

<div align="center">
  <sub>Built with ❤️ for the Iranian developer community · داده‌ها از <a href="https://tgju.org">tgju.org</a></sub>
</div>
