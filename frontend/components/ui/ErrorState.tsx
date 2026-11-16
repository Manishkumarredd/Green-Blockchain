import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Unable to load data",
  message,
  onRetry,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-navy-900/80 rounded-2xl border border-rose-200 dark:border-rose-900/50 ${className}`}
    >
      <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>

      <h4 className="text-base font-bold text-navy-900 dark:text-white tracking-tight mb-1">
        {title}
      </h4>

      <p className="text-xs sm:text-sm text-navy-500 dark:text-navy-400 max-w-sm mb-5 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={onRetry}
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
