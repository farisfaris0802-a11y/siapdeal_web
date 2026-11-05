"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardCheck,
  History,
  LayoutDashboard,
  PlusCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/simulasi/baru", label: "Simulasi Baru", icon: PlusCircle, exact: false },
  { href: "/dashboard#riwayat", label: "Riwayat Sesi", icon: History, exact: false },
  { href: "/evaluasi", label: "Evaluasi", icon: ClipboardCheck, exact: false },
];

function isActive(pathname: string, href: string, exact: boolean) {
  if (href.startsWith("/dashboard#")) return false;
  if (href === "/simulasi/baru") return pathname.startsWith("/simulasi");
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {primaryNav.map((item) => {
        const active = isActive(pathname, item.href, item.exact);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-colors duration-200",
              active
                ? "bg-primary-foreground/10 text-primary-foreground ring-1 ring-inset ring-primary-foreground/15"
                : "text-primary-foreground/55 hover:bg-primary-foreground/5 hover:text-primary-foreground"
            )}
          >
            <item.icon
              className={cn(
                "h-[18px] w-[18px] transition-colors",
                active
                  ? "text-accent"
                  : "text-primary-foreground/35 group-hover:text-accent/80"
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/simulasi/baru", label: "Latihan", icon: PlusCircle },
    { href: "/dashboard#riwayat", label: "Riwayat", icon: History },
    { href: "/evaluasi", label: "Evaluasi", icon: ClipboardCheck },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="grid grid-cols-4">
        {items.map((item) => {
          const active = isActive(pathname, item.href, item.href === "/dashboard");

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors duration-200",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
