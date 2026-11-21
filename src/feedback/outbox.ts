import "server-only";
import { randomUUID } from "node:crypto";
import type { Database } from "./database";

type Job = { submissionId: string; claim: string; attempt: number };
export type Delivery = "sent" | "retry" | "failed" | "uncertain";
const retryScheduleSeconds = [60, 300, 1800];

export function notificationStore(db: Database) {
  return {
    expire() {
      return db.transaction(async sql => {
        await sql.write(`UPDATE feedback_outbox AS job JOIN feedback_outbox_attempts AS attempt
          ON attempt.claim_token = job.claim_token
          SET job.state = 'uncertain', job.claim_token = NULL, job.lease_until = NULL,
              attempt.outcome = 'uncertain', attempt.finished_at = UTC_TIMESTAMP(3)
          WHERE job.state = 'sending' AND job.lease_until <= UTC_TIMESTAMP(3)`);
      });
    },
    claim(): Promise<Job | null> {
      return db.transaction(async sql => {
        const [candidate] = await sql.rows<{ submission_id: string; attempt_count: number }>(
          `SELECT submission_id, attempt_count FROM feedback_outbox
           WHERE state = 'pending' AND available_at <= UTC_TIMESTAMP(3)
           ORDER BY available_at, submission_id LIMIT 1 FOR UPDATE`);
        if (!candidate) return null;
        const job = { submissionId: candidate.submission_id, claim: randomUUID(), attempt: candidate.attempt_count + 1 };
        await sql.write(`UPDATE feedback_outbox SET state = 'sending', claim_token = ?, attempt_count = ?,
          lease_until = TIMESTAMPADD(SECOND, 120, UTC_TIMESTAMP(3)) WHERE submission_id = ?`,
          [job.claim, job.attempt, job.submissionId]);
        await sql.write("INSERT INTO feedback_outbox_attempts (claim_token, submission_id, outcome) VALUES (?, ?, 'sending')",
          [job.claim, job.submissionId]);
        return job;
      });
    },
    finish(job: Job, delivery: Delivery) {
      const delay = retryScheduleSeconds[job.attempt - 1];
      const outcome = delivery === "retry" && delay === undefined ? "failed" : delivery;
      return db.transaction(async sql => {
        const changed = await sql.write(`UPDATE feedback_outbox SET state = ?, claim_token = NULL, lease_until = NULL,
          available_at = TIMESTAMPADD(SECOND, ?, UTC_TIMESTAMP(3))
          WHERE submission_id = ? AND claim_token = ? AND state = 'sending'`,
          [outcome === "retry" ? "pending" : outcome, delay ?? 0, job.submissionId, job.claim]);
        if (changed === 1) await sql.write(
          "UPDATE feedback_outbox_attempts SET outcome = ?, finished_at = UTC_TIMESTAMP(3) WHERE claim_token = ?",
          [outcome, job.claim]);
      });
    },
  };
}

type Notice = { subject: string; text: string; messageId: string };
export type SendNotice = (notice: Notice) => Promise<Delivery>;

export async function runNotifications(store: ReturnType<typeof notificationStore>, send: SendNotice) {
  await store.expire();
  for (let count = 0; count < 5; count++) {
    const job = await store.claim();
    if (!job) return;
    let outcome: Delivery = "uncertain";
    try {
      outcome = await send({
        subject: "New feedback for The CRE Ledger",
        text: `Open the private feedback dashboard. Reference: ${job.submissionId}`,
        messageId: `<feedback-${job.submissionId}@thecreledger.com>`,
      });
    } catch {
      // Transport exceptions may occur after acceptance. An owner must reconcile the result.
    }
    await store.finish(job, outcome);
  }
}
