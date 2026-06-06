import type { ReactNode } from "react";

type CyberBadgeVariant = "cyan" | "fuchsia" | "neutral" | "success" | "warning" | "danger";

const variantClass: Record<CyberBadgeVariant, string> = {
  cyan: "border-cyan-400/25 bg-cyan-400/[0.05] text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.08)]",
  fuchsia:
    "border-fuchsia-500/25 bg-fuchsia-500/[0.05] text-fuchsia-100 shadow-[0_0_18px_rgba(217,70,239,0.08)]",
  neutral: "border-white/[0.08] bg-white/[0.03] text-white/60",
  success: "border-emerald-400/25 bg-emerald-400/[0.05] text-emerald-200",
  warning: "border-yellow-400/25 bg-yellow-400/[0.05] text-yellow-200",
  danger: "border-red-400/25 bg-red-400/[0.05] text-red-200",
};

type CyberBadgeProps = Readonly<{
  children: ReactNode;
  variant?: CyberBadgeVariant;
  className?: string;
}>;

export default function CyberBadge({
  children,
  variant = "cyan",
  className = "",
}: CyberBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1.5 font-mono text-xs",
        variantClass[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
