import React, { useState, useRef, useEffect } from "react";
import { Filter, Check, ChevronDown } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  options,
  selectedValues,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
          selectedValues.length > 0
            ? "bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400 border-brand-300 dark:border-brand-800"
            : "bg-white dark:bg-navy-900 text-navy-700 dark:text-navy-300 border-navy-200 dark:border-navy-700 hover:bg-navy-50 dark:hover:bg-navy-800"
        }`}
      >
        <Filter className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{label}</span>
        {selectedValues.length > 0 && (
          <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] flex items-center justify-center font-bold">
            {selectedValues.length}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-navy-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-xl p-2 z-30 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-navy-100 dark:border-navy-800 mb-1">
            <span className="text-[11px] font-bold text-navy-400 uppercase tracking-wider">
              Filter by {label}
            </span>
            {selectedValues.length > 0 && (
              <button
                onClick={clearAll}
                className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = selectedValues.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleOption(opt.value)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
                    isSelected
                      ? "bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300"
                      : "text-navy-700 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-800"
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
