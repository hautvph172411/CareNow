-- Gỡ migration mở rộng cũ (nếu đã chạy). Bảng tbl_clinic_place chỉ giữ schema cốt lõi.
-- psql -U postgres -d CareNow -f src/config/migrations/2026_05_04_clinic_place_drop_profile_extensions.sql

BEGIN;

DROP TABLE IF EXISTS tbl_clinic_place_insurance_package CASCADE;
DROP TABLE IF EXISTS tbl_clinic_place_price_package CASCADE;
DROP TABLE IF EXISTS tbl_clinic_place_doctor CASCADE;
DROP TABLE IF EXISTS tbl_clinic_place_service CASCADE;
DROP TABLE IF EXISTS tbl_clinic_place_specialist CASCADE;

ALTER TABLE tbl_clinic_place DROP COLUMN IF EXISTS place_code;
ALTER TABLE tbl_clinic_place DROP COLUMN IF EXISTS email;
ALTER TABLE tbl_clinic_place DROP COLUMN IF EXISTS website;
ALTER TABLE tbl_clinic_place DROP COLUMN IF EXISTS latitude;
ALTER TABLE tbl_clinic_place DROP COLUMN IF EXISTS longitude;
ALTER TABLE tbl_clinic_place DROP COLUMN IF EXISTS cover_image;
ALTER TABLE tbl_clinic_place DROP COLUMN IF EXISTS is_featured;
ALTER TABLE tbl_clinic_place DROP COLUMN IF EXISTS working_hours;
ALTER TABLE tbl_clinic_place DROP COLUMN IF EXISTS exam_process;
ALTER TABLE tbl_clinic_place DROP COLUMN IF EXISTS faqs;

COMMIT;
