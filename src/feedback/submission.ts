import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import type { Database } from "./database";
import type { Feedback, SubmitResult } from "./fields";
import { validateFeedback } from "./validation";

export const bodyLimit = 48 * 1024;
export const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const windowSeconds = 900;

export function sameSitePost(request: Request, origin: string) {
  return request.method === "POST" && request.headers.get("origin") === origin &&
    request.headers.get("x-cre-feedback") === "1" &&
    [null, "same-origin"].includes(request.headers.get("sec-fetch-site"));
}

export async function readBoundedJson(request: Request): Promise<unknown> {
  const length = request.headers.get("content-length");
  if (!request.body || (length !== null && (!/^\d+$/.test(length) || Number(length) > bodyLimit)) ||
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json" ||
    ![null, "identity"].includes(request.headers.get("content-encoding"))) throw new Error("Invalid request");

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let body = "";
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > bodyLimit) throw new Error("Body limit");
      body += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(body + decoder.decode()) as unknown;
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}

export function submissionStore(db: Database, secret: Buffer, rateScope: "feedback" | "owner-auth" = "feedback") {
  if (secret.length < 32) throw new Error("Feedback requires a high-entropy HMAC key");
  const digest = (scope: string, value: string) => createHmac("sha256", secret).update(scope + "\0" + value).digest("hex");

  return {
    rateLimit(ip: string, now: number) {
      const start = Math.floor(now / 1000 / windowSeconds) * windowSeconds;
      return db.transaction(async sql => {
        const scope = rateScope === "feedback" ? "rate" : "owner-auth-rate";
        const buckets = [
          { key: digest(scope, ip), max: 5 },
          { key: digest(scope, "all"), max: rateScope === "feedback" ? 60 : 20 },
        ];
        for (const { key, max } of buckets) {
          await sql.write(`INSERT INTO feedback_rate_windows (bucket_key, window_start)
            VALUES (?, ?) ON DUPLICATE KEY UPDATE attempts = attempts`, [key, start]);
          const [row] = await sql.rows<{ attempts: number }>(`SELECT attempts FROM feedback_rate_windows
            WHERE bucket_key = ? AND window_start = ? FOR UPDATE`, [key, start]);
          if (row.attempts >= max) return false;
          await sql.write("UPDATE feedback_rate_windows SET attempts = attempts + 1 WHERE bucket_key = ? AND window_start = ?", [key, start]);
        }
        return true;
      });
    },
    save(key: string, data: Feedback): Promise<"saved" | "conflict"> {
      const fingerprint = digest("submission", JSON.stringify(data));
      return db.transaction(async sql => {
        await sql.write(`INSERT INTO feedback_idempotency (request_key, fingerprint)
          VALUES (?, ?) ON DUPLICATE KEY UPDATE request_key = request_key`, [key, fingerprint]);
        const [record] = await sql.rows<{ fingerprint: string; submission_id: string | null }>(
          "SELECT fingerprint, submission_id FROM feedback_idempotency WHERE request_key = ? FOR UPDATE", [key]);
        if (record.fingerprint !== fingerprint) return "conflict";
        if (record.submission_id) return "saved";

        const id = randomUUID();
        await sql.write(`INSERT INTO feedback_submissions
          (id, category, specialization, message, source_url, contact_name, contact_email) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, data.category, data.specialization, data.message, data.sourceUrl, data.name, data.email]);
        await sql.write("INSERT INTO feedback_status_history (submission_id, status, actor) VALUES (?, 'New', 'system')", [id]);
        await sql.write("INSERT INTO feedback_outbox (submission_id, available_at) VALUES (?, UTC_TIMESTAMP(3))", [id]);
        await sql.write("UPDATE feedback_idempotency SET submission_id = ? WHERE request_key = ?", [id, key]);
        return "saved";
      });
    },
  };
}

type SubmissionStore = ReturnType<typeof submissionStore>;

export async function submitFeedback(request: Request, options: {
  origin: string;
  trustedAddress: (request: Request) => Promise<string | null>;
  store: SubmissionStore;
}): Promise<SubmitResult> {
  if (!sameSitePost(request, options.origin)) return { kind: "rejected" };
  try {
    const ip = await options.trustedAddress(request);
    if (!ip || !isIP(ip)) return { kind: "unavailable" };
    if (!await options.store.rateLimit(ip, Date.now())) return { kind: "limited" };
    const key = request.headers.get("idempotency-key");
    if (!key || !uuid.test(key)) return { kind: "rejected" };
    let input: unknown;
    try {
      input = await readBoundedJson(request);
    } catch {
      return { kind: "rejected" };
    }
    const result = validateFeedback(input);
    if ("errors" in result) return { kind: "invalid", errors: result.errors };
    return { kind: await options.store.save(key, result.data) };
  } catch {
    return { kind: "unavailable" };
  }
}
