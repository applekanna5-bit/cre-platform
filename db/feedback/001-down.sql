-- Destructive rollback. Restore or export the dedicated staging schema before use.
DROP TABLE feedback_rate_windows;
DROP TABLE feedback_idempotency;
DROP TABLE feedback_outbox_attempts;
DROP TABLE feedback_outbox;
DROP TABLE feedback_corrections;
DROP TABLE feedback_owner_notes;
DROP TABLE feedback_status_history;
DROP TABLE feedback_submissions;
