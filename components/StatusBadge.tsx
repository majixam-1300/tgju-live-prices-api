"use client";

interface StatusBadgeProps {
  stale?: boolean;
  suspicious?: boolean;
  error?: boolean;
  className?: string;
}

export function StatusBadge({ stale, suspicious, error, className = "" }: StatusBadgeProps) {
  if (error) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 ${className}`}>
        خطا
      </span>
    );
  }
  if (suspicious) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 ${className}`}>
        مشکوک
      </span>
    );
  }
  if (stale) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 ${className}`}>
        قدیمی
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 ${className}`}>
      تازه
    </span>
  );
}
