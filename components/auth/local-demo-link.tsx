"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const DEMO_NAME = "Juri / Pengguna Demo";

type LocalDemoLinkProps = {
  href?: string;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
};

export const LocalDemoLink = forwardRef<HTMLAnchorElement, LocalDemoLinkProps>(
  function LocalDemoLink({ href = "/simulator", className, children, ariaLabel }, ref) {
    const router = useRouter();

    return (
      <Link
        ref={ref}
        href={href}
        className={className}
        aria-label={ariaLabel}
        onClick={(event) => {
          if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          ) {
            return;
          }

          event.preventDefault();
          window.localStorage.setItem(
            "siapdeal_session",
            JSON.stringify({
              name: DEMO_NAME,
              role: "jury",
              loggedInAt: new Date().toISOString(),
            })
          );
          router.push(href);
        }}
      >
        {children}
      </Link>
    );
  }
);
