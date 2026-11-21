import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { mysqlDatabase, type Database, type Sql } from "@/feedback/database";
import { FeedbackForm } from "@/feedback/feedback-form";
import { OwnerDashboard } from "@/feedback/owner-dashboard";
import { ownerFeedback, type Detail, type VerifiedOwnerSession } from "@/feedback/owner";
import { notificationStore, runNotifications } from "@/feedback/outbox";
import { hostingerNotice } from "@/feedback/smtp";
import { bodyLimit, readBoundedJson, submissionStore, submitFeedback } from "@/feedback/submission";
import { validateFeedback } from "@/feedback/validation";

vi.mock("server-only", () => ({}));

const origin = "https://feedback.example.test";
const id = "1132f7fb-53c3-41d2-919f-38e3bca92868";
const payload = { category: "Correction", message: "Synthetic observation" };
const secret = Buffer.alloc(32, 71);
const request = (data: unknown = payload, headers: Record<string, string> = {}) => new Request(origin + "/feedback", {
  method: "POST", headers: { origin, "x-cre-feedback": "1", "content-type": "application/json", "idempotency-key": id, ...headers },
  body: JSON.stringify(data),
});

function fakeDb() {
  const rows = vi.fn<Sql["rows"]>();
  const write = vi.fn<Sql["write"]>().mockResolvedValue(1);
  const transaction = vi.fn();
  const db: Database = {
    rows: async <T>(...args: Parameters<Sql["rows"]>) => await rows(...args) as T[],
    write,
    async transaction<T>(work: (sql: Sql) => Promise<T>) {
      transaction();
      return work(db);
    },
  };
  return { db, rows, write, transaction };
}

describe("feedback form and validation", () => {
  it("renders six associated labels, two required fields and a status region", () => {
    const html = renderToStaticMarkup(createElement(FeedbackForm, { submit: vi.fn() }));
    const labels = [...html.matchAll(/<label for="([^"]+)"/g)];
    expect(labels).toHaveLength(6);
    for (const [, id] of labels) expect(html).toContain(`id="${id}"`);
    expect(html.match(/\brequired=""/g)).toHaveLength(2);
    expect(html).toContain('role="status"');
    expect(html).toContain('method="post"');
    expect(html).toContain("Never share confidential");
  });

  it("accepts anonymous feedback and the longest approved specialization", () => {
    expect(validateFeedback(payload)).toEqual({ data: { ...payload, specialization: null, sourceUrl: null, name: null, email: null } });
    expect(validateFeedback({ ...payload, specialization: "Financing & Capital Markets" })).toHaveProperty("data.specialization", "Financing & Capital Markets");
  });

  it("rejects invalid fields, unknown keys, non-HTTP URLs, embedded credentials, and local hosts", () => {
    expect(validateFeedback({ ...payload, unexpected: true })).toHaveProperty("errors");
    expect(validateFeedback({ category: "x", message: " ", email: "bad" })).toHaveProperty("errors.message");
    for (const sourceUrl of ["ftp://www.example.com", "https://user@www.example.com", "http://127.0.0.1", "https://a.internal"]) {
      expect(validateFeedback({ ...payload, sourceUrl })).toHaveProperty("errors.sourceUrl");
    }
    expect(validateFeedback({ ...payload, sourceUrl: "https://www.example.com/source" })).toHaveProperty("data.sourceUrl");
  });

  it("enforces actual stream bytes and rejects malformed JSON", async () => {
    await expect(readBoundedJson(request("a".repeat(bodyLimit)))).rejects.toThrow("Body limit");
    await expect(readBoundedJson(request(payload, { "content-length": String(bodyLimit + 1) }))).rejects.toThrow();
    await expect(readBoundedJson(new Request(origin, { method: "POST", body: "{", headers: { "content-type": "application/json" } }))).rejects.toThrow();
  });
});

