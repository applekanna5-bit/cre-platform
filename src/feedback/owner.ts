import "server-only";
import type { Database } from "./database";
import { categories, limits, statuses, type Status } from "./fields";
import { sameSitePost, uuid } from "./submission";

export type VerifiedOwnerSession = {
  issuer: string;
  subject: string;
  mfa: boolean;
  expiresAt: number;
  revoked: boolean;
};
type OwnerOptions = {
  readVerifiedSession: (request: Request) => Promise<VerifiedOwnerSession | null>;
  issuer: string;
  subject: string;
  origin: string;
  publishedArticlePaths: ReadonlySet<string>;
};
export type Summary = {
  id: string; category: string; specialization: string | null; status: Status; created_at: string;
};
export type Detail = {
  submission: Summary & { message: string; source_url: string | null; contact_name: string | null; contact_email: string | null };
  history: { status: Status; actor: string; created_at: string }[];
  notes: { note: string; created_at: string }[];
  corrections: { article_path: string; created_at: string }[];
};

export class OwnerRequestError extends Error {
  constructor(readonly status: 400 | 403 | 404) { super("Owner request rejected"); }
}

export function ownerFeedback(db: Database, options: OwnerOptions) {
  async function authorize(request: Request) {
    const session = await options.readVerifiedSession(request);
    if (!options.issuer || !options.subject || !session || session.issuer !== options.issuer || session.subject !== options.subject ||
      !session.mfa || session.revoked || !Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) throw new OwnerRequestError(403);
  }

  return {
    async list(request: Request, filters: URLSearchParams) {
      await authorize(request);
      const query = (filters.get("q") ?? "").trim();
      const status = statuses.find(value => value === filters.get("status"));
      const category = categories.find(value => value === filters.get("category"));
      const offset = Number(filters.get("offset") ?? "0");
      if (query.length > 120 || (filters.get("status") && !status) || (filters.get("category") && !category) ||
        !Number.isInteger(offset) || offset < 0 || offset > 10_000) throw new OwnerRequestError(400);
      return db.rows<Summary>(`SELECT id, category, specialization, status, created_at FROM feedback_submissions
        WHERE (? IS NULL OR status = ?) AND (? IS NULL OR category = ?)
        AND (? = '' OR LOCATE(?, message) > 0 OR LOCATE(?, source_url) > 0 OR id = ?)
        ORDER BY created_at DESC, id DESC LIMIT 50 OFFSET ?`,
        [status ?? null, status ?? null, category ?? null, category ?? null, query, query, query, query, offset]);
    },
    async detail(request: Request, id: string): Promise<Detail> {
      await authorize(request);
      if (!uuid.test(id)) throw new OwnerRequestError(400);
      return db.transaction(async sql => {
        const [submission] = await sql.rows<Detail["submission"]>(
          `SELECT id, category, specialization, status, created_at, message, source_url, contact_name, contact_email
           FROM feedback_submissions WHERE id = ?`, [id]);
        if (!submission) throw new OwnerRequestError(404);
        const history = await sql.rows<Detail["history"][number]>(
          "SELECT status, actor, created_at FROM feedback_status_history WHERE submission_id = ? ORDER BY id", [id]);
        const notes = await sql.rows<Detail["notes"][number]>(
          "SELECT note, created_at FROM feedback_owner_notes WHERE submission_id = ? ORDER BY id", [id]);
        const corrections = await sql.rows<Detail["corrections"][number]>(
          "SELECT article_path, created_at FROM feedback_corrections WHERE submission_id = ? ORDER BY id", [id]);
        return { submission, history, notes, corrections };
      });
    },
    async update(request: Request, id: string, kind: string, value: unknown) {
      await authorize(request);
      if (!sameSitePost(request, options.origin)) throw new OwnerRequestError(403);
      if (!uuid.test(id) || typeof value !== "string") throw new OwnerRequestError(400);
      const note = value.trim();
      const status = statuses.find(status => status === value);
      const valid = (kind === "status" && status) ||
        (kind === "note" && note && value.length <= limits.note && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)) ||
        (kind === "correction" && options.publishedArticlePaths.has(value));
      if (!valid) throw new OwnerRequestError(400);
      await db.transaction(async sql => {
        const [record] = await sql.rows<{ status: Status }>("SELECT status FROM feedback_submissions WHERE id = ? FOR UPDATE", [id]);
        if (!record) throw new OwnerRequestError(404);
        if (kind === "status" && status && record.status !== status) {
          await sql.write("UPDATE feedback_submissions SET status = ? WHERE id = ?", [status, id]);
          await sql.write("INSERT INTO feedback_status_history (submission_id, status, actor) VALUES (?, ?, 'owner')", [id, status]);
        }
        if (kind === "note") await sql.write("INSERT INTO feedback_owner_notes (submission_id, note) VALUES (?, ?)", [id, note]);
        if (kind === "correction") await sql.write(`INSERT INTO feedback_corrections (submission_id, article_path)
          VALUES (?, ?) ON DUPLICATE KEY UPDATE article_path = article_path`, [id, value]);
      });
    },
  };
}
