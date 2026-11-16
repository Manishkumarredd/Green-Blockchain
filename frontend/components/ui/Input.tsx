import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      startIcon,
      endIcon,
      fullWidth = true,
      className = "",
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={`${fullWidth ? "w-full" : "inline-block"} flex flex-col gap-1.5`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-navy-700 dark:text-navy-300"
          >
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {startIcon && (
            <span className="absolute left-3.5 text-navy-400 dark:text-navy-500 pointer-events-none flex items-center justify-center">
              {startIcon}
            </span>
          )}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`w-full bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder-navy-400 dark:placeholder-navy-500 text-sm rounded-xl border transition-all duration-150 outline-none ${
              startIcon ? "pl-10" : "pl-3.5"
            } ${endIcon ? "pr-10" : "pr-3.5"} py-2.5 ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-navy-200 dark:border-navy-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            } disabled:bg-navy-50 dark:disabled:bg-navy-950 disabled:text-navy-400 disabled:cursor-not-allowed ${className}`}
            {...props}
          />

          {endIcon && (
            <span className="absolute right-3.5 text-navy-400 dark:text-navy-500 flex items-center justify-center">
              {endIcon}
            </span>
          )}
        </div>

        {error ? (
          <span className="text-xs text-red-500 font-medium flex items-center gap-1">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </span>
        ) : helperText ? (
          <span className="text-xs text-navy-500 dark:text-navy-400">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
