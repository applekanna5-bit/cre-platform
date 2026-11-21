# Feedback migration 001

These files have not been applied. Only a separately authorised operator may run them against an explicitly selected, dedicated staging schema.

1. Confirm the instance, schema name, server version, InnoDB support, transaction isolation and UTC session time. Keep the migration account separate from restricted application and worker users.
2. Snapshot the dedicated schema. Review and apply `001-up.sql` once with the staging migration account. DDL implicitly commits. On any failure, stop and restore the original snapshot before retrying.
3. Inspect the foreign keys, indexes and storage engines. Record the migration version and checksum in the staging change record. Verify runtime and worker users cannot change the schema.
4. To reverse, stop writers and the worker, snapshot or export the schema and verify restore into a disposable schema. Review and apply `001-down.sql` to the same staging schema. It drops all feedback tables in reverse dependency order.
5. Define retention before launch. Delete idle rate windows and retire idempotency records only after the documented retry window. Submission deletion cascades to associated records. Apply the retention policy to backups.

In staging, prove that concurrent requests with the same key produce one submission, one initial status and one job. Test concurrent worker claims and termination before and after SMTP acceptance.
