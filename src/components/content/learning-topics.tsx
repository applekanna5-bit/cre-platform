import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/primitives";
import { recommendedReading } from "@/config/learning";

export function LearningTopics({ title, description, topics, children }: {
  title: string;
  description: string;
  topics: readonly { id: string; title: string; description: string; articles: readonly string[]; planned: string }[];
  children?: ReactNode;
}) {
  return <Container width="content" className="py-12 sm:py-16">
    <h1 className="font-editorial text-4xl sm:text-5xl">{title}</h1>
    <p className="mt-4 text-lg text-muted">{description}</p>
    {children}
    <nav aria-label={title} className="my-8">
      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {topics.map(topic => <li key={topic.id}><a className="inline-flex min-h-11 items-center underline underline-offset-4" href={`#${topic.id}`}>{topic.title}</a></li>)}
      </ul>
    </nav>
    {topics.map(topic => {
      const articles = recommendedReading(topic.articles);
      return <section key={topic.id} aria-labelledby={topic.id} className="border-t border-border py-8">
        <h2 id={topic.id} tabIndex={-1} className="scroll-mt-24 font-editorial text-2xl">{topic.title}</h2>
        <p className="mt-2 max-w-[68ch] text-muted">{topic.description}</p>
        {articles.length > 0 && <>
          <p id={`${topic.id}-reading`} className="mt-4 text-sm font-medium text-muted">Published reading</p>
          <ol aria-labelledby={`${topic.id}-reading`} className="mt-2 list-decimal space-y-3 pl-6">
          {articles.map(article => <li key={article.id}><Link className="text-accent underline underline-offset-4" href={article.href}>{article.title}</Link></li>)}
          </ol>
        </>}
        <p className="mt-4 text-muted"><span className="text-sm font-medium">Planned topics</span> · {topic.planned}</p>
      </section>;
    })}
  </Container>;
}
