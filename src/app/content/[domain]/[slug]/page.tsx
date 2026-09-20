import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articleHeadings, catalog, embeddedCases, fixturesEnabled, loaders } from "@/content/.generated";
import { isRenderable } from "@/content/catalog";
import { ArticleTemplate } from "@/components/content/article-template";
import { articleComponents } from "@/components/content/mdx-components";

export const dynamicParams = false;
export function generateStaticParams() {
  return catalog.articles.filter(article => isRenderable(article, fixturesEnabled)).map(article => ({ domain: article.domain, slug: article.slug }));
}
function getArticle(domain: string, slug: string) {
  const article = catalog.articles.find(article => article.domain === domain && article.slug === slug && isRenderable(article, fixturesEnabled));
  if (!article) notFound();
  return article;
}
export async function generateMetadata({ params }: PageProps<"/content/[domain]/[slug]">): Promise<Metadata> {
  const { domain, slug } = await params; const article = getArticle(domain, slug);
  return { title: `${article.title} | CRE Knowledge Platform`, description: article.description, ...(article.developmentFixture ? { robots: { index: false, follow: false } } : {}) };
}
export default async function ContentPage({ params }: PageProps<"/content/[domain]/[slug]">) {
  const { domain, slug } = await params; const article = getArticle(domain, slug);
  const { default: Body } = await loaders[article.id]();
  return <ArticleTemplate headings={articleHeadings[article.id]} article={article} catalog={catalog} embeddedCases={embeddedCases[article.id]} fixtures={fixturesEnabled}><Body components={articleComponents(article, catalog)} /></ArticleTemplate>;
}
