import React, { useState } from "react";

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  timeframes?: string[];
  selectedTimeframe?: string;
  onTimeframeChange?: (tf: string) => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
  height?: string | number;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  timeframes = ["24H", "7D", "30D", "1Y"],
  selectedTimeframe: controlledTf,
  onTimeframeChange,
  actions,
  children,
  height = 300,
  className = "",
}) => {
  const [internalTf, setInternalTf] = useState(timeframes[1] || "7D");
  const activeTf = controlledTf || internalTf;

  const handleTfClick = (tf: string) => {
    setInternalTf(tf);
    onTimeframeChange?.(tf);
  };

  return (
    <div
      className={`bg-white dark:bg-navy-900/90 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-card p-5 sm:p-6 ${className}`}
    >
      {/* Header with Title and Timeframe Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-navy-900 dark:text-white tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-navy-500 dark:text-navy-400">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {actions}
          {timeframes.length > 0 && (
            <div className="flex items-center bg-navy-100 dark:bg-navy-800 p-1 rounded-xl">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => handleTfClick(tf)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    activeTf === tf
                      ? "bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-sm"
                      : "text-navy-500 dark:text-navy-400 hover:text-navy-900 dark:hover:text-white"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div style={{ minHeight: height }} className="w-full relative flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};
