"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  isExpanded?: boolean;
  onClick?: () => void;
}

export function NavItem({
  href,
  icon: Icon,
  label,
  isActive = false,
  isExpanded = false,
  onClick,
}: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={!isExpanded ? label : undefined}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground",
        !isExpanded && "justify-center"
      )}
      title={!isExpanded ? label : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {isExpanded ? (
        <span>{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </Link>
  );
}

export interface NavItemButtonProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  isExpanded?: boolean;
  onClick?: () => void;
}

export function NavItemButton({
  icon: Icon,
  label,
  isActive = false,
  isExpanded = false,
  onClick,
}: NavItemButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={!isExpanded ? label : undefined}
      aria-pressed={isActive}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground",
        !isExpanded && "justify-center"
      )}
      title={!isExpanded ? label : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {isExpanded ? (
        <span>{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </button>
  );
}
