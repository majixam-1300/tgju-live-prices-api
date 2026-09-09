import { NextRequest, NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { loadCatalog } from "@/lib/catalog";
import { fetchMultiplePrices } from "@/lib/tgju";
import { checkRateLimit, getClientIp, isLocalhost } from "@/lib/rate-limit";
import { CachedPrice } from "@/lib/cache";

export const dynamic = "force-dynamic";

// ── HTML prettified view ──────────────────────────────────────────────────────

function renderHtml(
  data: Record<string, CachedPrice>,
  meta: { updatedAt: string; ttlSeconds: number; staleCount: number; errorCount: number }
): string {
  const rows = Object.entries(data)
    .map(([id, p]) => {
      const changeClass = p.change > 0 ? "positive" : p.change < 0 ? "negative" : "neutral";
      const statusClass = p.error ? "badge-error" : p.suspicious ? "badge-suspicious" : p.stale ? "badge-stale" : "badge-ok";
      const statusLabel = p.error ? "خطا" : p.suspicious ? "مشکوک" : p.stale ? "قدیمی" : "تازه";
      const rowClass = p.error ? "row-error" : p.suspicious ? "row-suspicious" : p.stale ? "row-stale" : "";
      const valueDisplay = p.error ? "—" : p.formatted;
      const changeDisplay = p.error ? "—" : p.changeFormatted;
      const cachedTime = p.error ? "—" : new Date(p.cachedAt).toLocaleTimeString("fa-IR");

      return `<tr class="${rowClass}">
        <td class="cell-label">
          <span class="label-fa">${p.label}</span>
          <span class="label-id">${id}</span>
        </td>
        <td class="cell-value">${valueDisplay}</td>
        <td class="cell-unit">${p.unit}</td>
        <td class="cell-change ${changeClass}">${changeDisplay}</td>
        <td><span class="badge ${statusClass}">${statusLabel}</span></td>
        <td class="cell-time" dir="ltr">${cachedTime}</td>
      </tr>`;
    })
    .join("\n");

  const updatedTime = new Date(meta.updatedAt).toLocaleString("fa-IR");
  const symbolCount = Object.keys(data).length;
  const okCount = symbolCount - meta.errorCount - meta.staleCount;

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TGJU — قیمت‌های لحظه‌ای</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0f1117;
      --surface: #1a1d27;
      --surface2: #22263a;
      --border: #2e3347;
      --text: #e2e8f0;
      --muted: #8892a4;
      --blue: #4f8ef7;
      --green: #34d399;
      --red: #f87171;
      --yellow: #fbbf24;
      --orange: #fb923c;
      --purple: #a78bfa;
      --radius: 10px;
      --font: -apple-system, BlinkMacSystemFont, "Segoe UI", "Vazirmatn", "IRANSans", Tahoma, sans-serif;
    }

    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f1f5f9;
        --surface: #ffffff;
        --surface2: #f8fafc;
        --border: #e2e8f0;
        --text: #1e293b;
        --muted: #64748b;
      }
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      font-size: 14px;
      min-height: 100vh;
      padding: 24px 16px;
    }

    .container { max-width: 960px; margin: 0 auto; }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 24px;
    }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .logo { font-size: 28px; }
    .title { font-size: 20px; font-weight: 700; }
    .subtitle { font-size: 12px; color: var(--muted); margin-top: 2px; }
    .header-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    /* ── Stat chips ── */
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      background: var(--surface2);
      border: 1px solid var(--border);
      color: var(--muted);
    }
    .chip-ok  { background: rgba(52,211,153,.12); border-color: rgba(52,211,153,.3); color: #34d399; }
    .chip-err { background: rgba(248,113,113,.12); border-color: rgba(248,113,113,.3); color: #f87171; }
    .chip-stale { background: rgba(251,191,36,.12); border-color: rgba(251,191,36,.3); color: #fbbf24; }

    /* ── Meta bar ── */
    .meta-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius) var(--radius) 0 0;
      font-size: 12px;
      color: var(--muted);
    }
    .meta-bar a {
      color: var(--blue);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .meta-bar a:hover { text-decoration: underline; }
    .pulse {
      display: inline-block;
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--green);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: .5; transform: scale(1.3); }
    }

    /* ── Table ── */
    .table-wrap {
      background: var(--surface);
      border: 1px solid var(--border);
      border-top: none;
      border-radius: 0 0 var(--radius) var(--radius);
      overflow: hidden;
    }
    table { width: 100%; border-collapse: collapse; }
    thead tr { border-bottom: 1px solid var(--border); background: var(--surface2); }
    th {
      padding: 10px 16px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .04em;
      text-transform: uppercase;
      color: var(--muted);
      text-align: right;
    }
    td { padding: 12px 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover { background: var(--surface2); transition: background .15s; }

    .row-error    { opacity: .55; }
    .row-stale    { background: rgba(251,191,36,.04); }
    .row-suspicious { background: rgba(251,146,60,.06); }

    .cell-label .label-fa { display: block; font-weight: 600; color: var(--text); }
    .cell-label .label-id { display: block; font-size: 11px; color: var(--muted); margin-top: 2px; font-family: monospace; }

    .cell-value { font-family: "Courier New", monospace; font-size: 15px; font-weight: 700; color: var(--text); white-space: nowrap; }

    .cell-unit { font-size: 11px; color: var(--muted); }

    .cell-change { font-weight: 600; font-size: 13px; white-space: nowrap; }
    .cell-change.positive { color: var(--green); }
    .cell-change.negative { color: var(--red); }
    .cell-change.neutral  { color: var(--muted); }

    .cell-time { font-size: 11px; color: var(--muted); }

    /* ── Badges ── */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-ok         { background: rgba(52,211,153,.15); color: #34d399; }
    .badge-stale      { background: rgba(251,191,36,.15); color: #fbbf24; }
    .badge-error      { background: rgba(248,113,113,.15); color: #f87171; }
    .badge-suspicious { background: rgba(251,146,60,.15);  color: #fb923c; }

    /* ── Footer ── */
    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 11px;
      color: var(--muted);
    }
    .footer a { color: var(--blue); text-decoration: none; }
    .footer a:hover { text-decoration: underline; }

    /* ── JSON block ── */
    .json-section { margin-top: 24px; }
    .json-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius) var(--radius) 0 0;
      font-size: 12px;
      color: var(--muted);
      cursor: pointer;
      user-select: none;
    }
    .json-header:hover { background: var(--surface2); }
    .json-header .chevron { transition: transform .2s; }
    .json-header.open .chevron { transform: rotate(180deg); }
    pre {
      background: var(--surface);
      border: 1px solid var(--border);
      border-top: none;
      border-radius: 0 0 var(--radius) var(--radius);
      padding: 16px;
      overflow-x: auto;
      font-size: 12px;
      line-height: 1.6;
      color: #94a3b8;
      display: none;
    }
    pre.visible { display: block; }
    .json-key    { color: #7dd3fc; }
    .json-str    { color: #86efac; }
    .json-num    { color: #fdba74; }
    .json-bool   { color: #c084fc; }
    .json-null   { color: #f87171; }

    @media (max-width: 600px) {
      th:nth-child(3), td:nth-child(3),
      th:nth-child(6), td:nth-child(6) { display: none; }
      .title { font-size: 16px; }
    }

    /* ── Refresh countdown ── */
    #countdown { font-variant-numeric: tabular-nums; }
  </style>
</head>
<body>
<div class="container">

  <!-- Header -->
  <header class="header">
    <div class="header-left">
      <span class="logo">📈</span>
      <div>
        <div class="title">TGJU — قیمت‌های لحظه‌ای</div>
        <div class="subtitle">آخرین بروزرسانی: ${updatedTime}</div>
      </div>
    </div>
    <div class="header-right">
      <span class="chip chip-ok">✓ ${okCount} نماد</span>
      ${meta.staleCount > 0 ? `<span class="chip chip-stale">⚠ ${meta.staleCount} قدیمی</span>` : ""}
      ${meta.errorCount > 0 ? `<span class="chip chip-err">✗ ${meta.errorCount} خطا</span>` : ""}
      <span class="chip"><span class="pulse"></span> رفرش هر <span id="countdown">${meta.ttlSeconds}</span>ث</span>
    </div>
  </header>

  <!-- Meta bar -->
  <div class="meta-bar">
    <span>
      <span class="pulse" style="background:var(--blue)"></span>
      &nbsp;${symbolCount} نماد انتخابی
    </span>
    <span>
      <a href="?format=json" target="_blank">⬇ دریافت JSON خام</a>
      &nbsp;·&nbsp;
      <a href="/admin">🔐 داشبورد مدیریتی</a>
    </span>
  </div>

  <!-- Table -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>نماد</th>
          <th>قیمت</th>
          <th>واحد</th>
          <th>تغییر روز</th>
          <th>وضعیت</th>
          <th>بروزرسانی</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>

  <!-- Raw JSON (collapsible) -->
  <div class="json-section">
    <div class="json-header" id="jsonToggle" onclick="toggleJson()">
      <span>{ } مشاهده JSON خام</span>
      <svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>
    <pre id="jsonBlock"></pre>
  </div>

  <div class="footer">
    Powered by <a href="https://tgju.org" target="_blank">tgju.org</a>
    &nbsp;·&nbsp;
    <a href="/api/health">وضعیت سیستم</a>
    &nbsp;·&nbsp;
    MIT License
  </div>

</div>

<script>
  // ── Auto-refresh countdown ─────────────────────────
  const ttl = ${meta.ttlSeconds};
  let remaining = ttl;
  const el = document.getElementById('countdown');
  setInterval(() => {
    remaining--;
    if (remaining <= 0) { location.reload(); return; }
    if (el) el.textContent = remaining;
  }, 1000);

  // ── JSON toggle ────────────────────────────────────
  const rawData = ${JSON.stringify({ success: true, updatedAt: meta.updatedAt, ttlSeconds: meta.ttlSeconds, staleCount: meta.staleCount, errorCount: meta.errorCount, data }, null, 2)};

  function syntaxHighlight(json) {
    return json
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(?=\\s*:))/g, '<span class="json-key">$1</span>')
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")/g, '<span class="json-str">$1</span>')
      .replace(/\\b(true|false)\\b/g, '<span class="json-bool">$1</span>')
      .replace(/\\bnull\\b/g, '<span class="json-null">null</span>')
      .replace(/\\b(-?\\d+\\.?\\d*)\\b/g, '<span class="json-num">$1</span>');
  }

  function toggleJson() {
    const toggle = document.getElementById('jsonToggle');
    const block  = document.getElementById('jsonBlock');
    toggle.classList.toggle('open');
    if (block.classList.toggle('visible')) {
      block.innerHTML = syntaxHighlight(JSON.stringify(rawData, null, 2));
    }
  }

  // ── ?format=json redirect ──────────────────────────
  if (new URLSearchParams(location.search).get('format') === 'json') {
    document.open();
    document.write('<pre>' + JSON.stringify(rawData, null, 2) + '</pre>');
    document.close();
  }
</script>
</body>
</html>`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const config = await getConfig();

  // Rate limiting (skip for localhost in development)
  const ip = getClientIp(req);
  const skipRateLimit = isLocalhost(ip) && process.env.NODE_ENV === "development";
  const rl = skipRateLimit
    ? { ok: true, limit: 999, remaining: 999, reset: 0 }
    : checkRateLimit(ip, config.rateLimitPerMinute);

  const rlHeaders: Record<string, string> = {
    "X-RateLimit-Limit": String(rl.limit),
    "X-RateLimit-Remaining": String(rl.remaining),
    "X-RateLimit-Reset": String(rl.reset),
  };

  if (!rl.ok) {
    return NextResponse.json(
      { success: false, error: "Too Many Requests" },
      {
        status: 429,
        headers: { ...rlHeaders, "Retry-After": String((rl as { retryAfter?: number }).retryAfter ?? 60) },
      }
    );
  }

  // Parse ?symbols= override
  const url = new URL(req.url);
  const symbolsParam = url.searchParams.get("symbols");

  let symbolIds: string[];
  if (symbolsParam) {
    symbolIds = symbolsParam.split(",").map((s) => s.trim()).filter(Boolean);
  } else {
    symbolIds = config.selectedItems;
  }

  // Load catalog for label/unit lookup
  const catalog = await loadCatalog();
  const catalogMap = new Map(catalog.map((s) => [s.id, s]));

  const inputs = symbolIds.map((id) => {
    const entry = catalogMap.get(id);
    return { id, label: entry?.label ?? id, unit: entry?.unit ?? "تومان" };
  });

  const forceRefresh = url.searchParams.has("force");
  const prices = await fetchMultiplePrices(inputs, forceRefresh);

  const data: Record<string, CachedPrice> = prices;
  let staleCount = 0, errorCount = 0, latestUpdatedAt = "";
  for (const p of Object.values(data)) {
    if (p.stale) staleCount++;
    if (p.error) errorCount++;
    if (!latestUpdatedAt || p.updatedAt > latestUpdatedAt) latestUpdatedAt = p.updatedAt;
  }

  const meta = {
    updatedAt: latestUpdatedAt || new Date().toISOString(),
    ttlSeconds: config.ttlSeconds,
    staleCount,
    errorCount,
  };

  // Browser detection → HTML; programmatic → JSON
  const accept = req.headers.get("accept") ?? "";
  const wantHtml = accept.includes("text/html") && !url.searchParams.has("json");

  if (wantHtml) {
    return new Response(renderHtml(data, meta), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=30",
        ...rlHeaders,
      },
    });
  }

  const demoMode = process.env.DEMO_MODE === "true";

  return NextResponse.json(
    { success: true, ...meta, cachedAt: new Date().toISOString(), demoMode, data },
    { headers: { ...rlHeaders, "Cache-Control": "public, max-age=30" } }
  );
}
