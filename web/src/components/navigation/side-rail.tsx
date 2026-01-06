"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Folder,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavItem, NavItemButton } from "./nav-item";
import { Button } from "@/components/ui/button";

interface SideRailProps {
  className?: string;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const NAV_ITEMS = [
  { href: "/hub", icon: Home, label: "Dashboard" },
  { href: "/partners", icon: Users, label: "Partners" },
  { href: "/artifacts", icon: Folder, label: "Artifacts" },
  { href: "/settings", icon: Settings, label: "Settings" },
] as const;

export function SideRail({
  className,
  defaultExpanded = false,
  onExpandedChange,
}: SideRailProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const pathname = usePathname();

  const handleToggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandedChange?.(newExpanded);
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
        isExpanded ? "w-64" : "w-16",
        className
      )}
    >
      {/* Logo area */}
      <div
        className={cn(
          "flex h-16 items-center border-b px-4",
          isExpanded ? "justify-between" : "justify-center"
        )}
      >
        {isExpanded && (
          <span className="font-serif text-lg font-semibold">Diadi</span>
        )}
        <button
          type="button"
          onClick={handleToggleExpanded}
          className="rounded-lg p-1.5 hover:bg-sidebar-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={isExpanded}
          aria-controls="sidebar-navigation"
        >
          {isExpanded ? (
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav
        id="sidebar-navigation"
        aria-label="Main navigation"
        className="flex-1 space-y-1 px-2 py-4"
      >
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname.startsWith(item.href)}
            isExpanded={isExpanded}
          />
        ))}
      </nav>

      {/* New Session CTA */}
      <div className="border-t p-4">
        {isExpanded ? (
          <Button asChild className="w-full" variant="secondary">
            <a href="/sessions/new">
              <Plus className="h-4 w-4" />
              <span>New Session</span>
            </a>
          </Button>
        ) : (
          <Button
            asChild
            size="icon"
            variant="secondary"
            className="w-full"
            title="New Session"
            aria-label="New Session"
          >
            <a href="/sessions/new">
              <Plus className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">New Session</span>
            </a>
          </Button>
        )}
      </div>

      {/* Collapse button (expanded state) */}
      {isExpanded && (
        <div className="border-t px-4 py-3">
          <NavItemButton
            icon={ChevronLeft}
            label="Collapse"
            isExpanded={isExpanded}
            onClick={handleToggleExpanded}
          />
        </div>
      )}
    </aside>
  );
}
