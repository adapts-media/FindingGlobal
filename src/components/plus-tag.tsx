/**
 * PlusTag — compact gold PLUS badge.
 * Two variants: inline-styles (PlusTag) and Tailwind (PlusTailwindTag).
 */

import type { CSSProperties } from "react";

interface PlusTagProps {
  label?: string;
  icon?: string;
  style?: CSSProperties;
  className?: string;
}

/* ─── Inline-styles variant ─────────────────────────────── */
const styles = {
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    background: "linear-gradient(135deg, #B8862E 0%, #F0D080 48%, #C9A84C 100%)",
    borderRadius: "20px",
    padding: "2px 7px 2px 4px",
    border: "none",
    outline: "none",
    boxShadow: "0 1px 3px rgba(139,90,0,0.25)",
    cursor: "default",
    userSelect: "none" as const,
  } satisfies CSSProperties,

  iconCircle: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "13px",
    height: "13px",
    borderRadius: "50%",
    background: "rgba(0,0,0,0.14)",
    fontSize: "7px",
    fontWeight: 800,
    color: "#3D2800",
    lineHeight: 1,
    flexShrink: 0,
  } satisfies CSSProperties,

  label: {
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "#3D2800",
    lineHeight: 1,
  } satisfies CSSProperties,
};

export function PlusTag({ label = "PLUS", icon = "✦", style, className }: PlusTagProps) {
  return (
    <span style={{ ...styles.pill, ...style }} className={className}>
      <span style={styles.iconCircle}>{icon}</span>
      <span style={styles.label}>{label}</span>
    </span>
  );
}

/* ─── Tailwind variant ──────────────────────────────────── */
export function PlusTailwindTag({ label = "PLUS", icon = "✦", className = "" }: PlusTagProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-[3px]",
        "rounded-full",
        "pl-[4px] pr-[7px] py-[2px]",
        "bg-gradient-to-br from-[#B8862E] via-[#F0D080] to-[#C9A84C]",
        "shadow-[0_1px_3px_rgba(139,90,0,0.25)]",
        "select-none whitespace-nowrap",
        "border-0 outline-none",
        className,
      ].join(" ")}
    >
      {/* Icon circle */}
      <span className="inline-flex items-center justify-center size-[13px] rounded-full bg-black/[0.14] text-[7px] font-extrabold text-[#3D2800] leading-none shrink-0">
        {icon}
      </span>

      {/* Label */}
      <span className="text-[8px] font-extrabold tracking-[0.1em] uppercase text-[#3D2800] leading-none">
        {label}
      </span>
    </span>
  );
}
