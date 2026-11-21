import "server-only";
import { categories, limits, statuses } from "./fields";
import type { Detail, Summary } from "./owner";

type Action = (form: FormData) => void | Promise<void>;

export function OwnerDashboard({ submissions, filters, search, detailHref, detail, update, publishedArticlePaths, notice }: {
  submissions: Summary[];
  filters: { q?: string; status?: string; category?: string; offset: number };
  search: Action;
  detailHref: (id: string) => string;
  detail?: Detail;
  update: Action;
  publishedArticlePaths: readonly string[];
  notice?: string;
}) {
  const articlePaths = publishedArticlePaths.map(path => <option key={path} value={path}>{path}</option>);
  return <div>
    <h1>Professional feedback</h1>
    <p role="status">{notice}</p>
    <form action={search} aria-label="Filter submissions">
      <label htmlFor="feedback-search">Search message, public source, or reference</label>
      <input id="feedback-search" type="search" name="q" maxLength={120} defaultValue={filters.q} />
      <label htmlFor="feedback-status-filter">Status</label>
      <select id="feedback-status-filter" name="status" defaultValue={filters.status ?? ""}><option value="">All statuses</option>
        {statuses.map(status => <option key={status}>{status}</option>)}
      </select>
      <label htmlFor="feedback-category-filter">Category</label>
      <select id="feedback-category-filter" name="category" defaultValue={filters.category ?? ""}><option value="">All categories</option>
        {categories.map(category => <option key={category}>{category}</option>)}
      </select>
      <button name="offset" value="0">Search</button>
      {filters.offset > 0 && <button name="offset" value={Math.max(0, filters.offset - 50)}>Previous submissions</button>}
      {submissions.length === 50 && filters.offset < 10_000 &&
        <button name="offset" value={filters.offset + 50}>Next submissions</button>}
    </form>
    {submissions.length > 0 ? <table>
      <caption>Submissions</caption>
      <thead><tr><th scope="col">Reference</th><th scope="col">Category</th><th scope="col">Status</th><th scope="col">Received</th></tr></thead>
      <tbody>{submissions.map(submission => <tr key={submission.id}>
        <td><a href={detailHref(submission.id)}>{submission.id}</a></td><td>{submission.category}</td>
        <td>{submission.status}</td><td>{submission.created_at}</td>
      </tr>)}</tbody>
    </table> : <p>No submissions found.</p>}
    {detail && <section aria-labelledby="feedback-detail">
      <h2 id="feedback-detail">Submission {detail.submission.id}</h2>
      <dl>
        <dt>Category</dt><dd>{detail.submission.category}</dd>
        <dt>Specialization</dt><dd>{detail.submission.specialization ?? "None supplied"}</dd>
        <dt>Received</dt><dd>{detail.submission.created_at}</dd>
        <dt>Public source URL</dt><dd className="break-all">{detail.submission.source_url ?? "None supplied"}</dd>
        <dt>Name</dt><dd>{detail.submission.contact_name ?? "None supplied"}</dd>
        <dt>Follow-up email</dt><dd>{detail.submission.contact_email ?? "None supplied"}</dd>
      </dl>
      <p className="whitespace-pre-wrap break-words">{detail.submission.message}</p>
      <form action={update}>
        <input type="hidden" name="id" value={detail.submission.id} />
        <label htmlFor="feedback-new-status">Status</label>
        <select id="feedback-new-status" name="value" defaultValue={detail.submission.status}>
          {statuses.map(status => <option key={status}>{status}</option>)}
        </select>
        <button name="kind" value="status">Save status</button>
      </form>
      <h3>Status history</h3>
      <ol>{detail.history.map((entry, index) => <li key={index}>{entry.status} by {entry.actor} on {entry.created_at}</li>)}</ol>
      <h3>Private notes</h3>
      <ul>{detail.notes.map((entry, index) => <li key={index} className="whitespace-pre-wrap break-words">{entry.note} ({entry.created_at})</li>)}</ul>
      <form action={update}>
        <input type="hidden" name="id" value={detail.submission.id} />
        <label htmlFor="feedback-note">Add a private note</label>
        <textarea id="feedback-note" name="value" maxLength={limits.note} required />
        <button name="kind" value="note">Save note</button>
      </form>
      <h3>Published corrections</h3>
      <ul>{detail.corrections.filter(entry => publishedArticlePaths.includes(entry.article_path)).map(entry => <li key={entry.article_path}><a href={entry.article_path}>{entry.article_path}</a> ({entry.created_at})</li>)}</ul>
      <form action={update}>
        <input type="hidden" name="id" value={detail.submission.id} />
        <label htmlFor="feedback-correction">Published article</label>
        <select id="feedback-correction" name="value" required><option value="">Select an article</option>{articlePaths}</select>
        <button name="kind" value="correction">Add correction reference</button>
      </form>
    </section>}
  </div>;
}
