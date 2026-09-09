"use client";

import { useState, useEffect } from "react";
import { ItemSelector } from "@/components/ItemSelector";
import { defaultSelectedSymbols } from "@/data/seed-symbols";

interface CatalogItem {
  id: string;
  label: string;
  category: string;
  unit: string;
  available: boolean;
  selected: boolean;
}

interface ItemsTabProps {
  adminKey: string;
  apiBase: string;
}

export function ItemsTab({ adminKey, apiBase }: ItemsTabProps) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadItems = async () => {
    try {
      const res = await fetch(`${apiBase}/api/items`);
      const json = await res.json();
      setItems(json.data ?? []);
      setSelected(new Set((json.data ?? []).filter((i: CatalogItem) => i.selected).map((i: CatalogItem) => i.id)));
    } catch {
      setMessage({ type: "error", text: "خطا در بارگذاری لیست نمادها" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedItems: Array.from(selected), adminKey }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: `${selected.size} نماد ذخیره شد` });
      } else {
        setMessage({ type: "error", text: json.error ?? "خطا در ذخیره" });
      }
    } catch {
      setMessage({ type: "error", text: "خطا در ارتباط با سرور" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRefreshCatalog = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${apiBase}/api/items/refresh?key=${encodeURIComponent(adminKey)}`);
      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: `Catalog رفرش شد: ${json.catalogSize} نماد` });
        await loadItems();
      } else {
        setMessage({ type: "error", text: json.error ?? "خطا در رفرش" });
      }
    } catch {
      setMessage({ type: "error", text: "خطا در ارتباط با سرور" });
    } finally {
      setRefreshing(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">نمادها</h2>
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {selected.size}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={() => setSelected(new Set(defaultSelectedSymbols))}
            title="بازگشت به لیست پیش‌فرض نمادها"
            className="px-3 py-1.5 text-sm rounded-lg border border-amber-400 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
          >
            ↩ پیش‌فرض
          </button>
          <button
            onClick={handleRefreshCatalog}
            disabled={refreshing}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {refreshing ? "در حال رفرش..." : "🔄 رفرش Catalog"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "در حال ذخیره..." : "💾 ذخیره"}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      ) : (
        <ItemSelector items={items} selected={selected} onChange={setSelected} />
      )}
    </div>
  );
}
