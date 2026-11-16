import React from "react";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className = "",
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 ${className}`}>
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-navy-400 dark:text-navy-500 mb-1.5">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={`crumb-${idx}`}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-navy-300 dark:text-navy-600" />}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="hover:text-brand-600 dark:hover:text-brand-400 transition"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-navy-600 dark:text-navy-300 font-medium">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-1 text-xs sm:text-sm text-navy-500 dark:text-navy-400">
            {subtitle}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
    </div>
  );
};
