BEGIN;

DO $$
BEGIN
  IF to_regclass('public.disputes') IS NULL THEN
    RAISE EXCEPTION 'T02-01 FAIL: disputes table missing';
  END IF;
  IF to_regclass('public.dispute_evidence') IS NULL THEN
    RAISE EXCEPTION 'T02-01 FAIL: dispute_evidence table missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'dispute_status'
  ) THEN
    RAISE EXCEPTION 'T02-01 FAIL: dispute_status enum missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'dispute_resolution'
  ) THEN
    RAISE EXCEPTION 'T02-01 FAIL: dispute_resolution enum missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'dispute_evidence_type'
  ) THEN
    RAISE EXCEPTION 'T02-01 FAIL: dispute_evidence_type enum missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'dispute_evidence_status'
  ) THEN
    RAISE EXCEPTION 'T02-01 FAIL: dispute_evidence_status enum missing';
  END IF;

  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='disputes') <> 17 THEN
    RAISE EXCEPTION 'T02-01 FAIL: disputes column count mismatch';
  END IF;

  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='dispute_evidence') <> 14 THEN
    RAISE EXCEPTION 'T02-01 FAIL: dispute_evidence column count mismatch';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='disputes_case_id_fk') THEN RAISE EXCEPTION 'T02-01 FAIL: case FK missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='disputes_release_request_id_fk') THEN RAISE EXCEPTION 'T02-01 FAIL: release request FK missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='disputes_milestone_id_fk') THEN RAISE EXCEPTION 'T02-01 FAIL: milestone FK missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='disputes_escrow_account_id_fk') THEN RAISE EXCEPTION 'T02-01 FAIL: escrow FK missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='disputes_quote_id_fk') THEN RAISE EXCEPTION 'T02-01 FAIL: quote FK missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='disputes_client_id_fk') THEN RAISE EXCEPTION 'T02-01 FAIL: client FK missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='disputes_lawyer_id_fk') THEN RAISE EXCEPTION 'T02-01 FAIL: lawyer FK missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='disputes_resolved_by_fk') THEN RAISE EXCEPTION 'T02-01 FAIL: resolver FK missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='dispute_evidence_dispute_id_fk') THEN RAISE EXCEPTION 'T02-01 FAIL: evidence dispute FK missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='dispute_evidence_submitted_by_fk') THEN RAISE EXCEPTION 'T02-01 FAIL: evidence submitter FK missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='dispute_evidence_reviewed_by_fk') THEN RAISE EXCEPTION 'T02-01 FAIL: evidence reviewer FK missing'; END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='disputes_release_request_uidx') THEN RAISE EXCEPTION 'T02-01 FAIL: dispute uniqueness index missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='disputes_case_id_idx') THEN RAISE EXCEPTION 'T02-01 FAIL: case index missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='disputes_milestone_id_idx') THEN RAISE EXCEPTION 'T02-01 FAIL: milestone index missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='disputes_escrow_account_id_idx') THEN RAISE EXCEPTION 'T02-01 FAIL: escrow index missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='disputes_quote_id_idx') THEN RAISE EXCEPTION 'T02-01 FAIL: quote index missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='disputes_status_idx') THEN RAISE EXCEPTION 'T02-01 FAIL: status index missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='dispute_evidence_dispute_id_idx') THEN RAISE EXCEPTION 'T02-01 FAIL: evidence dispute index missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='dispute_evidence_status_idx') THEN RAISE EXCEPTION 'T02-01 FAIL: evidence status index missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='dispute_evidence_source_reference_uidx') THEN RAISE EXCEPTION 'T02-01 FAIL: evidence source uniqueness index missing'; END IF;

  RAISE NOTICE 'T02-01 structural verification: PASS';
END $$;

SAVEPOINT t02_01_fk_guard;
DO $$
BEGIN
  BEGIN
    INSERT INTO disputes (
      id, case_id, release_request_id, milestone_id, escrow_account_id, quote_id,
      client_id, lawyer_id, reason
    ) VALUES (
      't02-01-invalid-dispute', 'missing-case', 'missing-release', 'missing-milestone',
      'missing-escrow', 'missing-quote', 'missing-client', 'missing-lawyer', 'synthetic FK guard'
    );
    RAISE EXCEPTION 'T02-01 FAIL: disputes accepted orphan references';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'T02-01 dispute FK guard: PASS';
  END;
END $$;
ROLLBACK TO SAVEPOINT t02_01_fk_guard;

SAVEPOINT t02_01_evidence_fk_guard;
DO $$
BEGIN
  BEGIN
    INSERT INTO dispute_evidence (
      id, dispute_id, submitted_by, evidence_type, storage_key, content_hash
    ) VALUES (
      't02-01-invalid-evidence', 'missing-dispute', 'missing-user', 'document',
      'synthetic/t02-01/invalid', 'synthetic-invalid-hash'
    );
    RAISE EXCEPTION 'T02-01 FAIL: dispute_evidence accepted orphan references';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'T02-01 evidence FK guard: PASS';
  END;
END $$;
ROLLBACK TO SAVEPOINT t02_01_evidence_fk_guard;

ROLLBACK;

SELECT 'T02-01 — DATA FOUNDATION PASS' AS result;
