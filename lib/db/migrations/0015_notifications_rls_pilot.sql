BEGIN;

-- RLS Pilot: notifications only.
-- This migration intentionally does not modify grants or RLS on any other table.
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_owner" ON "notifications";
DROP POLICY IF EXISTS "notifications_update_owner" ON "notifications";
DROP POLICY IF EXISTS "notifications_insert_system" ON "notifications";
DROP POLICY IF EXISTS "notifications_delete_deny" ON "notifications";

-- User-owned consumption: only the authenticated application actor may read
-- rows addressed to that same actor. The identity comes from the transaction-
-- local context bridge, never from a request parameter.
CREATE POLICY "notifications_select_owner"
ON "notifications"
FOR SELECT
USING (
  current_setting('app.actor_kind', true) = 'user'
  AND current_setting('app.user_id', true) = "user_id"
);

-- User-owned mutation: the existing owner must remain the owner after UPDATE.
CREATE POLICY "notifications_update_owner"
ON "notifications"
FOR UPDATE
USING (
  current_setting('app.actor_kind', true) = 'user'
  AND current_setting('app.user_id', true) = "user_id"
)
WITH CHECK (
  current_setting('app.actor_kind', true) = 'user'
  AND current_setting('app.user_id', true) = "user_id"
);

-- Trusted business creation is deliberately separated from user-owned
-- consumption. Only an explicit SystemActor transaction may create a row.
CREATE POLICY "notifications_insert_system"
ON "notifications"
FOR INSERT
WITH CHECK (
  current_setting('app.actor_kind', true) = 'system'
  AND current_setting('app.actor_id', true) = 'system_internal_actor'
  AND "user_id" IS NOT NULL
);

-- No DELETE policy is created. With RLS enabled this is deny-by-default.
-- The explicit policy name documents the intended invariant without granting
-- any delete path.
CREATE POLICY "notifications_delete_deny"
ON "notifications"
FOR DELETE
USING (false);

COMMIT;
