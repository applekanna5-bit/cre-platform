import type { ArticleInput, ContentSource, EducationalCase, FinancialTableData, KnowledgeRecord } from "./contracts.ts";

type RecordValue = Record<string, unknown>;
function fail(path: string, message: string): never { throw new Error(`${path}: ${message}`); }
function object(value: unknown, path: string): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(path, "expected an object");
  return value as RecordValue;
}
function keys(value: RecordValue, allowed: string[], path: string) {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(`${path}.${key}`, "unknown field");
}
function text(value: unknown, path: string): asserts value is string {
  if (typeof value !== "string" || !value.trim()) fail(path, "expected nonempty text");
}
function identifier(value: unknown, path: string) {
  text(value, path);
  if (!/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/.test(value)) fail(path, "expected a stable hyphenated identifier");
}
function choice(value: unknown, options: readonly string[], path: string) {
  if (typeof value !== "string" || !options.includes(value)) fail(path, `expected one of ${options.join(", ")}`);
}
function list(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(path, "expected an array");
  return value;
}
function strings(value: unknown, path: string, ids = false) {
  const values = list(value, path);
  values.forEach((item, i) => ids ? identifier(item, `${path}[${i}]`) : text(item, `${path}[${i}]`));
  if (new Set(values).size !== values.length) fail(path, "duplicate values");
}
function date(value: unknown, path: string) {
  text(value, path);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) fail(path, "expected a real YYYY-MM-DD date");
}
function contributor(value: unknown, path: string) {
  const item = object(value, path); keys(item, ["name", "slug"], path); text(item.name, `${path}.name`);
  if (item.slug !== undefined) identifier(item.slug, `${path}.slug`);
}
const sensitivities = ["U1", "U2", "U3", "U4"];
export function parseArticleMetadata(value: unknown, path = "article"): ArticleInput {
  const item = object(value, path);
  keys(item, ["id", "title", "slug", "description", "domain", "contentType", "difficulty", "status", "author", "reviewer", "publishedDate", "lastReviewedDate", "updatedDate", "propertyTypes", "loanProducts", "topics", "relatedGlossaryTerms", "relatedCalculators", "relatedContent", "sourceIds", "updateSensitivity", "sourceClasses", "relationships", "developmentFixture"], path);
  identifier(item.id, `${path}.id`);
  for (const field of ["title", "description", "slug"]) text(item[field], `${path}.${field}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug as string)) fail(`${path}.slug`, "expected a lowercase canonical slug");
  choice(item.domain, ["learn", "underwriting", "property-types", "financing", "agency", "modeling", "resources", "insights"], `${path}.domain`);
  choice(item.contentType, ["concept", "guide", "reference", "analysis", "resource"], `${path}.contentType`);
  choice(item.difficulty, ["foundational", "intermediate", "advanced"], `${path}.difficulty`);
  choice(item.status, ["research", "brief", "draft", "editorial-review", "technical-review", "source-verification", "ready", "approved", "published", "needs-review", "archived"], `${path}.status`);
  contributor(item.author, `${path}.author`);
  if (item.reviewer !== undefined) contributor(item.reviewer, `${path}.reviewer`);
  for (const field of ["publishedDate", "lastReviewedDate", "updatedDate"]) if (item[field] !== undefined) date(item[field], `${path}.${field}`);
  for (const field of ["propertyTypes", "loanProducts", "topics", "relatedGlossaryTerms", "relatedCalculators", "relatedContent", "sourceIds"]) strings(item[field], `${path}.${field}`, true);
  choice(item.updateSensitivity, sensitivities, `${path}.updateSensitivity`);
  strings(item.sourceClasses, `${path}.sourceClasses`);
  if (!(item.sourceClasses as unknown[]).length) fail(path, "sourceClasses must not be empty");
  (item.sourceClasses as unknown[]).forEach(v => choice(v, ["A", "B", "C"], `${path}.sourceClasses`));
  list(item.relationships, `${path}.relationships`).forEach((value, i) => {
    const key = `${path}.relationships[${i}]`; const relation = object(value, key);
    keys(relation, ["purpose", "target"], key);
    choice(relation.purpose, ["prerequisite", "deep-dive", "application", "tool"], `${key}.purpose`);
    const target = object(relation.target, `${key}.target`); keys(target, ["kind", "id"], `${key}.target`);
    choice(target.kind, ["article", "glossary", "calculator", "case-study"], `${key}.target.kind`); identifier(target.id, `${key}.target.id`);
  });
  if (typeof item.developmentFixture !== "boolean") fail(path, "developmentFixture must be boolean");
  if (item.developmentFixture && (item.status !== "draft" || !(item.id as string).startsWith("fixture-"))) fail(path, "fixtures must have draft status and fixture- IDs");
  if (["ready", "approved", "published"].includes(item.status as string) || (item.status === "needs-review" && item.publishedDate)) {
    if (!item.reviewer || !item.lastReviewedDate) fail(path, "approval/publication requires a reviewer and review date");
    if (!(item.sourceIds as unknown[]).length) fail(path, "approval/publication requires sources");
  }
  if (item.status === "published" && !item.publishedDate) fail(path, "published content requires publishedDate");
  if (item.publishedDate && !["published", "needs-review", "archived"].includes(item.status as string)) fail(path, "publishedDate is only valid for published, needs-review, or archived content");
  return item as unknown as ArticleInput;
}

export function parseSources(value: unknown): ContentSource[] {
  return list(value, "sources").map((value, i) => {
    const path = `sources[${i}]`; const item = object(value, path);
    keys(item, ["id", "title", "publisher", "url", "type", "authority", "publicationDate", "updatedDate", "accessedDate", "reviewedDate", "effectiveDate", "notes", "updateSensitivity", "synthetic"], path);
    identifier(item.id, `${path}.id`); text(item.title, `${path}.title`); text(item.publisher, `${path}.publisher`);
    choice(item.type, ["official-primary", "regulatory", "government", "industry-organization", "academic", "secondary-industry", "editorial-research"], `${path}.type`);
    choice(item.authority, ["authoritative", "supporting", "contextual"], `${path}.authority`);
    if (item.url !== undefined) {
      text(item.url, `${path}.url`);
      let url: URL; try { url = new URL(item.url); } catch { fail(path, "invalid source URL"); }
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) fail(path, "source URL must be public HTTP(S), without credentials");
    }
    for (const field of ["publicationDate", "updatedDate", "accessedDate", "reviewedDate", "effectiveDate"]) if (item[field] !== undefined) date(item[field], `${path}.${field}`);
    if (item.notes !== undefined) text(item.notes, `${path}.notes`);
    if (item.updateSensitivity !== undefined) choice(item.updateSensitivity, sensitivities, `${path}.updateSensitivity`);
    if (item.synthetic !== undefined && typeof item.synthetic !== "boolean") fail(path, "synthetic must be boolean");
    if (item.synthetic && (!item.notes || item.authority !== "contextual")) fail(path, "synthetic sources require contextual authority and explanatory notes");
    return item as unknown as ContentSource;
  });
}

export function parseKnowledge(value: unknown): KnowledgeRecord[] {
  return list(value, "knowledge").map((value, i) => {
    const path = `knowledge[${i}]`; const item = object(value, path);
    keys(item, ["id", "kind", "label", "description", "synthetic"], path);
    identifier(item.id, `${path}.id`); text(item.label, `${path}.label`);
    choice(item.kind, ["glossary", "calculator"], `${path}.kind`);
    if (typeof item.synthetic !== "boolean") fail(path, "synthetic must be boolean");
    if (item.description !== undefined) text(item.description, `${path}.description`);
    return item as unknown as KnowledgeRecord;
  });
}

export function parseTable(value: unknown, path = "table"): FinancialTableData {
  const item = object(value, path); keys(item, ["id", "caption", "columns", "rows"], path);
  identifier(item.id, `${path}.id`); text(item.caption, `${path}.caption`);
  const columns = list(item.columns, `${path}.columns`);
  if (columns.length < 2) fail(path, "table requires a row-label column and at least one value column");
  columns.forEach((value, i) => { const col = object(value, `${path}.columns[${i}]`); keys(col, ["key", "label", "numeric"], path); identifier(col.key, path); text(col.label, path); if (col.numeric !== undefined && typeof col.numeric !== "boolean") fail(path, "numeric must be boolean"); });
  if (new Set(columns.map(v => (v as RecordValue).key)).size !== columns.length) fail(path, "duplicate column keys");
  if (!list(item.rows, `${path}.rows`).length) fail(path, "table rows cannot be empty");
  (item.rows as unknown[]).forEach((value, i) => {
    const row = object(value, `${path}.rows[${i}]`); keys(row, ["label", "values", "total"], path); text(row.label, path);
    const values = list(row.values, path); values.forEach(v => text(v, path));
    if (values.length !== columns.length - 1) fail(path, "row values must match value columns");
    if (row.total !== undefined && typeof row.total !== "boolean") fail(path, "total must be boolean");
  });
  return item as unknown as FinancialTableData;
}

export function parseCases(value: unknown): EducationalCase[] {
  return list(value, "cases").map((value, i) => {
    const path = `cases[${i}]`; const item = object(value, path);
    keys(item, ["id", "kind", "label", "description", "synthetic", "fictional", "facts", "tables"], path);
    identifier(item.id, path); text(item.label, path); choice(item.kind, ["case-study"], path);
    if (item.fictional !== true || typeof item.synthetic !== "boolean") fail(path, "educational cases must be fictional and declare synthetic status");
    if (item.description !== undefined) text(item.description, path);
    list(item.facts, path).forEach(value => { const fact = object(value, path); keys(fact, ["label", "value"], path); text(fact.label, path); text(fact.value, path); });
    item.tables = list(item.tables, path).map((table, j) => parseTable(table, `${path}.tables[${j}]`));
    return item as unknown as EducationalCase;
  });
}
