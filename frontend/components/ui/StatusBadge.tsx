import React from "react";

export type StatusVariant =
  | "active"
  | "pending"
  | "settled"
  | "failed"
  | "critical"
  | "commercial"
  | "standard"
  | "solar"
  | "wind"
  | "hydro"
  | "neutral";

export interface StatusBadgeProps {
  status: string | StatusVariant;
  variant?: string;
  label?: string;
  withDot?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant: explicitVariant,
  label,
  withDot = true,
  size = "md",
  className = "",
}) => {
  const normalized = (status || "").toLowerCase();

  let variant: StatusVariant = "neutral";
  if (explicitVariant) {
    const ev = explicitVariant.toLowerCase();
    if (ev === "success" || ev === "active") variant = "active";
    else if (ev === "warning" || ev === "pending") variant = "pending";
    else if (ev === "danger" || ev === "error" || ev === "failed") variant = "failed";
    else if (ev === "info") variant = "commercial";
    else variant = "neutral";
  } else if (["active", "success", "settled", "on_chain_settled", "completed"].includes(normalized)) {
    variant = "active";
  } else if (["pending", "matching", "partially_filled", "partially_matched"].includes(normalized)) {
    variant = "pending";
  } else if (["failed", "cancelled", "rejected", "expired", "disputed"].includes(normalized)) {
    variant = "failed";
  } else if (["critical", "high"].includes(normalized)) {
    variant = "critical";
  } else if (["commercial"].includes(normalized)) {
    variant = "commercial";
  } else if (["standard", "normal"].includes(normalized)) {
    variant = "standard";
  } else if (normalized.includes("solar")) {
    variant = "solar";
  } else if (normalized.includes("wind")) {
    variant = "wind";
  } else if (normalized.includes("hydro")) {
    variant = "hydro";
  }

  const variantStyles = {
    active: {
      badge: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60",
      dot: "bg-emerald-500",
    },
    pending: {
      badge: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60",
      dot: "bg-amber-500 animate-pulse",
    },
    failed: {
      badge: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60",
      dot: "bg-rose-500",
    },
    critical: {
      badge: "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/60",
      dot: "bg-purple-500",
    },
    commercial: {
      badge: "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60",
      dot: "bg-sky-500",
    },
    standard: {
      badge: "bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-300 border-navy-200 dark:border-navy-700",
      dot: "bg-navy-400",
    },
    solar: {
      badge: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60",
      dot: "bg-amber-500",
    },
    wind: {
      badge: "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60",
      dot: "bg-sky-500",
    },
    hydro: {
      badge: "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/60",
      dot: "bg-cyan-500",
    },
    neutral: {
      badge: "bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-300 border-navy-200 dark:border-navy-700",
      dot: "bg-navy-400",
    },
  }[variant];

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  }[size];

  const displayLabel = label || status.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border tracking-wide uppercase ${variantStyles.badge} ${sizeStyles} ${className}`}
    >
      {withDot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${variantStyles.dot}`} />}
      <span>{displayLabel}</span>
    </span>
  );
};
