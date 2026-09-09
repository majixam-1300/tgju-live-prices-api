"use client";

import { useState, useEffect } from "react";
import { Toggle } from "@/components/Toggle";

interface Settings {
  ttlSeconds: number;
  rateLimitPerMinute: number;
  sanityCheckEnabled: boolean;
  sanityCheckThreshold: number;
}

interface SettingsTabProps {
  adminKey: string;
  apiBase: string;
}

// ── Reusable slider + number-input combo ──────────────────────────────────────
interface SliderFieldProps {
  label: string;
  description: string;
  icon: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  formatDisplay?: (v: number) => string;
  minLabel: string;
  maxLabel: string;
  onChange: (v: number) => void;
}

function SliderField({
  label, description, icon, value, min, max, step,
  unit, formatDisplay, minLabel, maxLabel, onChange,
}: SliderFieldProps) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const display = formatDisplay ? formatDisplay(value) : `${value} ${unit}`;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-4 space-y-3">
      {/* Row 1: icon + label + current value */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="text-xl leading-none mt-0.5">{icon}</span>
          <div>
            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{label}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed max-w-xs">
              {description}
            </div>
          </div>
        </div>
        {/* Number input */}
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(clamp(Number(e.target.value)))}
            className="w-20 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{unit}</span>
        </div>
      </div>

      {/* Row 2: slider */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-600 h-1.5"
      />

      {/* Row 3: min / current display / max */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-400">{minLabel}</span>
        <span className="font-medium text-blue-600 dark:text-blue-400 text-sm">{display}</span>
        <span className="text-gray-400">{maxLabel}</span>
      </div>
    </div>
  );
}

