-- =============================================================================
-- Migration: tạo bảng tbl_service (Dịch vụ) + thêm FK service_id vào tbl_clinic_specialist
-- Quan hệ: 1 service -> N specialty (chuyên khoa)
-- Ví dụ:
--   service "Khám chuyên khoa"  -> specialty: Cơ xương khớp, Nhi khoa, Tim mạch...
--   service "Khám từ xa"        -> specialty: Cơ xương khớp từ xa...
--   service "Gói phẫu thuật"    -> specialty: Phẫu thuật nam học...
--
-- Run:  psql -U postgres -d CareNow -f src/config/migrations/2026_05_02_create_service.sql
-- =============================================================================

BEGIN;

-- 1) Bảng dịch vụ
CREATE TABLE IF NOT EXISTS tbl_service (
    id SERIAL PRIMARY KEY,

    name        TEXT NOT NULL,
    url         TEXT,                       -- slug

    description TEXT,
    image       TEXT,
    content     TEXT,

    rank        INTEGER DEFAULT 99,
    status      INTEGER DEFAULT 1,

    created_at  INTEGER,                    -- epoch seconds
    updated_at  INTEGER
);

COMMENT ON TABLE  tbl_service              IS 'Bảng dịch vụ (gom nhóm chuyên khoa)';
COMMENT ON COLUMN tbl_service.id           IS 'ID tự tăng';
COMMENT ON COLUMN tbl_service.name         IS 'Tên dịch vụ';
COMMENT ON COLUMN tbl_service.url          IS 'Slug (URL friendly)';
COMMENT ON COLUMN tbl_service.description  IS 'Mô tả ngắn';
COMMENT ON COLUMN tbl_service.image        IS 'Ảnh đại diện';
COMMENT ON COLUMN tbl_service.content      IS 'Nội dung chi tiết (HTML)';
COMMENT ON COLUMN tbl_service.rank         IS 'Thứ tự hiển thị (số nhỏ -> trước)';
COMMENT ON COLUMN tbl_service.status       IS '1=hoạt động, 0=vô hiệu';
COMMENT ON COLUMN tbl_service.created_at   IS 'Thời gian tạo (epoch s)';
COMMENT ON COLUMN tbl_service.updated_at   IS 'Thời gian cập nhật (epoch s)';

CREATE INDEX IF NOT EXISTS idx_service_status ON tbl_service(status);
CREATE INDEX IF NOT EXISTS idx_service_rank   ON tbl_service(rank);

-- 2) FK service_id ở chuyên khoa (chuyên khoa "thuộc" 1 dịch vụ)
ALTER TABLE tbl_clinic_specialist
    ADD COLUMN IF NOT EXISTS service_id INTEGER;

DO $$
BEGIN
    BEGIN
        ALTER TABLE tbl_clinic_specialist
            ADD CONSTRAINT fk_specialist_service
            FOREIGN KEY (service_id) REFERENCES tbl_service(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

CREATE INDEX IF NOT EXISTS idx_specialist_service_id ON tbl_clinic_specialist(service_id);

-- 3) Seed sẵn 3 dịch vụ mặc định để FE có dữ liệu test ngay
INSERT INTO tbl_service (name, url, description, rank, status, created_at, updated_at)
VALUES
    ('Khám chuyên khoa', 'kham-chuyen-khoa', 'Khám và điều trị các chuyên khoa', 1, 1, EXTRACT(EPOCH FROM NOW())::INT, EXTRACT(EPOCH FROM NOW())::INT),
    ('Khám từ xa',       'kham-tu-xa',       'Tư vấn / khám online qua video',     2, 1, EXTRACT(EPOCH FROM NOW())::INT, EXTRACT(EPOCH FROM NOW())::INT),
    ('Gói phẫu thuật',   'goi-phau-thuat',   'Các gói phẫu thuật trọn gói',        3, 1, EXTRACT(EPOCH FROM NOW())::INT, EXTRACT(EPOCH FROM NOW())::INT)
ON CONFLICT DO NOTHING;

COMMIT;
