"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** A non-modal disclosure: native keyboard support and a working no-JS fallback. */
export function MobileNavigation({ children }: { children: ReactNode }) {
  const disclosure = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 64rem)");
    function closeOnDesktop() {
      if (desktop.matches && disclosure.current) {
        const containedFocus = disclosure.current.contains(document.activeElement);
        disclosure.current.open = false;
        if (containedFocus) document.getElementById("site-brand")?.focus();
      }
    }
    closeOnDesktop();
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <details
      ref={disclosure}
      className="group w-full lg:hidden"
      onKeyDown={(event) => {
        if (event.key === "Escape" && disclosure.current?.open) {
          event.preventDefault();
          disclosure.current.open = false;
          trigger.current?.focus();
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
      }}
      onClick={(event) => {
        const link = (event.target as HTMLElement).closest("a");
        if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.currentTarget.open = false;
        const destination = new URL(link.href);
        if (destination.pathname === window.location.pathname && destination.hash) {
          document.getElementById(destination.hash.slice(1))?.focus();
        }
      }}
    >
      <summary ref={trigger} aria-controls="mobile-primary-navigation" className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-control border border-border-strong bg-elevated px-4 py-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <span>Menu</span>
        <span aria-hidden="true" className="group-open:hidden">+</span>
        <span aria-hidden="true" className="hidden group-open:inline">−</span>
      </summary>
      <nav id="mobile-primary-navigation" aria-label="Primary" className="mt-3 border-t border-border pt-3">
        {children}
      </nav>
    </details>
  );
}
