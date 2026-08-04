BEGIN;

DO $$ BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_constraint
   WHERE conrelid='public.store_order_items'::regclass
     AND contype IN('p','u')
     AND pg_get_constraintdef(oid)='UNIQUE (order_id, id)'
 ) THEN
   ALTER TABLE store_order_items ADD CONSTRAINT uq_store_order_items_order_id_id UNIQUE (order_id,id);
   COMMENT ON CONSTRAINT uq_store_order_items_order_id_id ON store_order_items IS 'owned by migration 202607300002_customer_agenda_up';
 END IF;
END $$;

CREATE TABLE store_audit_events (
 id BIGSERIAL PRIMARY KEY, public_id CHAR(32) NOT NULL UNIQUE, entity_type VARCHAR(32) NOT NULL,
 entity_id BIGINT NOT NULL, action VARCHAR(64) NOT NULL, outcome VARCHAR(32) NOT NULL,
 old_state VARCHAR(32), new_state VARCHAR(32), actor_type VARCHAR(32) NOT NULL,
 actor_user_id TEXT, actor_session_id CHAR(64), auth_source VARCHAR(64) NOT NULL,
 correlation_id CHAR(32) NOT NULL, idempotency_key_hash CHAR(64), metadata JSONB,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK ((actor_type='customer_account' AND actor_user_id IS NOT NULL AND actor_session_id IS NULL) OR
        (actor_type='customer_guest' AND actor_user_id IS NULL AND actor_session_id IS NULL) OR
        (actor_type='legacy_shared_admin' AND actor_user_id IS NULL AND actor_session_id IS NOT NULL) OR
        (actor_type='system' AND actor_user_id IS NULL AND actor_session_id IS NULL))
);

CREATE TABLE store_claims (
 id BIGSERIAL PRIMARY KEY, public_id CHAR(32) NOT NULL UNIQUE,
 order_id INT NOT NULL REFERENCES store_orders(id) ON DELETE RESTRICT,
 owner_type VARCHAR(16) NOT NULL CHECK (owner_type IN ('account','guest')), owner_user_id TEXT,
 reason_code VARCHAR(64) NOT NULL, problem_description TEXT NOT NULL,
 requested_resolution VARCHAR(32) NOT NULL CHECK (requested_resolution IN ('repair','replacement','refund','store_credit','other')),
 status VARCHAR(32) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','waiting_for_customer','accepted','rejected','resolved','cancelled')),
 customer_note TEXT, internal_note TEXT, idempotency_scope_hash CHAR(64) NOT NULL,
 idempotency_key_hash CHAR(64) NOT NULL, request_hash CHAR(64) NOT NULL,
 version INT NOT NULL DEFAULT 1 CHECK (version > 0), created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), closed_at TIMESTAMPTZ, audit_metadata JSONB,
 UNIQUE (id, order_id), UNIQUE (idempotency_scope_hash,idempotency_key_hash),
 CHECK ((owner_type='account' AND owner_user_id IS NOT NULL) OR (owner_type='guest' AND owner_user_id IS NULL))
);
CREATE TABLE store_claim_items (
 id BIGSERIAL PRIMARY KEY, claim_id BIGINT NOT NULL, order_id INT NOT NULL, order_item_id INT NOT NULL,
 requested_quantity INT NOT NULL CHECK(requested_quantity>0), approved_quantity INT CHECK(approved_quantity>0 AND approved_quantity<=requested_quantity),
 consumed_quantity INT NOT NULL DEFAULT 0 CHECK(consumed_quantity>=0 AND (consumed_quantity=0 OR (approved_quantity IS NOT NULL AND consumed_quantity<=approved_quantity))),
 reason_code VARCHAR(64), requested_resolution VARCHAR(32), resolution_outcome VARCHAR(32),
 FOREIGN KEY(claim_id,order_id) REFERENCES store_claims(id,order_id) ON DELETE RESTRICT,
 FOREIGN KEY(order_id,order_item_id) REFERENCES store_order_items(order_id,id) ON DELETE RESTRICT,
 UNIQUE(claim_id,order_item_id)
);
CREATE TABLE store_claim_events (
 id BIGSERIAL PRIMARY KEY, public_id CHAR(32) NOT NULL UNIQUE, claim_id BIGINT NOT NULL REFERENCES store_claims(id) ON DELETE RESTRICT,
 action VARCHAR(64) NOT NULL, old_state VARCHAR(32), new_state VARCHAR(32), actor_type VARCHAR(32) NOT NULL, actor_user_id TEXT,
 actor_session_id CHAR(64), auth_source VARCHAR(64) NOT NULL, public_message TEXT, internal_note TEXT, correlation_id CHAR(32) NOT NULL,
 idempotency_key_hash CHAR(64), request_hash CHAR(64), entity_version INT CHECK(entity_version IS NULL OR entity_version>0), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
 ,CHECK ((actor_type='customer_account' AND actor_user_id IS NOT NULL AND actor_session_id IS NULL) OR
         (actor_type='customer_guest' AND actor_user_id IS NULL AND actor_session_id IS NULL) OR
         (actor_type='legacy_shared_admin' AND actor_user_id IS NULL AND actor_session_id IS NOT NULL) OR
         (actor_type='system' AND actor_user_id IS NULL AND actor_session_id IS NULL))
);

