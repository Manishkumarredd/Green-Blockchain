import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  borderAccent?: "green" | "blue" | "amber" | "purple" | "none";
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  borderAccent = "none",
  className = "",
  ...props
}) => {
  const accentStyles = {
    none: "",
    green: "border-l-4 border-l-brand-600 dark:border-l-brand-500",
    blue: "border-l-4 border-l-sky-500 dark:border-l-sky-400",
    amber: "border-l-4 border-l-amber-500 dark:border-l-amber-400",
    purple: "border-l-4 border-l-purple-500 dark:border-l-purple-400",
  };

  return (
    <div
      className={`bg-white dark:bg-navy-900/90 text-navy-900 dark:text-navy-100 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-card transition-all duration-200 ${
        hoverable ? "hover:shadow-card-hover hover:border-navy-300 dark:hover:border-navy-700" : ""
      } ${accentStyles[borderAccent]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`p-5 sm:p-6 pb-2 sm:pb-3 flex flex-col gap-1 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <h3 className={`text-base sm:text-lg font-bold text-navy-900 dark:text-white tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <p className={`text-xs sm:text-sm text-navy-500 dark:text-navy-400 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`p-5 sm:p-6 pt-2 sm:pt-3 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div
    className={`p-5 sm:p-6 pt-0 border-t border-navy-100 dark:border-navy-800/80 mt-4 flex items-center justify-between text-xs text-navy-500 dark:text-navy-400 ${className}`}
    {...props}
  >
    {children}
  </div>
);
