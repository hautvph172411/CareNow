-- Đưa place_kind vào metadata (JSON text), gỡ cột place_kind.
-- Chạy khi DB đã có cột place_kind (sau bản migration cũ).

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tbl_clinic_place'
      AND column_name = 'place_kind'
  ) THEN
    UPDATE tbl_clinic_place AS t
    SET metadata = (
      COALESCE(
        NULLIF(trim(both FROM COALESCE(t.metadata::text, '')), '')::jsonb,
        '{}'::jsonb
      ) || jsonb_build_object('place_kind', t.place_kind)
    )::text;

    ALTER TABLE tbl_clinic_place DROP COLUMN place_kind;
  END IF;
END $$;

COMMIT;
