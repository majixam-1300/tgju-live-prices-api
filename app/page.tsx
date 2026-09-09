import Link from "next/link";

export default function Home() {
  const endpoints = [
    { method: "GET", path: "/api/prices", desc: "قیمت نمادهای انتخابی" },
    { method: "GET", path: "/api/prices/{symbol}", desc: "قیمت یک نماد خاص" },
    { method: "GET", path: "/api/items", desc: "لیست کامل catalog" },
    { method: "GET", path: "/api/items/refresh", desc: "رفرش catalog (نیاز به کلید)" },
    { method: "GET", path: "/api/config", desc: "تنظیمات فعلی" },
    { method: "POST", path: "/api/config", desc: "ذخیره تنظیمات (نیاز به کلید)" },
    { method: "DELETE", path: "/api/cache", desc: "پاک‌کردن کَش (نیاز به کلید)" },
    { method: "GET", path: "/api/health", desc: "وضعیت سیستم" },
    { method: "GET", path: "/api/stream", desc: "SSE — به‌روزرسانی زنده" },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3 py-8">
          <div className="text-5xl">📈</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">TGJU Price Monitor</h1>
          <p className="text-gray-500 dark:text-gray-400">
            قیمت لحظه‌ای طلا، ارز، سکه، کریپتو و بیشتر از tgju.org
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/admin"
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              🔐 داشبورد مدیریتی
            </Link>
            <a
              href="/api/prices"
              target="_blank"
              className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
            >
              🔗 مشاهده API
            </a>
          </div>
        </div>

        {/* Endpoints */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Endpoints</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {endpoints.map((ep, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono shrink-0 ${
                  ep.method === "GET" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : ep.method === "POST" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                  {ep.method}
                </span>
                <code className="text-sm text-gray-700 dark:text-gray-300 flex-1 font-mono" dir="ltr">
                  {ep.path}
                </code>
                <span className="text-sm text-gray-500 dark:text-gray-400 text-left hidden sm:block">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick example */}
        <div className="bg-gray-900 dark:bg-black rounded-2xl p-5 text-sm font-mono" dir="ltr">
          <div className="text-gray-400 mb-2"># نمونه پاسخ GET /api/prices</div>
          <pre className="text-green-400 overflow-x-auto text-xs leading-relaxed">{`{
  "success": true,
  "updatedAt": "2024-01-15T10:30:00.000Z",
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
      "error": false
    }
  }
}`}</pre>
        </div>

        <footer className="text-center text-xs text-gray-400 pb-4">
          MIT License · Powered by{" "}
          <a href="https://tgju.org" className="underline" target="_blank">tgju.org</a>
        </footer>
      </div>
    </main>
  );
}
