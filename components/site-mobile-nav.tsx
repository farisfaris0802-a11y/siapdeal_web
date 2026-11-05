"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

type NavItem = { href: string; label: string };

export function MobileSiteNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative lg:hidden">
      <button
        type="button"
        aria-label={open ? "Tutup menu" : "Buka menu"}
        aria-expanded={open}
        aria-controls="site-mobile-nav"
        onClick={() => setOpen((value) => !value)}
        className="grid h-9 w-9 place-items-center rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 transition-colors hover:bg-slate-800 hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Tutup menu"
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div
            id="site-mobile-nav"
            className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl"
          >
            <nav className="grid gap-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-900 hover:text-emerald-400"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-2 border-t border-slate-800 px-3 pt-2.5">
              <span className="text-[10px] font-medium text-emerald-400">
                v1.0 MVP
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
