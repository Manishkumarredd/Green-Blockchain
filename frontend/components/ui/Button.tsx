import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}) => {
  // Variant styles
  const variantStyles = {
    primary:
      "bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white shadow-sm hover:shadow-brand-glow border border-transparent focus:ring-brand-500",
    secondary:
      "bg-white dark:bg-navy-800 text-navy-800 dark:text-navy-100 hover:bg-navy-50 dark:hover:bg-navy-700 border border-navy-200 dark:border-navy-700 shadow-sm focus:ring-navy-400",
    outline:
      "bg-transparent text-brand-600 dark:text-brand-400 border border-brand-600 dark:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/40 focus:ring-brand-500",
    ghost:
      "bg-transparent text-navy-600 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-800 hover:text-navy-900 dark:hover:text-white border border-transparent focus:ring-navy-400",
    danger:
      "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm focus:ring-red-500 border border-transparent",
  };

  // Size styles
  const sizeStyles = {
    sm: "px-2.5 py-1.5 text-xs font-medium rounded-lg gap-1.5",
    md: "px-4 py-2 text-sm font-semibold rounded-xl gap-2",
    lg: "px-5 py-2.5 text-base font-semibold rounded-xl gap-2.5",
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      disabled={isDisabled}
      className={`inline-flex items-center justify-center transition-all duration-150 select-none outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-navy-950 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-0.5 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          {loadingText ? <span>{loadingText}</span> : children}
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
