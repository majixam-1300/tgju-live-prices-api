import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseRawPrice } from "../lib/normalize";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("HTML scraper fallback", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("parses price from .last-price-value selector", async () => {
    const html = `
      <html><body>
        <div class="last-price-value">32,540,000</div>
        <div class="change-percent">+1.2%</div>
      </body></html>
    `;
    // Test cheerio parsing directly (no fetch needed)
    const cheerio = await import("cheerio");
    const $ = cheerio.load(html);
    const raw = $(".last-price-value").first().text().trim();
    const value = parseRawPrice(raw);
    expect(value).toBe(32_540_000);
  }, 10000);

  it("parses Persian digit price from HTML", async () => {
    const html = `
      <html><body>
        <span class="price-value">۳۲٬۵۴۰٬۰۰۰</span>
      </body></html>
    `;
    const cheerio = await import("cheerio");
    const $ = cheerio.load(html);
    const raw = $(".price-value").first().text().trim();
    const value = parseRawPrice(raw);
    expect(value).toBe(32_540_000);
  });

  it("returns null when no price found in HTML", async () => {
    const html = `<html><body><p>No price here</p></body></html>`;
    const cheerio = await import("cheerio");
    const $ = cheerio.load(html);

    const selectors = [".last-price-value", "[data-price]", ".price-value"];
    let rawPrice: string | null = null;
    for (const sel of selectors) {
      const text = $(sel).first().text().trim();
      if (text && /[\d,۰-۹]/.test(text)) {
        rawPrice = text;
        break;
      }
    }
    expect(rawPrice).toBeNull();
  });
});

describe("JSON API parser", () => {
  it("handles standard tgju API response shape", () => {
    const apiResponse = {
      data: [{
        p: "32,540,000",
        d: "387,000",
        dp: "1.2",
        t: "2024-01-15T10:30:00.000Z",
      }],
    };

    const row = apiResponse.data[0];
    const value = parseRawPrice(row.p);
    const change = parseRawPrice(row.dp);

    expect(value).toBe(32_540_000);
    expect(change).toBe(1.2);
  });

  it("handles flat response shape", () => {
    const apiResponse = {
      price: "65000",
      change_percent: "2.5",
      timestamp: "2024-01-15T10:30:00.000Z",
    };
    const value = parseRawPrice(apiResponse.price);
    expect(value).toBe(65_000);
  });

  it("returns null for empty response", () => {
    expect(parseRawPrice("")).toBeNull();
    expect(parseRawPrice(0)).toBeNull(); // 0 is not positive → null
  });
});
