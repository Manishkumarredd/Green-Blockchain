import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface StatisticCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: string | number;
  trend?: "up" | "down" | "neutral";
  timeframe?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  className?: string;
}

export const StatisticCard: React.FC<StatisticCardProps> = ({
  title,
  value,
  unit,
  change,
  trend = "neutral",
  timeframe = "vs. last cycle",
  icon,
  iconBgColor = "bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 border border-brand-200/50 dark:border-brand-800/40",
  className = "",
}) => {
  const trendColor = {
    up: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/60 dark:border-emerald-800/30",
    down: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200/60 dark:border-rose-800/30",
    neutral: "text-navy-500 dark:text-navy-400 bg-navy-100 dark:bg-navy-800 border-navy-200/60 dark:border-navy-700/40",
  }[trend];

  const TrendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  }[trend];

  return (
    <div
      className={`bg-white dark:bg-navy-900/90 rounded-2xl p-5 sm:p-6 border border-navy-200 dark:border-navy-800 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs uppercase font-bold tracking-wider text-navy-500 dark:text-navy-400 line-clamp-1">
          {title}
        </span>
        {icon && (
          <div className={`p-2.5 rounded-xl flex-shrink-0 flex items-center justify-center ${iconBgColor}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
            {value}
          </span>
          {unit && (
            <span className="text-sm font-semibold text-navy-500 dark:text-navy-400">
              {unit}
            </span>
          )}
        </div>

        {(change !== undefined || timeframe) && (
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            {change !== undefined && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${trendColor}`}
              >
                <TrendIcon className="w-3 h-3" />
                {typeof change === "number" && change > 0 ? `+${change}%` : `${change}%`}
              </span>
            )}
            {timeframe && (
              <span className="text-xs text-navy-400 dark:text-navy-500 font-medium">
                {timeframe}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
