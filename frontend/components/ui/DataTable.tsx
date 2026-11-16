import React from "react";
import { Pagination, PaginationProps } from "./Pagination";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor?: (row: T, index: number) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  pagination?: PaginationProps;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = "No records found.",
  onRowClick,
  pagination,
  className = "",
}: DataTableProps<T>) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-navy-200 dark:border-navy-800 bg-white dark:bg-navy-900/90 shadow-card ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-navy-200 dark:border-navy-800 bg-navy-50/75 dark:bg-navy-950/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-navy-500 dark:text-navy-400 ${
                    alignClass[col.align || "left"]
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-navy-100 dark:divide-navy-800/80">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, rIdx) => (
                <tr key={`loading-row-${rIdx}`} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={`loading-col-${col.key}`} className="py-4 px-4">
                      <div className="h-4 bg-navy-200 dark:bg-navy-800 rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 px-4 text-center text-sm text-navy-400 dark:text-navy-500 font-medium"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => {
                const rowKey = keyExtractor ? keyExtractor(row, rowIdx) : row.id || rowIdx;
                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`transition-colors duration-150 ${
                      onRowClick
                        ? "cursor-pointer hover:bg-navy-50/80 dark:hover:bg-navy-800/50"
                        : "hover:bg-slate-50/50 dark:hover:bg-navy-800/30"
                    }`}
                  >
                    {columns.map((col) => (
                      <td
                        key={`cell-${rowKey}-${col.key}`}
                        className={`py-3.5 px-4 text-navy-800 dark:text-navy-200 ${
                          alignClass[col.align || "left"]
                        }`}
                      >
                        {col.render ? col.render(row, rowIdx) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="border-t border-navy-100 dark:border-navy-800 px-4 py-2">
          <Pagination {...pagination} />
        </div>
      )}
    </div>
  );
}
