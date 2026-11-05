import Link from "next/link";
import { LogOut, PlusCircle } from "lucide-react";

import { Logo } from "@/components/logo";
import { MobileNav, SidebarNav } from "@/components/app-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

export function AppShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Pengguna";
  const isJudge =
    Boolean(user.is_anonymous) || user.user_metadata?.role === "judge";
  const email = isJudge ? "Mode demo" : user.email ?? "";

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col overflow-hidden bg-ink px-4 py-6 lg:flex">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-primary-foreground/5" />

        <div className="relative px-2">
          <Logo href="/dashboard" inverted />
        </div>

        <Button
          asChild
          className="relative mt-7 h-11 w-full justify-start rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-sm transition hover:bg-accent/90"
        >
          <Link href="/simulasi/baru">
            <PlusCircle className="h-4 w-4" />
            Simulasi Baru
          </Link>
        </Button>

        <div className="relative mt-7 flex-1">
          <p className="mb-3 px-3.5 text-[11px] font-medium text-primary-foreground/35">
            Menu
          </p>
          <SidebarNav />
        </div>

        <div className="relative">
          <div className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Avatar className="h-10 w-10 border border-primary-foreground/10">
                  <AvatarFallback className="bg-accent/15 text-xs font-bold text-accent">
                    {initials(fullName)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-xs font-semibold text-primary-foreground">
                    {fullName}
                  </p>
                  {isJudge && (
                    <span className="shrink-0 rounded-full bg-brand-teal/15 px-1.5 py-0.5 text-[9px] font-semibold text-brand-mint">
                      Demo
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[10px] text-primary-foreground/40">
                  {email}
                </p>
                <p className="mt-1 text-[9px] font-medium text-brand-mint/80">
                  Online, Free Plan
                </p>
              </div>
              <form action="/auth/signout" method="post">
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon-sm"
                  className="text-primary-foreground/40 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  aria-label="Keluar dari akun"
                  title="Keluar"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 border-b border-primary-foreground/10 bg-ink lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Logo href="/dashboard" inverted compact />
          <div className="flex items-center gap-2">
            <form action="/auth/signout" method="post">
              <Button
                type="submit"
                variant="ghost"
                size="icon-sm"
                aria-label="Keluar dari akun"
                className="text-primary-foreground/55 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
            <Link href="/dashboard" aria-label="Profil">
              <Avatar className="h-8 w-8 border border-primary-foreground/10">
                <AvatarFallback className="bg-brand-teal/20 text-[10px] font-bold text-brand-mint">
                  {initials(fullName)}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      <div className="lg:pl-[260px]">
        <main className="min-h-[calc(100dvh-3.5rem)] pb-20 lg:min-h-screen lg:pb-0">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