CREATE TABLE store_returns (
 id BIGSERIAL PRIMARY KEY, public_id CHAR(32) NOT NULL UNIQUE, order_id INT NOT NULL REFERENCES store_orders(id) ON DELETE RESTRICT,
 owner_type VARCHAR(16) NOT NULL CHECK(owner_type IN ('account','guest')), owner_user_id TEXT, reason_code VARCHAR(64) NOT NULL,
 return_shipping_method VARCHAR(64), return_tracking_number VARCHAR(255), return_tracking_url TEXT,
 decision VARCHAR(32), refund_status VARCHAR(32) NOT NULL DEFAULT 'not_requested' CHECK(refund_status IN ('not_requested','not_applicable','pending','requires_action','failed','confirmed')),
 refund_provider VARCHAR(32), refund_external_id VARCHAR(255), refund_amount_minor BIGINT CHECK(refund_amount_minor IS NULL OR refund_amount_minor>0),
 refund_currency VARCHAR(3), refund_confirmed_at TIMESTAMPTZ, refund_evidence_source VARCHAR(64),
 status VARCHAR(32) NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','approved','rejected','waiting_for_goods','received','inspected','refund_pending','completed','cancelled')),
 customer_note TEXT, internal_note TEXT, idempotency_scope_hash CHAR(64) NOT NULL, idempotency_key_hash CHAR(64) NOT NULL, request_hash CHAR(64) NOT NULL,
 version INT NOT NULL DEFAULT 1 CHECK(version>0), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 received_at TIMESTAMPTZ, inspected_at TIMESTAMPTZ, completed_at TIMESTAMPTZ, closed_at TIMESTAMPTZ, audit_metadata JSONB,
 UNIQUE(id,order_id), UNIQUE(idempotency_scope_hash,idempotency_key_hash), CHECK((owner_type='account' AND owner_user_id IS NOT NULL) OR (owner_type='guest' AND owner_user_id IS NULL)),
 CHECK(return_tracking_url IS NULL OR return_tracking_url ~ '^https://'),
 CHECK(refund_currency IS NULL OR refund_currency ~ '^[A-Z]{3}$'),
 CHECK(refund_status<>'confirmed' OR (refund_provider IS NOT NULL AND refund_external_id IS NOT NULL AND refund_amount_minor IS NOT NULL AND refund_currency IS NOT NULL AND refund_confirmed_at IS NOT NULL AND refund_evidence_source IS NOT NULL))
);
CREATE TABLE store_return_items (
 id BIGSERIAL PRIMARY KEY, return_id BIGINT NOT NULL, order_id INT NOT NULL, order_item_id INT NOT NULL,
 requested_quantity INT NOT NULL CHECK(requested_quantity>0), received_quantity INT NOT NULL DEFAULT 0 CHECK(received_quantity>=0 AND received_quantity<=requested_quantity),
 inspected_quantity INT NOT NULL DEFAULT 0 CHECK(inspected_quantity>=0 AND inspected_quantity<=requested_quantity),
 consumed_quantity INT NOT NULL DEFAULT 0 CHECK(consumed_quantity>=0 AND consumed_quantity<=received_quantity AND consumed_quantity<=inspected_quantity),
 FOREIGN KEY(return_id,order_id) REFERENCES store_returns(id,order_id) ON DELETE RESTRICT,
 FOREIGN KEY(order_id,order_item_id) REFERENCES store_order_items(order_id,id) ON DELETE RESTRICT, UNIQUE(return_id,order_item_id)
);
CREATE TABLE store_return_events (LIKE store_claim_events INCLUDING ALL);
ALTER TABLE store_return_events DROP COLUMN claim_id;
ALTER TABLE store_return_events ADD COLUMN return_id BIGINT NOT NULL REFERENCES store_returns(id) ON DELETE RESTRICT;
CREATE SEQUENCE store_return_events_id_seq OWNED BY store_return_events.id;
ALTER TABLE store_return_events ALTER COLUMN id SET DEFAULT nextval('store_return_events_id_seq');

