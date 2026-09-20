import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";
import type { ArticleMetadata, ContentCatalog } from "@/content/contracts";
import { Calculation, CaseStudy, ConventionNote, FinancialTable, Formula, InstitutionalExample, PractitionerNote, SourceNote, Warning } from "./primitives";

export function articleComponents(article: ArticleMetadata, catalog: ContentCatalog): MDXComponents {
  function source(id: string) { const value = article.sources.find(source => source.id === id); if (!value) throw new Error(`${article.id}: undeclared source ${id}`); return value; }
  return {
    Formula, Calculation, ConventionNote, PractitionerNote, Warning,
    InstitutionalExample: ({ sourceId, children }: { sourceId: string; children: ReactNode }) => <InstitutionalExample source={source(sourceId)}>{children}</InstitutionalExample>,
    SourceNote: ({ sourceId }: { sourceId: string }) => <SourceNote source={source(sourceId)} />,
    CaseStudy: ({ caseId }: { caseId: string }) => {
      const record = catalog.cases.find(item => item.id === caseId); if (!record) throw new Error(`Unknown case ${caseId}`);
      return <CaseStudy record={record} />;
    },
    FinancialTable: ({ tableId }: { tableId: string }) => {
      const data = catalog.cases.flatMap(item => [...item.tables]).find(table => table.id === tableId); if (!data) throw new Error(`Unknown table ${tableId}`);
      return <FinancialTable data={data} />;
    },
  };
}
