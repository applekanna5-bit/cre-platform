import { articleBreadcrumbs, articleStructuredData, breadcrumbStructuredData, serializeStructuredData } from "@/seo/structured-data";
import { currentContext, currentDelivery } from "@/seo/metadata";
import { articleMetadata } from "@/seo/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articleHeadings, catalog, embeddedCases, editorialPreviewEnabled, fixturesEnabled, loaders } from "@/content/.generated";
import { isPubliclyReadable, isRenderable } from "@/content/catalog";
import { ArticleTemplate } from "@/components/content/article-template";
import { articleComponents } from "@/components/content/mdx-components";

export const dynamicParams = false;
export function generateStaticParams() {
  return catalog.articles.filter(article => isRenderable(article, fixturesEnabled, editorialPreviewEnabled)).map(article => ({ domain: article.domain, slug: article.slug }));
}
function getArticle(domain: string, slug: string) {
  const article = catalog.articles.find(article => article.domain === domain && article.slug === slug && isRenderable(article, fixturesEnabled, editorialPreviewEnabled));
  if (!article) notFound();
  return article;
}
export async function generateMetadata({ params }: PageProps<"/content/[domain]/[slug]">): Promise<Metadata> {
  const { domain, slug } = await params; const article = getArticle(domain, slug);
  return articleMetadata(article);
}
export default async function ContentPage({ params }: PageProps<"/content/[domain]/[slug]">) {
  const { domain, slug } = await params; const article = getArticle(domain, slug);
  const { default: Body } = await loaders[article.id]();
  const context = currentContext(), delivery = currentDelivery();
  const articleSchema = articleStructuredData(article, context, delivery);
  const breadcrumbSchema = breadcrumbStructuredData(article, context, delivery);
  return <>
    {articleSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStructuredData(articleSchema) }} />}
    {breadcrumbSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStructuredData(breadcrumbSchema) }} />}
    <ArticleTemplate breadcrumbs={isPubliclyReadable(article) ? articleBreadcrumbs(article) : undefined} headings={articleHeadings[article.id]} article={article} catalog={catalog} embeddedCases={embeddedCases[article.id]} fixtures={fixturesEnabled} editorialPreview={editorialPreviewEnabled}><Body components={articleComponents(article, catalog)} /></ArticleTemplate></>;
}
