# TGJU Price Monitor

A standalone web application that fetches real-time financial prices (gold, currency, coins, crypto, stocks, and more) from [tgju.org](https://tgju.org) and exposes them via a public REST API with an admin dashboard.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/tgju-monitor&env=ADMIN_KEY&envDescription=Set%20a%20secure%20admin%20key)

---

## Features

- 📡 **Real-time prices** from tgju.org with 3-layer fallback (JSON API → HTML scrape → stale cache)
- 🗂️ **80+ symbols** across: gold, coins, currencies, crypto, stocks, commodities
- ⚡ **Redis cache** (Upstash) or in-memory fallback — no setup required
- 🛡️ **Rate limiting** — sliding window per IP
- ✅ **Sanity check** — flags suspicious price jumps
- 📺 **SSE stream** — live updates without polling
- 🖥️ **Admin dashboard** with 4 tabs: Symbol selector, Settings, Price preview, System status

---

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/tgju-monitor
cd tgju-monitor
cp .env.example .env.local
# Edit .env.local and set ADMIN_KEY
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the homepage.
Open [http://localhost:3000/admin](http://localhost:3000/admin) for the dashboard.

---

## API Reference

### `GET /api/prices`

Returns prices for all selected symbols.

**Query params:**
- `?symbols=geram18,price_dollar_rl` — override selected symbols (temporary)

**Response:**
```json
{
  "success": true,
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "cachedAt": "2024-01-15T10:30:05.000Z",
  "ttlSeconds": 30,
  "staleCount": 0,
  "errorCount": 0,
  "data": {
    "geram18": {
      "value": 32540000,
      "formatted": "۳۲٬۵۴۰٬۰۰۰",
      "unit": "تومان",
      "label": "طلای ۱۸ عیار",
      "change": 1.2,
      "changeFormatted": "‎+۱٫۲۰٪",
      "stale": false,
      "suspicious": false,
      "error": false,
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "cachedAt": "2024-01-15T10:30:05.000Z",
      "ttlSeconds": 30
    }
  }
}
```

**Headers:**
- `Cache-Control: public, max-age=30`
- `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

### `GET /api/prices/{symbol}`

Returns price for a single symbol (even if not in the selected list).

```bash
curl https://your-app.vercel.app/api/prices/geram18
curl https://your-app.vercel.app/api/prices/crypto-bitcoin
```

---

### `GET /api/items`

Returns the full symbol catalog.

**Query params:**
- `?category=gold` — filter by category (`gold`, `coin`, `currency`, `crypto`, `stock`, `commodity`)
- `?search=طلا` — search by label or ID
- `?available=true` — filter by availability

---

### `GET /api/items/refresh?key=ADMIN_KEY`

Re-fetches the symbol catalog from tgju.org.

---

### `GET /api/config`

Returns current configuration (admin key not exposed).

### `POST /api/config`

Update configuration. Requires `adminKey` in request body.

```json
{
  "adminKey": "your-admin-key",
  "selectedItems": ["geram18", "price_dollar_rl"],
  "ttlSeconds": 60,
  "rateLimitPerMinute": 100,
  "sanityCheckEnabled": true,
  "sanityCheckThreshold": 25
}
```

---

### `DELETE /api/cache?key=ADMIN_KEY`

Clears all cached prices.

---

### `GET /api/health`

Returns system status.

```json
{
  "status": "ok",
  "redis": "memory-fallback",
  "lastFetch": "2024-01-15T10:30:00.000Z",
  "catalogSize": 72,
  "selectedCount": 10,
  "uptime": 3600
}
```

---

### `GET /api/stream`

Server-Sent Events (SSE) endpoint. Pushes updated prices every TTL seconds.

```javascript
const es = new EventSource('/api/stream');
es.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.type === 'prices') console.log(data.data);
};
```

---

## Upstash Redis Setup (Optional)

Without Redis, the app uses in-memory cache (resets on restart). For persistence:

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a free Redis database
3. Copy the REST URL and token
4. Add to `.env.local`:

```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

---

## Deploy to Vercel

1. Fork this repo
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo
3. Add environment variables:
   - `ADMIN_KEY` — a secure secret (required)
   - `UPSTASH_REDIS_REST_URL` — optional, for persistent cache
   - `UPSTASH_REDIS_REST_TOKEN` — optional

The app works on Vercel Hobby (free tier) with no configuration needed.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ADMIN_KEY` | ✅ Yes | `change-me-please` | Dashboard access key |
| `UPSTASH_REDIS_REST_URL` | No | — | Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | No | — | Upstash Redis token |
| `CACHE_TTL_SECONDS` | No | `30` | Cache TTL in seconds |
| `RATE_LIMIT_PER_MINUTE` | No | `60` | Rate limit per IP per minute |
| `SANITY_CHECK_THRESHOLD` | No | `25` | Max allowed % price change |

---

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS**
- **@upstash/redis** — optional Redis client
- **cheerio** — HTML parsing for fallback scraping
- **Vitest** — unit tests

---

## License

MIT © 2024
