"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MobileNavigation } from "./mobile-navigation";

/** Used only by the development header; both slots are rendered on the server. */
export function PreviewMobileNavigation({ standard, cinematic, publicNavigation }: { standard: ReactNode; cinematic: ReactNode; publicNavigation: ReactNode }) {
  const pathname = usePathname();
  const content = pathname === "/design-preview/living-ledger-cinematic" ? cinematic
    : pathname === "/design-preview/living-ledger" ? standard : publicNavigation;
  return <MobileNavigation>{content}</MobileNavigation>;
}
