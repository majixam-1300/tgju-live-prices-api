"use client";

import { useState, useEffect } from "react";
import { ItemsTab } from "@/components/tabs/ItemsTab";
import { SettingsTab } from "@/components/tabs/SettingsTab";
import { PreviewTab } from "@/components/tabs/PreviewTab";
import { StatusTab } from "@/components/tabs/StatusTab";

const TABS = [
  { id: "items", label: "📋 نمادها" },
  { id: "settings", label: "⚙️ تنظیمات" },
  { id: "preview", label: "📊 پیش‌نمایش" },
  { id: "status", label: "🔍 وضعیت" },
];

function getApiBase(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [activeTab, setActiveTab] = useState("items");
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tgju_admin_key");
    if (saved) setAdminKey(saved);
  }, []);

  const handleLogin = async () => {
    if (!inputKey.trim()) return;
    // Test the key
    try {
      const res = await fetch(`${getApiBase()}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey: inputKey }),
      });
      const json = await res.json();
      if (json.success) {
        localStorage.setItem("tgju_admin_key", inputKey);
        setAdminKey(inputKey);
        setAuthError(false);
      } else {
        setAuthError(true);
      }
    } catch {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("tgju_admin_key");
    setAdminKey("");
    setInputKey("");
  };

  if (!adminKey) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-3">🔐</div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">داشبورد مدیریتی</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">TGJU Price Monitor</p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Admin Key"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className={`w-full px-4 py-3 rounded-xl border ${authError ? "border-red-400" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-left placeholder:text-right`}
              dir="ltr"
            />
            {authError && (
              <p className="text-red-500 text-xs">کلید نادرست است</p>
            )}
            <button
              onClick={handleLogin}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              ورود
            </button>
          </div>
        </div>
      </div>
    );
  }

  const apiBase = getApiBase();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir="rtl">
      {/* Top Bar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">📈</span>
            <h1 className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
              TGJU Price Monitor
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors"
          >
            خروج
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 pb-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          {activeTab === "items" && <ItemsTab adminKey={adminKey} apiBase={apiBase} />}
          {activeTab === "settings" && <SettingsTab adminKey={adminKey} apiBase={apiBase} />}
          {activeTab === "preview" && <PreviewTab apiBase={apiBase} adminKey={adminKey} />}
          {activeTab === "status" && <StatusTab apiBase={apiBase} adminKey={adminKey} />}
        </div>
      </main>
    </div>
  );
}
