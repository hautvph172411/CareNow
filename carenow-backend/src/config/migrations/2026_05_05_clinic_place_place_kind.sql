-- Loại hình cơ sở (phân cấp cha–con theo đối tác)
-- psql -U postgres -d CareNow -f src/config/migrations/2026_05_05_clinic_place_place_kind.sql

BEGIN;

ALTER TABLE tbl_clinic_place ADD COLUMN IF NOT EXISTS page_content_blocks JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN tbl_clinic_place.page_content_blocks IS
  'Mảng [{ "title", "body" }] — nội dung trên trang cơ sở y tế';

COMMIT;
