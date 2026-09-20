import type { ComponentPropsWithoutRef } from "react";

function classes(...values: (string | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

const widths = {
  wide: "max-w-7xl",
  content: "max-w-5xl",
  reading: "max-w-[68ch]",
};

export function Container({
  width = "wide",
  className,
  ...props
}: ComponentPropsWithoutRef<"div"> & { width?: keyof typeof widths }) {
  return <div className={classes("mx-auto w-full px-5 sm:px-8", widths[width], className)} {...props} />;
}

export function Section({ className, ...props }: ComponentPropsWithoutRef<"section">) {
  return <section className={classes("py-10 sm:py-14", className)} {...props} />;
}

export function Eyebrow({ tone = "default", className, ...props }: ComponentPropsWithoutRef<"p"> & { tone?: "default" | "analytical" }) {
  return <p className={classes("text-xs font-semibold uppercase tracking-[0.16em]", tone === "analytical" ? "text-analytical-highlight" : "text-muted", className)} {...props} />;
}

export function Surface({ tone = "reading", className, ...props }: ComponentPropsWithoutRef<"div"> & { tone?: "reading" | "analytical" }) {
  return <div className={classes("rounded-panel border p-6", tone === "analytical" ? "border-analytical-rule bg-analytical text-on-analytical" : "border-border bg-elevated", className)} {...props} />;
}

export function Badge({ className, ...props }: ComponentPropsWithoutRef<"span">) {
  return <span className={classes("inline-flex rounded-tag border border-border bg-surface px-2 py-1 text-xs font-medium text-muted", className)} {...props} />;
}

/** Real destinations only. Native anchors also support hash navigation without JavaScript. */
export function ActionLink({
  className,
  ...props
}: Omit<ComponentPropsWithoutRef<"a">, "href"> & { href: string }) {
  return <a className={classes("inline-flex min-h-11 items-center justify-between gap-4 rounded-control border border-accent bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:bg-accent-strong", className)} {...props} />;
}
