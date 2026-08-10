-- Keep phone-country data authoritative even when a profile update changes phone.
-- Current supported phone countries are Qatar (+974) and Jordan (+962).

CREATE OR REPLACE FUNCTION set_user_phone_country()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  normalized_phone text;
BEGIN
  IF NEW.phone IS NULL OR NEW.phone = '' THEN
    NEW.phone_country := NULL;
    RETURN NEW;
  END IF;

  normalized_phone := regexp_replace(NEW.phone, '[[:space:]()-]', '', 'g');
  NEW.phone := normalized_phone;

  IF normalized_phone ~ '^\+974[0-9]{8}$' THEN
    NEW.phone_country := 'qatar';
  ELSIF normalized_phone ~ '^\+9627[0-9]{8}$' THEN
    NEW.phone_country := 'jordan';
  ELSE
    RAISE EXCEPTION 'invalid phone number format';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_phone_identity_trigger ON "users";

CREATE TRIGGER users_phone_identity_trigger
BEFORE INSERT OR UPDATE OF "phone"
ON "users"
FOR EACH ROW
EXECUTE FUNCTION set_user_phone_country();

-- Validate existing non-empty phone values before relying on the trigger.
DO $$
DECLARE
  invalid_count integer;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM "users"
  WHERE "phone" IS NOT NULL
    AND "phone" <> ''
    AND regexp_replace("phone", '[[:space:]()-]', '', 'g') !~ '^\+974[0-9]{8}$'
    AND regexp_replace("phone", '[[:space:]()-]', '', 'g') !~ '^\+9627[0-9]{8}$';

  IF invalid_count > 0 THEN
    RAISE NOTICE 'Existing users contain % phone values outside the supported Qatar/Jordan formats; they must be corrected before those phone values are updated.', invalid_count;
  END IF;
END;
$$;
