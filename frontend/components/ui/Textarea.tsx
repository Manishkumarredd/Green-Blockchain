import React, { forwardRef } from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      showCount = false,
      fullWidth = true,
      className = "",
      disabled,
      id,
      maxLength,
      value,
      ...props
    },
    ref
  ) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className={`${fullWidth ? "w-full" : "inline-block"} flex flex-col gap-1.5`}>
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={textareaId}
              className="text-xs font-semibold text-navy-700 dark:text-navy-300"
            >
              {label}
              {props.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          )}
          {showCount && maxLength && (
            <span className="text-[11px] text-navy-400 dark:text-navy-500">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>

        <textarea
          id={textareaId}
          ref={ref}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          className={`w-full bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder-navy-400 dark:placeholder-navy-500 text-sm rounded-xl border transition-all duration-150 outline-none p-3.5 min-h-[100px] resize-y ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "border-navy-200 dark:border-navy-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          } disabled:bg-navy-50 dark:disabled:bg-navy-950 disabled:text-navy-400 disabled:cursor-not-allowed ${className}`}
          {...props}
        />

        {error ? (
          <span className="text-xs text-red-500 font-medium">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-navy-500 dark:text-navy-400">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
