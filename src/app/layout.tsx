import localFont from "next/font/local";
import { pageMetadata } from "@/seo/metadata";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const sourceSans = localFont({
  src: "./fonts/source-sans-3-latin.woff2",
  variable: "--font-source-sans",
  weight: "400 700",
  style: "normal",
  display: "swap",
  fallback: ["Arial", "Helvetica", "sans-serif"],
  adjustFontFallback: "Arial",
});

const sourceSerif = localFont({
  src: "./fonts/source-serif-4-latin.woff2",
  variable: "--font-source-serif",
  weight: "400 600",
  style: "normal",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: "Times New Roman",
});

export const metadata = pageMetadata("layout");

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sourceSans.variable} ${sourceSerif.variable} h-full antialiased`}>
      <body>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-control focus:bg-elevated focus:px-5 focus:py-3 focus:font-semibold">
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main-content" tabIndex={-1}>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
