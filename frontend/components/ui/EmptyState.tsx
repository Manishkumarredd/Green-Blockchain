import React from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white dark:bg-navy-900/80 rounded-2xl border border-dashed border-navy-200 dark:border-navy-800 ${className}`}
    >
      <div className="p-4 rounded-2xl bg-navy-50 dark:bg-navy-800/60 text-navy-400 dark:text-navy-500 mb-4">
        {icon || <FolderOpen className="w-8 h-8" />}
      </div>

      <h3 className="text-base sm:text-lg font-bold text-navy-900 dark:text-white tracking-tight mb-1">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-navy-500 dark:text-navy-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
