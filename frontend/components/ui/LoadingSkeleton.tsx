import React from "react";

export const Skeleton: React.FC<{
  className?: string;
  width?: string;
  height?: string;
  rounded?: string;
}> = ({ className = "", width, height, rounded = "rounded-xl" }) => {
  return (
    <div
      style={{ width, height }}
      className={`bg-navy-200/70 dark:bg-navy-800 animate-pulse ${rounded} ${className}`}
    />
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl p-5 sm:p-6 border border-navy-200 dark:border-navy-800 shadow-card flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 4,
  cols = 5,
}) => {
  return (
    <div className="w-full rounded-2xl border border-navy-200 dark:border-navy-800 bg-white dark:bg-navy-900 p-4 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-navy-100 dark:border-navy-800">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={`s-row-${rIdx}`} className="flex items-center gap-4">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <Skeleton key={`s-col-${cIdx}`} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