CREATE TABLE store_deliveries (
 id BIGSERIAL PRIMARY KEY, public_id CHAR(32) NOT NULL UNIQUE, order_id INT NOT NULL REFERENCES store_orders(id) ON DELETE RESTRICT,
 carrier_code VARCHAR(64), carrier_name VARCHAR(128), shipping_method VARCHAR(64), tracking_number VARCHAR(255), tracking_url TEXT CHECK(tracking_url IS NULL OR tracking_url ~ '^https://'),
 shipped_at TIMESTAMPTZ, estimated_delivery_at TIMESTAMPTZ, delivered_at TIMESTAMPTZ, last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','prepared','handed_to_carrier','in_transit','delivered','delivery_exception','cancelled')),
 customer_message TEXT, internal_note TEXT, version INT NOT NULL DEFAULT 1 CHECK(version>0), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), audit_metadata JSONB, UNIQUE(id,order_id)
 ,idempotency_scope_hash CHAR(64) NOT NULL,idempotency_key_hash CHAR(64) NOT NULL,request_hash CHAR(64) NOT NULL,UNIQUE(idempotency_scope_hash,idempotency_key_hash),
 CHECK(status<>'delivered' OR delivered_at IS NOT NULL)
);
CREATE TABLE store_delivery_items (
 id BIGSERIAL PRIMARY KEY, delivery_id BIGINT NOT NULL, order_id INT NOT NULL, order_item_id INT NOT NULL, shipped_quantity INT NOT NULL CHECK(shipped_quantity>0),
 FOREIGN KEY(delivery_id,order_id) REFERENCES store_deliveries(id,order_id) ON DELETE RESTRICT,
 FOREIGN KEY(order_id,order_item_id) REFERENCES store_order_items(order_id,id) ON DELETE RESTRICT, UNIQUE(delivery_id,order_item_id)
);
CREATE TABLE store_delivery_events (LIKE store_claim_events INCLUDING ALL);
ALTER TABLE store_delivery_events DROP COLUMN claim_id;
ALTER TABLE store_delivery_events ADD COLUMN delivery_id BIGINT NOT NULL REFERENCES store_deliveries(id) ON DELETE RESTRICT;
CREATE SEQUENCE store_delivery_events_id_seq OWNED BY store_delivery_events.id;
ALTER TABLE store_delivery_events ALTER COLUMN id SET DEFAULT nextval('store_delivery_events_id_seq');

CREATE TABLE store_case_attachments (
 id BIGSERIAL PRIMARY KEY, public_id CHAR(32) NOT NULL UNIQUE, claim_id BIGINT REFERENCES store_claims(id) ON DELETE RESTRICT,
 return_id BIGINT REFERENCES store_returns(id) ON DELETE RESTRICT, owner_type VARCHAR(16) NOT NULL CHECK(owner_type IN('account','guest')), owner_user_id TEXT,
 storage_provider VARCHAR(32) NOT NULL CHECK(storage_provider='local_private'),
 storage_key VARCHAR(512) NOT NULL CHECK(length(storage_key)<=512 AND storage_key ~ '^[a-z0-9][a-z0-9/_.-]+$' AND storage_key !~ '(^|/)\\.\\.(/|$)'),
 stored_filename VARCHAR(128) NOT NULL, original_filename VARCHAR(255) NOT NULL, detected_mime VARCHAR(127) NOT NULL,
 byte_size BIGINT NOT NULL CHECK(byte_size>0), sha256 CHAR(64) NOT NULL, scan_status VARCHAR(32) NOT NULL DEFAULT 'not_configured' CHECK(scan_status IN ('not_configured','pending','clean','rejected','failed')),
 idempotency_scope_hash CHAR(64) NOT NULL, idempotency_key_hash CHAR(64) NOT NULL, request_hash CHAR(64) NOT NULL,
 uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ, revoked_at TIMESTAMPTZ, revoked_reason VARCHAR(255), audit_metadata JSONB,
 CHECK((claim_id IS NOT NULL AND return_id IS NULL) OR (claim_id IS NULL AND return_id IS NOT NULL)),
 CHECK((owner_type='account' AND owner_user_id IS NOT NULL) OR (owner_type='guest' AND owner_user_id IS NULL)), UNIQUE(storage_provider,storage_key), UNIQUE(idempotency_scope_hash,idempotency_key_hash)
);
CREATE TABLE store_product_favorites (user_id TEXT NOT NULL, product_id INT NOT NULL REFERENCES store_products(id) ON DELETE RESTRICT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(user_id,product_id));

