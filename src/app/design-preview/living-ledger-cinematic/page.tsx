import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "The Living Ledger — Cinematic local design study",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function CinematicLedgerPage() {
  // Build-time guard, before importing any preview presentation.
  if (process.env.NODE_ENV !== "development") notFound();
  const { CinematicLedgerPrototype } = await import("@/components/design-preview/living-ledger-cinematic/prototype");
  return <CinematicLedgerPrototype />;
}
