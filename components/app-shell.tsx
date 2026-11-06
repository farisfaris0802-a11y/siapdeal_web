"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, PlusCircle } from "lucide-react";

import { LanguageToggle } from "@/components/language-toggle";
import { Logo } from "@/components/logo";
import { MobileNav, SidebarNav } from "@/components/app-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLanguage } from "@/lib/i18n";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn, initials } from "@/lib/utils";

const fullName = "Juri Demo";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const isChatRoute =
    !!pathname &&
    /^\/simulasi\/[^/]+$/.test(pathname) &&
    pathname !== "/simulasi/baru";

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col overflow-hidden bg-ink px-4 py-6 lg:flex">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-white/5" />

        <div className="relative px-2">
          <Logo href="/dashboard" inverted />
        </div>

        <Button
          asChild
          className="relative mt-7 h-11 w-full justify-start rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-sm transition hover:bg-accent/90"
        >
          <Link href="/simulasi/baru">
            <PlusCircle className="h-4 w-4" />
            {t("Simulasi Baru")}
          </Link>
        </Button>

        <div className="relative mt-7 flex-1">
          <p className="mb-3 px-3.5 text-[11px] font-medium text-white/35">
            Menu
          </p>
          <SidebarNav />
        </div>

        <div className="relative">
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <span className="text-[10px] font-medium text-white/45">
              {t("Bahasa")}
            </span>
            <LanguageToggle inverted compact />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Avatar className="h-10 w-10 border border-white/10">
                  <AvatarFallback className="bg-accent/15 text-xs font-bold text-accent">
                    {initials(fullName)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-xs font-semibold text-white">
                    {fullName}
                  </p>
                  <span className="shrink-0 rounded-full bg-brand-teal/15 px-1.5 py-0.5 text-[9px] font-semibold text-brand-mint">
                    Demo
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[10px] text-white/40">
                  {t("Mode demo lokal")}
                </p>
                <p className="mt-1 text-[9px] font-medium text-brand-mint/80">
                  Online, Free Plan
                </p>
              </div>
              <ThemeToggle inverted label={false} className="shrink-0" />
              <form action="/auth/signout" method="post">
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon-sm"
                  className="text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Keluar"
                  title="Keluar"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar — hidden inside the immersive chat room */}
      {!isChatRoute && (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-ink pt-[env(safe-area-inset-top)] lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Logo href="/dashboard" inverted compact />
            <div className="flex items-center gap-1">
              <LanguageToggle inverted compact />
              <ThemeToggle
                inverted
                label={false}
                className="h-8 w-8 px-0"
              />
              <form action="/auth/signout" method="post">
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Keluar"
                  className="text-white/55 hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
              <Link href="/dashboard" aria-label="Profil">
                <Avatar className="h-8 w-8 border border-white/10">
                  <AvatarFallback className="bg-brand-teal/20 text-[10px] font-bold text-brand-mint">
                    {initials(fullName)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </header>
      )}

      <div className="lg:pl-[260px]">
        <main
          className={cn(
            "min-h-[calc(100dvh-3.5rem)] pb-[calc(5rem_+_env(safe-area-inset-bottom))] lg:min-h-screen lg:pb-0",
            isChatRoute && "min-h-[100dvh] pb-0"
          )}
        >
          {children}
        </main>
      </div>

      {!isChatRoute && <MobileNav />}
    </div>
  );
}