CREATE INDEX idx_claims_order ON store_claims(order_id,created_at DESC); CREATE INDEX idx_claim_items_item ON store_claim_items(order_item_id);
CREATE INDEX idx_returns_order ON store_returns(order_id,created_at DESC); CREATE INDEX idx_return_items_item ON store_return_items(order_item_id);
CREATE INDEX idx_deliveries_order ON store_deliveries(order_id,created_at DESC); CREATE INDEX idx_delivery_tracking ON store_deliveries(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX idx_attachments_claim ON store_case_attachments(claim_id,uploaded_at DESC); CREATE INDEX idx_attachments_return ON store_case_attachments(return_id,uploaded_at DESC);
CREATE INDEX idx_favorites_user ON store_product_favorites(user_id,created_at DESC);
CREATE INDEX idx_claims_owner_created ON store_claims(owner_user_id,created_at DESC) WHERE owner_user_id IS NOT NULL;
CREATE INDEX idx_claims_status_created ON store_claims(status,created_at DESC);
CREATE INDEX idx_returns_owner_created ON store_returns(owner_user_id,created_at DESC) WHERE owner_user_id IS NOT NULL;
CREATE INDEX idx_returns_status_created ON store_returns(status,created_at DESC);
CREATE INDEX idx_deliveries_status_updated ON store_deliveries(status,last_updated_at DESC);
CREATE INDEX idx_claim_events_parent_created ON store_claim_events(claim_id,created_at,id);
CREATE INDEX idx_return_events_parent_created ON store_return_events(return_id,created_at,id);
CREATE INDEX idx_delivery_events_parent_created ON store_delivery_events(delivery_id,created_at,id);
CREATE UNIQUE INDEX uq_claim_event_idempotency ON store_claim_events(claim_id,action,idempotency_key_hash) WHERE idempotency_key_hash IS NOT NULL;
CREATE UNIQUE INDEX uq_return_event_idempotency ON store_return_events(return_id,action,idempotency_key_hash) WHERE idempotency_key_hash IS NOT NULL;
CREATE UNIQUE INDEX uq_delivery_event_idempotency ON store_delivery_events(delivery_id,action,idempotency_key_hash) WHERE idempotency_key_hash IS NOT NULL;

CREATE OR REPLACE FUNCTION vevit_customer_agenda_reject_append_only_change() RETURNS trigger
LANGUAGE plpgsql
AS $$ BEGIN RAISE EXCEPTION 'append-only ledger cannot be modified' USING ERRCODE='55000'; END $$;
CREATE TRIGGER store_audit_events_append_only BEFORE UPDATE OR DELETE ON store_audit_events FOR EACH ROW EXECUTE FUNCTION vevit_customer_agenda_reject_append_only_change();
CREATE TRIGGER store_claim_events_append_only BEFORE UPDATE OR DELETE ON store_claim_events FOR EACH ROW EXECUTE FUNCTION vevit_customer_agenda_reject_append_only_change();
CREATE TRIGGER store_return_events_append_only BEFORE UPDATE OR DELETE ON store_return_events FOR EACH ROW EXECUTE FUNCTION vevit_customer_agenda_reject_append_only_change();
CREATE TRIGGER store_delivery_events_append_only BEFORE UPDATE OR DELETE ON store_delivery_events FOR EACH ROW EXECUTE FUNCTION vevit_customer_agenda_reject_append_only_change();

DO $$ DECLARE t text; s text; BEGIN
 FOREACH t IN ARRAY ARRAY['store_audit_events','store_claims','store_claim_items','store_claim_events','store_returns','store_return_items','store_return_events','store_deliveries','store_delivery_items','store_delivery_events','store_case_attachments','store_product_favorites'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC',t);
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon',t); END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated',t); END IF;
 END LOOP;
 FOREACH s IN ARRAY ARRAY['store_audit_events_id_seq','store_claims_id_seq','store_claim_items_id_seq','store_claim_events_id_seq','store_returns_id_seq','store_return_items_id_seq','store_return_events_id_seq','store_deliveries_id_seq','store_delivery_items_id_seq','store_delivery_events_id_seq','store_case_attachments_id_seq'] LOOP
  EXECUTE format('REVOKE ALL ON SEQUENCE public.%I FROM PUBLIC',s);
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN EXECUTE format('REVOKE ALL ON SEQUENCE public.%I FROM anon',s); END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN EXECUTE format('REVOKE ALL ON SEQUENCE public.%I FROM authenticated',s); END IF;
 END LOOP;
END $$;

COMMIT;