describe("feedback submission", () => {
  it("rejects cross-origin submissions and fails closed without a trusted client address", async () => {
    const save = vi.fn();
    const trustedAddress = vi.fn().mockResolvedValue(null);
    const store = { save, rateLimit: vi.fn() };
    expect(await submitFeedback(request(payload, { origin: "https://other.example.test" }), { store, trustedAddress, origin })).toEqual({ kind: "rejected" });
    expect(trustedAddress).not.toHaveBeenCalled();
    expect(await submitFeedback(request(), { store, trustedAddress, origin })).toEqual({ kind: "unavailable" });
    expect(save).not.toHaveBeenCalled();
  });

  it("applies a shared rate limit before storage and returns a generic database failure", async () => {
    const store = { save: vi.fn().mockRejectedValue(new Error("internal detail")), rateLimit: vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true) };
    const options = { store, trustedAddress: async () => "192.0.2.1", origin };
    expect(await submitFeedback(request(), options)).toEqual({ kind: "limited" });
    expect(store.save).not.toHaveBeenCalled();
    expect(await submitFeedback(request({ ...payload, message: "" }), options)).toHaveProperty("kind", "invalid");
    expect(await submitFeedback(request(), options)).toEqual({ kind: "unavailable" });
  });

  it("uses the existing idempotency record and avoids duplicate writes", async () => {
    const db = fakeDb();
    const store = submissionStore(db.db, secret);
    const data = { ...payload, category: "Correction" as const, specialization: null, sourceUrl: null, name: null, email: null };
    db.rows.mockImplementation(async () => [{ fingerprint: db.write.mock.calls[0][1]![1], submission_id: null }] as never);
    expect(await store.save(id, data)).toBe("saved");
    expect(db.write.mock.calls.some(([sql]) => sql.includes("INSERT INTO feedback_outbox"))).toBe(true);
    expect(db.transaction).toHaveBeenCalledTimes(1);
    const fingerprint = db.write.mock.calls[0][1]![1];
    db.write.mockClear();
    db.rows.mockResolvedValue([{ fingerprint, submission_id: id }]);
    expect(await store.save(id, data)).toBe("saved");
    expect(await store.save(id, { ...data, message: "Different message" })).toBe("conflict");
    expect(db.write).toHaveBeenCalledTimes(2);
    expect(db.write.mock.calls.every(([sql]) => sql.includes("feedback_idempotency"))).toBe(true);
  });

  it("rolls back and releases when the outbox write fails", async () => {
    let fingerprint: unknown;
    const connection = {
      beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn(), destroy: vi.fn(),
      execute: vi.fn(async (sql: string, params: unknown[]) => {
        if (sql.includes("INSERT INTO feedback_idempotency")) fingerprint = params[1];
        if (sql.includes("SELECT fingerprint")) return [[{ fingerprint, submission_id: null }]];
        if (sql.includes("INSERT INTO feedback_outbox")) throw new Error("Synthetic outage");
        return [{ affectedRows: 1 }];
      }),
    };
    const db = mysqlDatabase({ getConnection: async () => connection } as unknown as Parameters<typeof mysqlDatabase>[0]);
    const result = await submitFeedback(request(), {
      origin, trustedAddress: async () => "192.0.2.1", store: { ...submissionStore(db, secret), rateLimit: async () => true },
    });
    expect(result).toEqual({ kind: "unavailable" });
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.rollback).toHaveBeenCalledOnce();
    expect(connection.release).toHaveBeenCalledOnce();
  });
});

