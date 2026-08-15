"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface DropdownSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: (string | SelectOption)[];
  className?: string;
  buttonClassName?: string;
  fullWidth?: boolean;
}

function ChevronDownIcon({ className, size = 12 }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function DropdownSelect({
  id,
  value,
  onChange,
  options,
  className,
  buttonClassName,
  fullWidth = false,
}: DropdownSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize options to SelectOption[]
  const normalizedOptions: SelectOption[] = options.map((opt) => {
    if (typeof opt === "string") {
      return { value: opt, label: opt };
    }
    return opt;
  });

  // Get current selected option label
  const selectedOption = normalizedOptions.find((opt) => opt.value === value) || {
    value,
    label: value,
  };

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={dropdownRef}
      className={cn("relative inline-block text-left", fullWidth ? "w-full" : "", className)}
    >
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:border-muted-foreground/30 focus:outline-none transition-colors duration-150 cursor-pointer select-none active-press-subtle",
          fullWidth ? "w-full" : "",
          buttonClassName
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDownIcon
          size={12}
          className={cn(
            "text-muted-foreground transition-transform duration-200 shrink-0 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute mt-1 z-50 rounded-lg border border-border bg-card p-1 shadow-lg ring-1 ring-black/5 focus:outline-none animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto min-w-[140px] origin-top-left popover-origin-left",
            fullWidth ? "w-full left-0 right-0" : "left-0"
          )}
          role="listbox"
        >
          <div className="space-y-0.5">
            {normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 text-xs rounded-md text-left transition-all duration-120 hover:pl-3.5 cursor-pointer select-none",
                    isSelected
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground hover:bg-muted"
                  )}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="truncate pr-4">{opt.label}</span>
                  {isSelected && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="size-3.5 text-primary shrink-0 animate-in zoom-in-90 duration-100"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
