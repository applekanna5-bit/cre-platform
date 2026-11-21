"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { NavigationList } from "./navigation-list";
import { primaryNavigation } from "@/config/navigation";

function subscribeToFragment(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

const readFragment = () => window.location.hash;
const serverFragment = () => "";

export function PrimaryNavigation({ horizontal }: { horizontal?: boolean }) {
  const pathname = usePathname();
  const fragment = useSyncExternalStore(subscribeToFragment, readFragment, serverFragment);
  const page = primaryNavigation.find(item => item.href === pathname);
  const section = primaryNavigation.find(item => item.href === `${pathname}${fragment}`);
  const parentId = pathname?.startsWith("/content/underwriting/") ? "underwriting" : undefined;
  const locationId = section?.id ?? parentId;

  return <NavigationList items={primaryNavigation} horizontal={horizontal} current={
    page ? { id: page.id, type: "page" } : locationId ? { id: locationId, type: "location" } : undefined
  } />;
}
