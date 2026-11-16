import React, { forwardRef } from "react";

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      children,
      error,
      helperText,
      fullWidth = true,
      className = "",
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={`${fullWidth ? "w-full" : "inline-block"} flex flex-col gap-1.5`}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-navy-700 dark:text-navy-300"
          >
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={`w-full appearance-none bg-white dark:bg-navy-900 text-navy-900 dark:text-white text-sm rounded-xl border transition-all duration-150 outline-none pl-3.5 pr-10 py-2.5 ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-navy-200 dark:border-navy-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            } disabled:bg-navy-50 dark:disabled:bg-navy-950 disabled:text-navy-400 disabled:cursor-not-allowed cursor-pointer ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          {/* Custom Chevron Down */}
          <div className="absolute right-3.5 pointer-events-none text-navy-400 dark:text-navy-500 flex items-center">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {error ? (
          <span className="text-xs text-red-500 font-medium">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-navy-500 dark:text-navy-400">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
