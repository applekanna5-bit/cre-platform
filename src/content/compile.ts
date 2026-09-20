import { compile } from "@mdx-js/mdx";
import type { ArticleHeading, ArticleMetadata, ContentCatalog } from "./contracts.ts";

interface Node {
  type: string;
  value?: unknown;
  name?: string;
  depth?: number;
  url?: string;
  children?: Node[];
  attributes?: { type: string; name?: string; value?: unknown }[];
  data?: Record<string, unknown>;
}
/** Decode only literal component props; never evaluate JavaScript from editorial files. */
function literal(value: unknown): unknown {
  const node = value as Record<string, unknown>;
  if (!node || typeof node !== "object") throw new Error("Expected literal MDX props");
  if (node.type === "Literal") return node.value;
  if (node.type === "ArrayExpression") return (node.elements as unknown[]).map(literal);
  if (node.type === "ObjectExpression") return Object.fromEntries((node.properties as Record<string, unknown>[]).map(prop => {
    if (prop.type !== "Property" || prop.computed || prop.method || prop.shorthand || prop.kind !== "init") throw new Error("Only literal object properties are allowed in MDX");
    const key = prop.key as Record<string, unknown>;
    const name = key.name ?? key.value;
    if (typeof name !== "string" || ["__proto__", "prototype", "constructor"].includes(name)) throw new Error("Invalid MDX prop key");
    return [name, literal(prop.value)];
  }));
  throw new Error("MDX expressions must be literal data; keep calculations and application code in TypeScript");
}
function propsFor(node: Node): Record<string, unknown> {
  return Object.fromEntries((node.attributes ?? []).map(attr => {
    if (attr.type !== "mdxJsxAttribute" || !attr.name) throw new Error("MDX spread props are not supported");
    if (typeof attr.value === "string") return [attr.name, attr.value];
    if (attr.value === null) return [attr.name, true];
    const expr = attr.value as { data?: { estree?: { body?: { expression?: unknown }[] } } };
    return [attr.name, literal(expr?.data?.estree?.body?.[0]?.expression)];
  }));
}
function nonempty(value: unknown): value is string { return typeof value === "string" && !!value.trim(); }
const componentProps: Record<string, readonly string[]> = {
  Formula: ["formula", "variables", "interpretation"],
  Calculation: ["inputs", "formula", "result", "interpretation"],
  PractitionerNote: [], ConventionNote: [], Warning: [],
  InstitutionalExample: ["sourceId"], SourceNote: ["sourceId"],
  CaseStudy: ["caseId"], FinancialTable: ["tableId"],
};
export interface CompiledArticle { code: string; caseIds: string[]; headings: ArticleHeading[] }
export async function compileArticle(body: string, article: ArticleMetadata, catalog: ContentCatalog, file = article.id): Promise<CompiledArticle> {
  const caseIds: string[] = [];
  const headings: ArticleHeading[] = [];
  const tableIds = new Set<string>();
  const headingIds = new Set<string>();
  let depth = 1;
  function editorialRules() {
    return (tree: Node) => {
      function visit(node: Node) {
        if (["mdxjsEsm", "mdxFlowExpression", "mdxTextExpression"].includes(node.type)) throw new Error("Editorial MDX cannot import/export or execute expressions; use registered primitives and literal props");
        if (node.type === "heading") {
          const nextDepth = node.depth!;
          if (nextDepth < 2 || nextDepth > depth + 1) throw new Error("Body headings must start at h2 and cannot skip levels; the template owns h1");
          depth = nextDepth;
          const getText = (n: Node): string => typeof n.value === "string" ? n.value : (n.children ?? []).map(getText).join("");
          const base = `section-${getText(node).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "heading"}`;
          let id = base; let suffix = 2; while (headingIds.has(id)) id = `${base}-${suffix++}`;
          headingIds.add(id); node.data = { ...node.data, hProperties: { id, tabIndex: -1 } };
          headings.push({ id, label: getText(node), depth: nextDepth });
        }
        if (node.type === "image") throw new Error("M3 does not support editorial images");
        if (["link", "definition"].includes(node.type) && (!node.url || !/^(https?:\/\/|#[a-z0-9-]+$)/i.test(node.url))) throw new Error("Use HTTP(S) links or local fragments; internal knowledge links belong in relationship metadata");
        if (["mdxJsxFlowElement", "mdxJsxTextElement"].includes(node.type)) {
          const name = node.name ?? "";
          if (!(name in componentProps)) throw new Error(`Unregistered editorial component: ${name || "fragment"}`);
          const props = propsFor(node);
          for (const key of Object.keys(props)) if (!componentProps[name].includes(key)) throw new Error(`${name}: unknown prop ${key}`);
          if (["Formula", "Calculation"].includes(name)) {
            if (!nonempty(props.formula)) throw new Error(`${name}: formula is required`);
            if (props.interpretation !== undefined && !nonempty(props.interpretation)) throw new Error(`${name}: interpretation must be text`);
            const entries = name === "Formula" ? props.variables : props.inputs;
            const fields = name === "Formula" ? ["symbol", "meaning"] : ["label", "value"];
            if (!Array.isArray(entries) || !entries.length || entries.some(entry => !entry || typeof entry !== "object" || fields.some(key => !nonempty(entry[key])) || Object.keys(entry).some(key => !fields.includes(key)))) throw new Error(`${name}: invalid variable/input definitions`);
            if (name === "Calculation" && (!nonempty(props.result) || !nonempty(props.interpretation))) throw new Error("Calculation: result and interpretation are required");
          }
          if (["InstitutionalExample", "SourceNote"].includes(name) && !article.sources.some(source => source.id === props.sourceId)) throw new Error(`${name}: unknown or undeclared source ${props.sourceId}`);
          if (name === "CaseStudy") {
            if (depth < 2) throw new Error("CaseStudy must follow a level-two body heading");
            const record = catalog.cases.find(item => item.id === props.caseId);
            if (!record || (!article.developmentFixture && record.synthetic)) throw new Error(`CaseStudy: unknown or fixture-only case ${props.caseId}`);
            if (caseIds.includes(record.id)) throw new Error(`CaseStudy: duplicate embed ${record.id}`);
            caseIds.push(record.id);
            headings.push({ id: `case-${record.id}`, label: record.label, depth: 3 });
          }
          if (name === "FinancialTable") {
            const owner = catalog.cases.find(item => item.tables.some(table => table.id === props.tableId));
            if (!owner || (!article.developmentFixture && owner.synthetic)) throw new Error(`FinancialTable: unknown or fixture-only table ${props.tableId}`);
            const id = props.tableId as string;
            if (tableIds.has(id)) throw new Error(`FinancialTable: duplicate embed ${id}`);
            tableIds.add(id);
          }
        }
        node.children?.forEach(visit);
      }
      visit(tree);
      function checkFragments(node: Node) {
        if (["link", "definition"].includes(node.type) && node.url?.startsWith("#") && !headingIds.has(node.url.slice(1)) && !caseIds.some(id => node.url === `#case-${id}`)) throw new Error(`Unresolved body fragment: ${node.url}`);
        node.children?.forEach(checkFragments);
      }
      checkFragments(tree);
    };
  }
  try {
    const output = await compile({ value: body, path: file }, { outputFormat: "program", development: false, remarkPlugins: [editorialRules] });
    return { code: String(output), caseIds, headings };
  } catch (error) { throw new Error(`${file}: ${error instanceof Error ? error.message : String(error)}`, { cause: error }); }
}