// ── Toggle field ──────────────────────────────────────────────────────────────
interface ToggleFieldProps {
  label: string;
  description: string;
  icon: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

function ToggleField({ label, description, icon, value, onChange }: ToggleFieldProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <span className="text-xl leading-none mt-0.5">{icon}</span>
          <div>
            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{label}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed max-w-sm">
              {description}
            </div>
          </div>
        </div>
        <Toggle checked={value} onChange={onChange} color="blue" size="md" />
      </div>
      <div className="mt-2 flex justify-end">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${value ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`}>
          {value ? "فعال" : "غیرفعال"}
        </span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function SettingsTab({ adminKey, apiBase }: SettingsTabProps) {
  const [settings, setSettings] = useState<Settings>({
    ttlSeconds: 30,
    rateLimitPerMinute: 60,
    sanityCheckEnabled: true,
    sanityCheckThreshold: 25,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch(`${apiBase}/api/config`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setSettings((prev) => ({ ...prev, ...j.data })); })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof Settings>(key: K, val: Settings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: val }));

  const formatTtl = (s: number) => {
    if (s < 60) return `${s} ثانیه`;
    if (s < 3600) return `${Math.floor(s / 60)} دقیقه و ${s % 60 > 0 ? s % 60 + " ثانیه" : ""}`.trimEnd();
    return `${Math.floor(s / 3600)} ساعت`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, adminKey }),
      });
      const json = await res.json();
      setMessage(json.success ? { type: "success", text: "✅ تنظیمات با موفقیت ذخیره شد" } : { type: "error", text: json.error ?? "خطا" });
    } catch {
      setMessage({ type: "error", text: "⚠️ خطا در ارتباط با سرور" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm("آیا مطمئن هستید؟\nتمام داده‌های کَش‌شده پاک می‌شوند و fetch بعدی مستقیم از tgju.org انجام می‌شود.")) return;
    setClearing(true);
    try {
      const res = await fetch(`${apiBase}/api/cache`, {
        method: "DELETE",
        headers: { "X-Admin-Key": adminKey },
      });
      const json = await res.json();
      setMessage(json.success ? { type: "success", text: `🗑️ ${json.clearedCount} آیتم از کَش پاک شد` } : { type: "error", text: json.error ?? "خطا" });
    } catch {
      setMessage({ type: "error", text: "⚠️ خطا در ارتباط با سرور" });
    } finally {
      setClearing(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 ml-3" />
        <span className="text-sm text-gray-500">در حال بارگذاری تنظیمات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">تنظیمات سیستم</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          تغییرات پس از ذخیره بلافاصله اعمال می‌شوند.
        </p>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${
          message.type === "success"
            ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
            : "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
        }`}>
          {message.text}
        </div>
      )}

      {/* ── TTL ── */}
      <SliderField
        icon="⏱️"
        label="مدت زمان کَش (TTL)"
        description="هر قیمت پس از fetch، تا این مدت در کَش نگه داشته می‌شود. مقادیر کمتر = داده تازه‌تر ولی بار بیشتر روی tgju.org. برای اکثر موارد ۳۰ تا ۶۰ ثانیه مناسب است."
        value={settings.ttlSeconds}
        min={10}
        max={1800}
        step={10}
        unit="ثانیه"
        formatDisplay={formatTtl}
        minLabel="۱۰ث (خیلی سریع)"
        maxLabel="۳۰ دقیقه"
        onChange={(v) => set("ttlSeconds", v)}
      />

      {/* ── Rate Limit ── */}
      <SliderField
        icon="🛡️"
        label="محدودیت درخواست (Rate Limit)"
        description="حداکثر تعداد درخواست‌هایی که هر IP در یک دقیقه می‌تواند به endpoint «/api/prices» ارسال کند. از این برای جلوگیری از سوءاستفاده و overload استفاده می‌شود."
        value={settings.rateLimitPerMinute}
        min={1}
        max={600}
        step={5}
        unit="درخواست/دقیقه"
        minLabel="۱ (خیلی محدود)"
        maxLabel="۶۰۰"
        onChange={(v) => set("rateLimitPerMinute", v)}
      />

      {/* ── Sanity Check Toggle ── */}
      <ToggleField
        icon="🔬"
        label="بررسی صحت قیمت (Sanity Check)"
        description="اگر قیمت دریافتی بیش از آستانه تعیین‌شده نسبت به مقدار قبلی تغییر کند، آن قیمت «مشکوک» flag می‌شود و مقدار قدیمی حفظ می‌شود. از ثبت داده‌های اشتباه جلوگیری می‌کند."
        value={settings.sanityCheckEnabled}
        onChange={(v) => set("sanityCheckEnabled", v)}
      />

      {/* ── Sanity Threshold (only when enabled) ── */}
      {settings.sanityCheckEnabled && (
        <div className="mr-8">
          <SliderField
            icon="📐"
            label="آستانه تغییر مجاز"
            description="اگر قیمت جدید بیش از این درصد نسبت به آخرین مقدار کَش‌شده تفاوت داشته باشد، sanity check شکست می‌خورد. مثلاً با ۲۵٪، اگر طلا از ۳۲M به بیش از ۴۰M برسد، مشکوک علامت‌گذاری می‌شود."
            value={settings.sanityCheckThreshold}
            min={5}
            max={100}
            step={5}
            unit="%"
            formatDisplay={(v) => `${v}٪`}
            minLabel="۵٪ (سخت‌گیرانه)"
            maxLabel="۱۰۰٪ (غیرفعال)"
            onChange={(v) => set("sanityCheckThreshold", v)}
          />
        </div>
      )}

      {/* ── Divider + Buttons ── */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium shadow-sm"
        >
          {saving ? (
            <><span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" /> در حال ذخیره...</>
          ) : (
            <>💾 ذخیره تنظیمات</>
          )}
        </button>

        <button
          onClick={handleClearCache}
          disabled={clearing}
          className="flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors font-medium"
        >
          {clearing ? (
            <><span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full" /> در حال پاک‌کردن...</>
          ) : (
            <>🗑️ پاک‌کردن کَش</>
          )}
        </button>

        <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 mr-auto">
          <span>⚠️ پاک‌کردن کَش fetch بعدی را کند می‌کند</span>
        </div>
      </div>
    </div>
  );
}
