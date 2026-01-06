"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * SearchIcon component for the search input.
 */
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4", className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

/**
 * SearchBar provides a styled search input for filtering sessions and partners.
 * Used in the Hub and other list views.
 */
export function SearchBar({
  value,
  onChange,
  placeholder = "Find sessions, partners, or goals...",
  className,
}: SearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10"
      />
    </div>
  );
}
