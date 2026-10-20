-- Phase 2: queue of jobs that follow a verified payment (packet creation at Packeta; phase 5 adds invoices).
BEGIN;

CREATE TABLE IF NOT EXISTS payment_jobs (
    id BIGSERIAL PRIMARY KEY,
    kind VARCHAR(48) NOT NULL,
    ref VARCHAR(128) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(12) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),
    attempts INT NOT NULL DEFAULT 0,
    next_run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_error TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT payment_jobs_kind_ref_key UNIQUE (kind, ref)
);

CREATE INDEX IF NOT EXISTS idx_payment_jobs_due ON payment_jobs (next_run_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_payment_jobs_running ON payment_jobs (updated_at) WHERE status = 'running';

-- Service role only, like the other store tables.
ALTER TABLE public.payment_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.payment_jobs FROM PUBLIC;
REVOKE ALL ON SEQUENCE public.payment_jobs_id_seq FROM PUBLIC;
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON TABLE public.payment_jobs FROM anon;
        REVOKE ALL ON SEQUENCE public.payment_jobs_id_seq FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON TABLE public.payment_jobs FROM authenticated;
        REVOKE ALL ON SEQUENCE public.payment_jobs_id_seq FROM authenticated;
    END IF;
END $$;

COMMIT;
