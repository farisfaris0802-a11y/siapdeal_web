import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";

import { LocalDemoLink } from "@/components/auth/local-demo-link";
import { Logo } from "@/components/logo";
import { MobileSiteNav } from "@/components/site-mobile-nav";

const navItems = [
  { href: "/simulasi/baru", label: "Persona Buyer" },
  { href: "#rubrik", label: "Fitur AI" },
  { href: "#cara-kerja", label: "Cara Kerja" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <Logo
            href="/"
            inverted
            showTagline={false}
            wordmarkClassName="text-base sm:text-xl"
          />
          <span className="hidden rounded-full border border-emerald-800 bg-emerald-950/80 px-2 py-0.5 text-[9px] font-medium text-emerald-400 sm:inline-flex">
            v1.0 MVP
          </span>
        </div>

        <nav className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-300 transition-colors hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LocalDemoLink
            href="/simulator"
            ariaLabel="Mode Demo"
            className="hidden h-9 items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-2.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/20 min-[390px]:inline-flex sm:px-3"
          >
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Mode Demo</span>
          </LocalDemoLink>

          <LocalDemoLink
            href="/simulator"
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-md shadow-emerald-950 transition-colors hover:bg-emerald-500 sm:h-10 sm:px-4 sm:py-0 sm:text-sm"
          >
            <ArrowRight className="h-4 w-4" />
            <span className="min-[360px]:hidden">Mulai</span>
            <span className="hidden min-[360px]:inline">Mulai Gratis</span>
          </LocalDemoLink>

          <MobileSiteNav items={navItems} />
        </div>
      </div>
    </header>
  );
}
