"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  className?: string;
}

const MOBILE_NAV_ITEMS = [
  { href: "/hub", icon: Home, label: "Home" },
  { href: "/partners", icon: Users, label: "Partners" },
] as const;

export function MobileNav({ className }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex md:hidden",
        "border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        "safe-area-inset-bottom",
        className
      )}
    >
      <div className="flex w-full items-center justify-around px-4 py-2">
        {/* Home button */}
        <MobileNavItem
          href={MOBILE_NAV_ITEMS[0].href}
          icon={MOBILE_NAV_ITEMS[0].icon}
          label={MOBILE_NAV_ITEMS[0].label}
          isActive={pathname.startsWith(MOBILE_NAV_ITEMS[0].href)}
        />

        {/* Center CTA button - New Session */}
        <Link
          href="/sessions/new"
          className={cn(
            "flex h-14 w-14 -mt-6 items-center justify-center rounded-full",
            "bg-secondary text-secondary-foreground shadow-elevated",
            "hover:bg-secondary/90 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          aria-label="New Session"
        >
          <Plus className="h-6 w-6" />
        </Link>

        {/* Partners button */}
        <MobileNavItem
          href={MOBILE_NAV_ITEMS[1].href}
          icon={MOBILE_NAV_ITEMS[1].icon}
          label={MOBILE_NAV_ITEMS[1].label}
          isActive={pathname.startsWith(MOBILE_NAV_ITEMS[1].href)}
        />
      </div>
    </nav>
  );
}

interface MobileNavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
}

function MobileNavItem({
  href,
  icon: Icon,
  label,
  isActive = false,
}: MobileNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-1 px-4 py-2 text-xs transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className={cn("h-5 w-5", isActive && "text-secondary")} />
      <span className={cn(isActive && "font-medium")}>{label}</span>
    </Link>
  );
}
