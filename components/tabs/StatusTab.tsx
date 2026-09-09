"use client";

import { useState, useEffect } from "react";

interface LogEntry {
  ts: string;
  level: "info" | "warn" | "error";
  msg: string;
}

interface HealthData {
  status: string;
  redis: "connected" | "disconnected" | "memory-fallback";
  lastFetch: string;
  catalogSize: number;
  selectedCount: number;
  uptime: number;
  memoryStoreSize: number;
  recentLogs?: LogEntry[];
}

interface StatusTabProps {
  apiBase: string;
  adminKey: string;
}

function formatUptime(s: number): string {
  if (s < 60) return `${s} ثانیه`;
  if (s < 3600) return `${Math.floor(s / 60)} دقیقه`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h} ساعت ${m} دقیقه`;
}

export function StatusTab({ apiBase, adminKey }: StatusTabProps) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${apiBase}/api/health`, {
        headers: { "X-Admin-Key": adminKey },
      });
      const json = await res.json();
      setHealth(json);
    } catch {/* ignore */}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, [adminKey]);

  const pricesEndpoint = `${apiBase}/api/prices`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pricesEndpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const redisColor = {
    connected: "text-green-600 dark:text-green-400",
    disconnected: "text-red-600 dark:text-red-400",
    "memory-fallback": "text-yellow-600 dark:text-yellow-400",
  }[health?.redis ?? "memory-fallback"];

  const logLevelColor = {
    info: "text-blue-600 dark:text-blue-400",
    warn: "text-yellow-600 dark:text-yellow-400",
    error: "text-red-600 dark:text-red-400",
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">وضعیت سیستم</h2>
        <button
          onClick={fetchHealth}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          بروزرسانی
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "وضعیت", value: health?.status === "ok" ? "✅ فعال" : "❌ خطا" },
          {
            label: "Redis",
            value: health?.redis === "connected" ? "✅ متصل" : health?.redis === "memory-fallback" ? "⚠️ حافظه" : "❌ قطع",
            colorClass: redisColor,
          },
          { label: "آخرین Fetch", value: health?.lastFetch === "never" ? "هنوز نشده" : new Date(health?.lastFetch ?? "").toLocaleTimeString("fa-IR") },
          { label: "اندازه Catalog", value: `${health?.catalogSize ?? 0} نماد` },
          { label: "نمادهای انتخابی", value: `${health?.selectedCount ?? 0} عدد` },
          { label: "آپتایم", value: formatUptime(health?.uptime ?? 0) },
        ].map((stat, i) => (
          <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{stat.label}</div>
            <div className={`font-medium text-sm ${stat.colorClass ?? "text-gray-900 dark:text-gray-100"}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* API Endpoint copy */}
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">آدرس API عمومی</div>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 overflow-x-auto" dir="ltr">
            {pricesEndpoint}
          </code>
          <button
            onClick={handleCopy}
            className="shrink-0 px-3 py-2 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            {copied ? "✓ کپی شد" : "📋 کپی"}
          </button>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">لاگ‌های اخیر</div>
        <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 font-mono text-xs">
          {(health?.recentLogs ?? []).length === 0 ? (
            <div className="p-4 text-gray-400 text-center">هنوز لاگی ثبت نشده</div>
          ) : (
            (health?.recentLogs ?? []).map((log, i) => (
              <div key={i} className="flex gap-3 px-3 py-1.5 border-b border-gray-200/50 dark:border-gray-700/50 last:border-0">
                <span className="text-gray-400 shrink-0 dir-ltr" dir="ltr">
                  {new Date(log.ts).toLocaleTimeString("fa-IR")}
                </span>
                <span className={`font-bold uppercase shrink-0 ${logLevelColor[log.level]}`}>
                  {log.level}
                </span>
                <span className="text-gray-700 dark:text-gray-300 break-all">{log.msg}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
