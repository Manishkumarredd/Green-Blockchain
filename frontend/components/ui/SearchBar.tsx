import React, { useRef } from "react";
import { Search, X } from "lucide-react";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  shortcutHint?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search orders, certificates, transactions...",
  shortcutHint = "⌘K",
  className = "",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Search className="absolute left-3.5 w-4 h-4 text-navy-400 dark:text-navy-500 pointer-events-none" />

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder-navy-400 dark:placeholder-navy-500 text-sm rounded-xl border border-navy-200 dark:border-navy-700 pl-10 pr-16 py-2 transition-all outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm"
      />

      <div className="absolute right-3 flex items-center gap-1.5">
        {value ? (
          <button
            onClick={handleClear}
            className="p-1 rounded-md text-navy-400 hover:text-navy-600 dark:hover:text-navy-200 hover:bg-navy-100 dark:hover:bg-navy-800 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : shortcutHint ? (
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-navy-400 dark:text-navy-500 bg-navy-100 dark:bg-navy-800 rounded border border-navy-200 dark:border-navy-700">
            {shortcutHint}
          </kbd>
        ) : null}
      </div>
    </div>
  );
};
