import type { NavigationItem } from "@/config/navigation";

export function NavigationList({
  items,
  horizontal = false,
}: {
  items: readonly NavigationItem[];
  horizontal?: boolean;
}) {
  return (
    <ul className={horizontal ? "flex flex-wrap items-center gap-1" : "grid gap-1"}>
      {items.map((item) => (
        <li key={item.id}>
          {item.kind === "link" ? (
            <a href={item.href} className="flex min-h-11 items-center rounded-control px-3 py-2 text-sm font-medium text-foreground hover:bg-surface hover:text-accent">
              {item.label}
            </a>
          ) : (
            <span className="flex min-h-11 flex-wrap items-center gap-x-3 px-3 py-2 text-sm text-muted">
              {item.label}<span className="text-xs">Coming soon</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
