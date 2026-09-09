import { NextRequest } from "next/server";
import { getConfig } from "@/lib/config";
import { loadCatalog } from "@/lib/catalog";
import { fetchMultiplePrices } from "@/lib/tgju";
import { applyRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const config = await getConfig();
  const rl = applyRateLimit(req, config.rateLimitPerMinute);
  if (!rl.ok) return rl.response;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // client disconnected
        }
      };

      // Send initial ping
      send({ type: "ping", ts: new Date().toISOString() });

      let running = true;
      req.signal.addEventListener("abort", () => {
        running = false;
        try { controller.close(); } catch {/* ignore */}
      });

      while (running) {
        const config = await getConfig();
        const ttl = Math.max(config.ttlSeconds, 10) * 1000;

        try {
          const catalog = await loadCatalog();
          const catalogMap = new Map(catalog.map((s) => [s.id, s]));

          const inputs = config.selectedItems.map((id) => {
            const entry = catalogMap.get(id);
            return { id, label: entry?.label ?? id, unit: entry?.unit ?? "تومان" };
          });

          const prices = await fetchMultiplePrices(inputs);

          let staleCount = 0, errorCount = 0, latestUpdatedAt = "";
          for (const p of Object.values(prices)) {
            if (p.stale) staleCount++;
            if (p.error) errorCount++;
            if (!latestUpdatedAt || p.updatedAt > latestUpdatedAt) latestUpdatedAt = p.updatedAt;
          }

          send({
            type: "prices",
            updatedAt: latestUpdatedAt || new Date().toISOString(),
            cachedAt: new Date().toISOString(),
            ttlSeconds: config.ttlSeconds,
            staleCount,
            errorCount,
            data: prices,
          });
        } catch (err) {
          send({ type: "error", message: String(err) });
        }

        // Wait TTL before next push
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, ttl);
          req.signal.addEventListener("abort", () => {
            clearTimeout(timer);
            resolve();
          });
        });
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      ...rl.headers,
    },
  });
}
