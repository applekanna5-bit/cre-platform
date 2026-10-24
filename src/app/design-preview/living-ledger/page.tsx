import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "The Living Ledger — Local design study",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function LivingLedgerPage() {
  // Next replaces NODE_ENV at build time. Production never imports or renders the prototype.
  if (process.env.NODE_ENV !== "development") notFound();
  const { LivingLedgerPrototype } = await import("@/components/design-preview/living-ledger/prototype");
  return <LivingLedgerPrototype />;
}
