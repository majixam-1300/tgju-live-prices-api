"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
  color?: "blue" | "green";
  size?: "sm" | "md";
  className?: string;
}

/**
 * A simple toggle/switch that works correctly in both LTR and RTL layouts.
 * The track and thumb are always rendered LTR via explicit `dir="ltr"`.
 */
export function Toggle({
  checked,
  onChange,
  label,
  color = "blue",
  size = "md",
  className = "",
}: ToggleProps) {
  const trackW = size === "sm" ? "w-9" : "w-11";
  const trackH = size === "sm" ? "h-5" : "h-6";
  const thumbSz = size === "sm" ? "w-3.5 h-3.5" : "w-4.5 h-4.5";
  const thumbOn = size === "sm" ? "translate-x-4" : "translate-x-5";

  const trackColor = checked
    ? color === "green"
      ? "bg-green-500"
      : "bg-blue-600"
    : "bg-gray-300 dark:bg-gray-600";

  return (
    <div
      className={`inline-flex items-center gap-2 cursor-pointer select-none ${className}`}
      onClick={() => onChange(!checked)}
    >
      {/* Track — always LTR so thumb moves left-to-right regardless of page dir */}
      <span
        dir="ltr"
        className={`relative inline-flex shrink-0 ${trackW} ${trackH} rounded-full transition-colors duration-200 ${trackColor} focus-within:ring-2 focus-within:ring-offset-1 focus-within:ring-blue-500`}
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => (e.key === " " || e.key === "Enter") && onChange(!checked)}
      >
        {/* Thumb */}
        <span
          className={`
            absolute top-[3px] left-[3px]
            ${thumbSz}
            rounded-full bg-white shadow-sm
            transition-transform duration-200
            ${checked ? thumbOn : "translate-x-0"}
          `}
        />
      </span>

      {label && (
        <span className="text-sm text-gray-700 dark:text-gray-300 leading-none">
          {label}
        </span>
      )}
    </div>
  );
}
