import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRE Knowledge Platform",
  description:
    "Commercial real estate underwriting, financial modeling, lending, valuation and investment analysis.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body>{children}</body>
    </html>
  );
}
