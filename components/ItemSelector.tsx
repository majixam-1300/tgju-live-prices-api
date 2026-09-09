"use client";

import { useState, useMemo } from "react";

interface CatalogItem {
  id: string;
  label: string;
  category: string;
  unit: string;
  available: boolean;
  selected: boolean;
}

interface ItemSelectorProps {
  items: CatalogItem[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
}

const CATEGORIES = [
  { id: "all", label: "همه" },
  { id: "gold", label: "طلا" },
  { id: "coin", label: "سکه" },
  { id: "currency", label: "ارز" },
  { id: "crypto", label: "کریپتو" },
  { id: "stock", label: "بورس" },
  { id: "commodity", label: "کالا" },
];

export function ItemSelector({ items, selected, onChange }: ItemSelectorProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [items, search, category]);

  const toggleItem = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  const toggleAll = () => {
    if (filtered.every((i) => selected.has(i.id))) {
      const next = new Set(selected);
      filtered.forEach((i) => next.delete(i.id));
      onChange(next);
    } else {
      const next = new Set(selected);
      filtered.forEach((i) => next.add(i.id));
      onChange(next);
    }
  };

  return (
    <div dir="rtl">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="جستجو..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                category === cat.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* List header */}
      <div className="flex items-center justify-between mb-2 text-sm text-gray-500">
        <span>{filtered.length} نتیجه</span>
        <button onClick={toggleAll} className="text-blue-600 dark:text-blue-400 hover:underline text-xs">
          {filtered.every((i) => selected.has(i.id)) ? "لغو همه" : "انتخاب همه"}
        </button>
      </div>

      {/* Scrollable list */}
      <div className="max-h-[400px] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">نتیجه‌ای یافت نشد</div>
        ) : (
          filtered.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={() => toggleItem(item.id)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                  {item.label}
                </div>
                <div className="text-xs text-gray-400">{item.id}</div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 shrink-0">
                {CATEGORIES.find((c) => c.id === item.category)?.label ?? item.category}
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
