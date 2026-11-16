import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
  className = "",
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize;

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-2 ${className}`}>
      {totalItems !== undefined && (
        <span className="text-xs text-navy-500 dark:text-navy-400">
          Showing <span className="font-semibold text-navy-800 dark:text-navy-200">{startItem}</span> to{" "}
          <span className="font-semibold text-navy-800 dark:text-navy-200">{endItem}</span> of{" "}
          <span className="font-semibold text-navy-800 dark:text-navy-200">{totalItems}</span> results
        </span>
      )}

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2 rounded-xl text-navy-600 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-800 disabled:opacity-40 disabled:pointer-events-none transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, idx) => {
          if (page === "...") {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-navy-400">
                ...
              </span>
            );
          }
          const isCurrent = page === currentPage;
          return (
            <button
              key={`page-${page}`}
              onClick={() => onPageChange(Number(page))}
              className={`w-8 h-8 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isCurrent
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-navy-700 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-800"
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2 rounded-xl text-navy-600 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-800 disabled:opacity-40 disabled:pointer-events-none transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