describe("owner authorization and rendering", () => {
  const verified = (): VerifiedOwnerSession => ({
    issuer: "issuer", subject: "owner", expiresAt: Date.now() + 100_000, mfa: true, revoked: false,
  });
  const options = { issuer: "issuer", subject: "owner", origin, publishedArticlePaths: new Set(["/content/underwriting/example"]) };

  it.each([null, { subject: "other" }, { issuer: "other" }, { mfa: false }, { revoked: true }, { expiresAt: 1 }])(
    "blocks every private operation for an invalid session %j", async change => {
      const db = fakeDb();
      const owner = ownerFeedback(db.db, { ...options, readVerifiedSession: async () => change && { ...verified(), ...change } });
      await expect(owner.list(request(), new URLSearchParams())).rejects.toHaveProperty("status", 403);
      await expect(owner.detail(request(), id)).rejects.toHaveProperty("status", 403);
      await expect(owner.update(request(), id, "status", "Resolved")).rejects.toHaveProperty("status", 403);
      expect(db.rows).not.toHaveBeenCalled();
      expect(db.transaction).not.toHaveBeenCalled();
    });

  it("requires same-origin mutations and records status changes in one transaction", async () => {
    const db = fakeDb();
    const owner = ownerFeedback(db.db, { ...options, readVerifiedSession: async () => verified() });
    await expect(owner.update(request(payload, { "x-cre-feedback": "" }), id, "status", "Accepted")).rejects.toHaveProperty("status", 403);
    await expect(owner.update(request(), id, "correction", "//other.example.test")).rejects.toHaveProperty("status", 400);
    db.rows.mockResolvedValue([{ status: "New" }]);
    await owner.update(request(), id, "status", "Accepted");
    expect(db.transaction).toHaveBeenCalledOnce();
    expect(db.write.mock.calls.map(call => call[1])).toEqual([["Accepted", id], [id, "Accepted"]]);
  });

  it("renders submissions and notes as text and does not link submitted URLs", () => {
    const detail: Detail = {
      submission: { id, category: "Correction", specialization: null, created_at: "synthetic date", status: "New",
        message: "<strong>synthetic message</strong>", source_url: "https://www.example.com", contact_name: "<b>sample</b>", contact_email: null },
      history: [], notes: [{ note: "<em>synthetic note</em>", created_at: "synthetic date" }],
      corrections: [{ article_path: "//other.example.test", created_at: "synthetic date" }],
    };
    const html = renderToStaticMarkup(createElement(OwnerDashboard, {
      detail, submissions: [], filters: { offset: 0 }, search: vi.fn(), detailHref: () => "#", update: vi.fn(), publishedArticlePaths: [],
    }));
    expect(html).toContain("&lt;strong&gt;synthetic message");
    expect(html).toContain("&lt;em&gt;synthetic note");
    expect(html).not.toContain('href="https://www.example.com"');
    expect(html).not.toContain("other.example.test");
  });
});

describe("notification worker", () => {
  const job = { submissionId: id, attempt: 1, claim: id };

  it("sends only a reference and quarantines unknown delivery failures", async () => {
    const store = { expire: vi.fn(), claim: vi.fn().mockResolvedValueOnce(job).mockResolvedValue(null), finish: vi.fn() };
    const send = vi.fn().mockRejectedValue(new Error("synthetic SMTP failure"));
    await runNotifications(store, send);
    expect(store.finish).toHaveBeenCalledWith(job, "uncertain");
    expect(send.mock.calls[0][0]).toEqual({ messageId: `<feedback-${id}@thecreledger.com>`,
      subject: "New feedback for The CRE Ledger", text: `Open the private feedback dashboard. Reference: ${id}` });
  });

  it("locks an eligible job and records the claim in the same transaction", async () => {
    const db = fakeDb();
    db.rows.mockResolvedValue([{ submission_id: id, attempt_count: 0 }]);
    const job = await notificationStore(db.db).claim();
    expect(job).toMatchObject({ submissionId: id, attempt: 1 });
    expect(db.rows.mock.calls[0][0]).toContain("FOR UPDATE");
    expect(db.transaction).toHaveBeenCalledOnce();
    expect(db.write.mock.calls.map(([, params]) => params)).toEqual([[job?.claim, 1, id], [job?.claim, id]]);
  });

  it("bounds confirmed-safe retries and records the outcome only for the current claim", async () => {
    const db = fakeDb();
    const store = notificationStore(db.db);
    await store.finish(job, "retry");
    expect(db.write.mock.calls[0][1]).toEqual(["pending", 60, id, id]);
    expect(db.write.mock.calls[1][1]).toEqual(["retry", id]);
    db.write.mockClear();
    await store.finish({ ...job, attempt: 4 }, "retry");
    expect(db.write.mock.calls[0][1]).toEqual(["failed", 0, id, id]);
    db.write.mockClear();
    db.write.mockResolvedValueOnce(0);
    await store.finish(job, "sent");
    expect(db.write).toHaveBeenCalledOnce();
  });

  it("classifies only an explicit pre-DATA 4xx as safe to retry", async () => {
    const sendMail = vi.fn().mockRejectedValueOnce({ command: "RCPT TO", responseCode: 450 })
      .mockRejectedValueOnce({ command: "DATA", responseCode: 450 })
      .mockResolvedValueOnce({ accepted: ["synthetic"], rejected: [] });
    const send = hostingerNotice(sendMail, "not-a-real-inbox@example.invalid");
    const notice = { subject: "Synthetic", text: "Reference only", messageId: "<synthetic@example.invalid>" };
    await expect(send(notice)).resolves.toBe("retry");
    await expect(send(notice)).resolves.toBe("uncertain");
    await expect(send(notice)).resolves.toBe("sent");
  });
});
