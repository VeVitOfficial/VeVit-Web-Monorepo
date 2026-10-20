-- Drops the payment job queue. Pending jobs (for example packets not yet created at Packeta) are lost:
-- check `select * from payment_jobs where status <> 'done'` first.
BEGIN;

DROP TABLE IF EXISTS payment_jobs;

COMMIT;
