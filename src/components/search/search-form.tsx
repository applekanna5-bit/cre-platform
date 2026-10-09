export function SearchForm({ id, label = "Search published research", query = "", compact = false }: { id: string; label?: string; query?: string; compact?: boolean }) {
  return <form action="/search" method="get" role="search" aria-label={label} className={compact ? "w-full min-w-0 lg:ml-auto lg:w-80" : "mt-7 max-w-3xl"}>
    <label htmlFor={id} className={compact ? "sr-only" : "mb-2 block text-xs font-semibold uppercase tracking-wider text-muted"}>{label}</label>
    <div className={`flex min-w-0 ${compact ? "gap-1.5" : "gap-2"}`}>
      <div className="relative flex min-w-0 flex-1">
        {compact && <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-copper-text"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>}
        <input id={id} name="q" type="search" defaultValue={query} maxLength={200} placeholder={compact ? "Search research" : "Try NOI, T-12, or rent roll"} className={`min-h-11 w-full min-w-0 rounded-control border border-border-strong py-2 text-sm text-foreground focus-visible:border-accent focus-visible:outline-focus ${compact ? "bg-background pr-3 pl-9 transition-colors hover:border-accent" : "bg-elevated px-3"}`} />
      </div>
      <button type="submit" className={`min-h-11 shrink-0 rounded-control border py-2 text-sm font-semibold transition-colors focus-visible:outline-focus ${compact ? "border-border-strong bg-surface px-3 text-accent-strong hover:border-accent hover:bg-accent hover:text-on-accent" : "border-accent bg-accent px-4 text-on-accent hover:bg-accent-strong"}`}>Search</button>
    </div>
  </form>;
}
