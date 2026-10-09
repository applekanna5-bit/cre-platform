/** Search contracts are independent of React and the internal content catalog. */
export interface SearchDocument<Kind extends string = string> {
  readonly kind: Kind;
  readonly id: string;
  readonly href: string;
  readonly title: string;
  readonly description: string;
  readonly topics: readonly string[];
  readonly headings: readonly string[];
  readonly body: string;
}
export interface SearchResult {
  readonly kind: string;
  readonly id: string;
  readonly href: string;
  readonly title: string;
  readonly description: string;
}

export function normalizeSearch(value: string): string {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}

/** Bounded input; repeated URL parameters and non-string values fail closed. */
export function searchQuery(value: unknown): string {
  return typeof value === "string" ? value.replace(/[\p{Cc}\p{Cf}]/gu, " ").trim().slice(0, 200) : "";
}

export function searchDocuments(documents: readonly SearchDocument[], input: unknown): readonly SearchResult[] {
  const query = normalizeSearch(searchQuery(input));
  const tokens = [...new Set(query.split(" ").filter(Boolean))];
  if (!tokens.length) return [];
  const contains = (field: string, term: string) => (` ${field} `).includes(` ${term} `);
  return documents.map(document => {
    const fields = [document.title, [...document.headings, ...document.topics].join(" "), document.description, document.body].map(normalizeSearch);
    if (!tokens.every(token => fields.some(field => contains(field, token)))) return { document, rank: [] };
    // Lexicographic field priority: even repeated body evidence cannot outrank
    // a title match. Presence, not occurrence frequency, determines relevance.
    const rank = fields.map(field => tokens.filter(token => contains(field, token)).length * 2 + (contains(field, query) ? 1 : 0));
    return { document, rank };
  }).filter(item => item.rank.length).sort((a, b) => {
    for (let i = 0; i < a.rank.length; i++) if (a.rank[i] !== b.rank[i]) return b.rank[i] - a.rank[i];
    return a.document.href < b.document.href ? -1 : a.document.href > b.document.href ? 1 : a.document.id < b.document.id ? -1 : a.document.id > b.document.id ? 1 : 0;
  }).map(({ document }) => ({ kind: document.kind, id: document.id, href: document.href, title: document.title, description: document.description }));
}
