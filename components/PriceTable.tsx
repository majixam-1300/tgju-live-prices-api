"use client";

import { CachedPrice } from "@/lib/cache";
import { StatusBadge } from "./StatusBadge";

interface PriceTableProps {
  data: Record<string, CachedPrice>;
  loading?: boolean;
}

export function PriceTable({ data, loading }: PriceTableProps) {
  const entries = Object.entries(data);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="mr-3 text-gray-500">در حال بارگذاری...</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        هیچ نمادی انتخاب نشده است
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" dir="rtl">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">نماد</th>
            <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">قیمت</th>
            <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">واحد</th>
            <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">تغییر</th>
            <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">وضعیت</th>
            <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">بروزرسانی</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([id, price]) => (
            <tr
              key={id}
              className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                price.error ? "opacity-50" : ""
              }`}
            >
              <td className="py-3 px-4">
                <div className="font-medium text-gray-900 dark:text-gray-100">{price.label}</div>
                <div className="text-xs text-gray-400">{id}</div>
              </td>
              <td className="py-3 px-4 font-mono font-medium text-gray-900 dark:text-gray-100">
                {price.error ? "—" : price.formatted}
              </td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs">{price.unit}</td>
              <td className="py-3 px-4">
                {price.error ? (
                  <span className="text-gray-400">—</span>
                ) : (
                  <span
                    className={
                      price.change > 0
                        ? "text-green-600 dark:text-green-400"
                        : price.change < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-500"
                    }
                  >
                    {price.changeFormatted}
                  </span>
                )}
              </td>
              <td className="py-3 px-4">
                <StatusBadge stale={price.stale} suspicious={price.suspicious} error={price.error} />
              </td>
              <td className="py-3 px-4 text-xs text-gray-400 dir-ltr" dir="ltr">
                {price.error ? "—" : new Date(price.cachedAt).toLocaleTimeString("fa-IR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
