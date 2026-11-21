import { OwnerSignIn, OwnerSignOut } from "@/feedback/owner-sign-in";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui/primitives";
import { catalog } from "@/content/.generated";
import { articleRoute, isPublicArticle } from "@/content/catalog";
import { ownerAuthentication } from "@/feedback/auth";
import { ownerFeedback, OwnerRequestError } from "@/feedback/owner";
import { OwnerDashboard } from "@/feedback/owner-dashboard";
import { feedbackRuntime } from "@/feedback/runtime";

export const dynamic = "force-dynamic";
export const metadata = { title: "Owner feedback", referrer: "no-referrer", robots: { index: false, follow: false } };

const path = "/owner/feedback";
const articlePaths = catalog.articles.filter(isPublicArticle).map(articleRoute);

async function services() {
  const runtime = feedbackRuntime();
  const auth = await ownerAuthentication();
  if (!auth || !runtime) notFound();
  return {
    auth, origin: runtime.config.origin,
    owner: ownerFeedback(runtime.db, {
      readVerifiedSession: auth.readSession,
      issuer: auth.issuer, subject: auth.ownerId, origin: runtime.config.origin,
      publishedArticlePaths: new Set(articlePaths),
    }),
  };
}

async function actionRequest(origin: string) {
  const incoming = await headers();
  const requestHeaders = new Headers();
  const source = incoming.get("origin");
  const site = incoming.get("sec-fetch-site");
  if (source !== origin || (site && site !== "same-origin")) throw new OwnerRequestError(403);
  requestHeaders.set("origin", source);
  requestHeaders.set("x-cre-feedback", "1");
  return new Request(origin + path, { method: "POST", headers: requestHeaders });
}

async function search(form: FormData) {
  "use server";
  const { owner, origin } = await services();
  const request = await actionRequest(origin);
  const filters = new URLSearchParams();
  for (const key of ["q", "category", "status", "offset"]) {
    const value = form.get(key);
    if (typeof value === "string" && value) filters.set(key, value);
  }
  try {
    await owner.list(request, filters);
  } catch (error) {
    if (error instanceof OwnerRequestError && error.status === 400) redirect(path + "?result=invalid");
    throw error;
  }
  redirect(path + "?" + filters);
}

async function update(form: FormData) {
  "use server";
  const { owner, origin } = await services();
  const request = await actionRequest(origin);
  const id = String(form.get("id") ?? "");
  try {
    await owner.update(request, id, String(form.get("kind") ?? ""), form.get("value"));
  } catch (error) {
    if (error instanceof OwnerRequestError && (error.status === 400 || error.status === 404)) redirect(path + "?result=invalid");
    throw error;
  }
  redirect(path + "?" + new URLSearchParams({ id, result: "saved" }));
}

export default async function OwnerFeedbackPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { owner, origin } = await services();
  const params = await searchParams;
  const filters = new URLSearchParams();
  for (const key of ["q", "category", "status", "offset"]) {
    if (typeof params[key] === "string") filters.set(key, params[key]);
  }
  const request = new Request(origin + path);
  let submissions;
  let detail;
  try {
    submissions = await owner.list(request, filters);
    detail = typeof params.id === "string" ? await owner.detail(request, params.id) : undefined;
  } catch (error) {
    if (error instanceof OwnerRequestError && error.status === 403) {
      return <Container width="reading" className="py-10"><h1>Feedback owner access</h1>
        <OwnerSignIn /></Container>;
    }
    if (error instanceof OwnerRequestError && (error.status === 400 || error.status === 404)) notFound();
    return <Container width="reading" className="py-10"><p>Owner feedback is temporarily unavailable.</p></Container>;
  }
  return <Container width="content" className="py-10">
    <OwnerSignOut />
    <OwnerDashboard submissions={submissions} detail={detail} search={search} update={update}
      filters={{ q: filters.get("q") ?? undefined, category: filters.get("category") ?? undefined,
        status: filters.get("status") ?? undefined, offset: Number(filters.get("offset") ?? 0) }}
      detailHref={id => path + "?" + new URLSearchParams({ ...Object.fromEntries(filters), id })}
      publishedArticlePaths={articlePaths}
      notice={params.result === "saved" ? "Changes saved." : params.result === "invalid" ? "Check the feedback reference or form fields." : undefined} />
  </Container>;
}
