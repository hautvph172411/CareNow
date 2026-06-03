-- =============================================================================
-- Migration: chuyển tbl_patient.province / district (TEXT) → province_id / ward_id (FK)
-- Run:  psql -U postgres -d CareNow -f src/config/migrations/2026_05_02_patient_location_fk.sql
-- =============================================================================

BEGIN;

-- 1) Bỏ 2 cột text cũ (nếu user đã chạy schema cũ)
ALTER TABLE tbl_patient DROP COLUMN IF EXISTS province;
ALTER TABLE tbl_patient DROP COLUMN IF EXISTS district;

-- 2) Thêm 2 cột FK mới (nullable - patient có thể chưa điền)
ALTER TABLE tbl_patient
    ADD COLUMN IF NOT EXISTS province_id INTEGER,
    ADD COLUMN IF NOT EXISTS ward_id     INTEGER;

-- 3) Thiết lập FK (chỉ thêm nếu các bảng location đã tồn tại)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tbl_location_province') THEN
        BEGIN
            ALTER TABLE tbl_patient
                ADD CONSTRAINT fk_patient_province
                FOREIGN KEY (province_id) REFERENCES tbl_location_province(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tbl_location_ward') THEN
        BEGIN
            ALTER TABLE tbl_patient
                ADD CONSTRAINT fk_patient_ward
                FOREIGN KEY (ward_id) REFERENCES tbl_location_ward(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- 4) Index cho query nhanh
CREATE INDEX IF NOT EXISTS idx_patient_province_id ON tbl_patient(province_id);
CREATE INDEX IF NOT EXISTS idx_patient_ward_id     ON tbl_patient(ward_id);

COMMIT;
