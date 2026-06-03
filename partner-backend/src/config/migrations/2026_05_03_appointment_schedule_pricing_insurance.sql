-- =============================================================================
-- CareNow — Quản trị lịch hẹn (3 cụm DB tách biệt)
--   1) Lịch hẹn      : tbl_appt_schedule_* 
--   2) Giá khám      : tbl_clinic_price_package + tbl_clinic_price_item (1 gói → nhiều dòng giá)
--   3) Bảo hiểm      : tbl_clinic_insurance_package + tbl_clinic_insurance_item
--
-- Liên kết UI : tbl_appt_schedule_block có FK tùy chọn default_price_package_id,
--               default_insurance_package_id (NULL = admin chọn default khác ở tầng app).
--
-- FK tham chiếu  : tbl_clinic (bác sĩ), tbl_clinic_place, tbl_partner, tbl_clinic_specialist
--
-- Run: psql -U postgres -d CareNow -f src/config/migrations/2026_05_03_appointment_schedule_pricing_insurance.sql
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- PHẦN 2 (khai báo trước) — GÓI GIÁ + DÒNG GIÁ
-- 1 bác sĩ → nhiều gói giá; 1 gói → nhiều dòng giá (theo ngày / nơi khám / buổi…)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tbl_clinic_price_package (
    id              SERIAL PRIMARY KEY,
    clinic_id       INTEGER NOT NULL REFERENCES tbl_clinic(id) ON DELETE CASCADE,

    name            TEXT NOT NULL,           -- VD: "Khám thường", "Tái khám", "VIP"
    description     TEXT,
    status          INTEGER NOT NULL DEFAULT 1,  -- 1 hoạt động, 0 ẩn
    rank            INTEGER NOT NULL DEFAULT 99,

    created_at      INTEGER,                -- epoch seconds (đồng bộ style project)
    updated_at      INTEGER
);

COMMENT ON TABLE tbl_clinic_price_package IS 'Gói giá khám thuộc 1 bác sĩ (clinic)';
COMMENT ON COLUMN tbl_clinic_price_package.clinic_id IS 'FK bác sĩ — tbl_clinic';

CREATE INDEX IF NOT EXISTS idx_price_pkg_clinic ON tbl_clinic_price_package(clinic_id);
CREATE INDEX IF NOT EXISTS idx_price_pkg_status ON tbl_clinic_price_package(status);


CREATE TABLE IF NOT EXISTS tbl_clinic_price_item (
    id                  SERIAL PRIMARY KEY,
    price_package_id    INTEGER NOT NULL REFERENCES tbl_clinic_price_package(id) ON DELETE CASCADE,

    -- Thuộc 1 chi nhánh cụ thể; NULL = áp dụng mọi nơi bác sĩ đặt lịch (do app quyết định)
    clinic_place_id     INTEGER REFERENCES tbl_clinic_place(id) ON DELETE SET NULL,

    -- Khoảng ngày áp dụng (inclusive). NULL đến = không giới hạn cuối
    effective_from      DATE NOT NULL,
    effective_to        DATE,

    -- Lọc mềm: NULL = mọi thứ / mọi buổi
    day_of_week         SMALLINT CHECK (day_of_week IS NULL OR day_of_week BETWEEN 0 AND 6),
    -- 0=CN … 6=T7 (chuẩn hóa 1 kiểu trong toàn app)
    session_type        SMALLINT CHECK (session_type IS NULL OR session_type BETWEEN 1 AND 4),
    -- 1=sáng 2=chiều 3=tối 4=đêm (đồng bộ với block lịch)

    amount_vnd          BIGINT NOT NULL CHECK (amount_vnd >= 0),
    currency            VARCHAR(8) NOT NULL DEFAULT 'VND',
    label               TEXT,               -- VD: "Giá cuối tuần", "Ngày lễ"

    status              INTEGER NOT NULL DEFAULT 1,
    rank                INTEGER NOT NULL DEFAULT 99,

    created_at          INTEGER,
    updated_at          INTEGER
);

COMMENT ON TABLE tbl_clinic_price_item IS 'Dòng giá chi tiết trong 1 gói (nhiều điều kiện ngày/địa điểm/buổi)';
COMMENT ON COLUMN tbl_clinic_price_item.clinic_place_id IS 'NULL: không gắn chi nhánh cụ thể';
COMMENT ON COLUMN tbl_clinic_price_item.day_of_week IS 'NULL = mọi ngày trong khoảng effective_*';

CREATE INDEX IF NOT EXISTS idx_price_item_pkg ON tbl_clinic_price_item(price_package_id);
CREATE INDEX IF NOT EXISTS idx_price_item_place ON tbl_clinic_price_item(clinic_place_id);
CREATE INDEX IF NOT EXISTS idx_price_item_dates ON tbl_clinic_price_item(effective_from, effective_to);


-- ---------------------------------------------------------------------------
-- PHẦN 3 — GÓI BẢO HIỂM + DÒNG BH (cùng mô hình 1→N)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tbl_clinic_insurance_package (
    id              SERIAL PRIMARY KEY,
    clinic_id       INTEGER NOT NULL REFERENCES tbl_clinic(id) ON DELETE CASCADE,

    -- Gắn gói BH với 1 đối tác (hợp đồng); NULL = gói dùng chung / do bác sĩ tự khai báo
    partner_id      INTEGER REFERENCES tbl_partner(id) ON DELETE SET NULL,

    name            TEXT NOT NULL,          -- VD: "BH đối tác A", "BHYT + TN"
    description     TEXT,
    status          INTEGER NOT NULL DEFAULT 1,
    rank            INTEGER NOT NULL DEFAULT 99,

    created_at      INTEGER,
    updated_at      INTEGER
);

COMMENT ON TABLE tbl_clinic_insurance_package IS 'Gói cấu hình bảo hiểm / thanh toán thuộc bác sĩ (có thể scoped đối tác)';
CREATE INDEX IF NOT EXISTS idx_ins_pkg_clinic ON tbl_clinic_insurance_package(clinic_id);
CREATE INDEX IF NOT EXISTS idx_ins_pkg_partner ON tbl_clinic_insurance_package(partner_id);


CREATE TABLE IF NOT EXISTS tbl_clinic_insurance_item (
    id                      SERIAL PRIMARY KEY,
    insurance_package_id    INTEGER NOT NULL REFERENCES tbl_clinic_insurance_package(id) ON DELETE CASCADE,

    -- Theo nơi khám: NULL = mọi chi nhánh trong phạm vi gói
    clinic_place_id         INTEGER REFERENCES tbl_clinic_place(id) ON DELETE SET NULL,

    insurer_name            TEXT NOT NULL,      -- VD: "BHYT", "PVI", "MIC"
    insurer_code            TEXT,               -- Mã nội bộ / mã đối soát

    coverage_note           TEXT,               -- VD: "Đồng chi trả 20%"
    copay_note              TEXT,               -- Đồng chi trả / phạm vi
    requires_referral       BOOLEAN DEFAULT FALSE,
    status                  INTEGER NOT NULL DEFAULT 1,
    rank                    INTEGER NOT NULL DEFAULT 99,

    created_at              INTEGER,
    updated_at              INTEGER
);

COMMENT ON TABLE tbl_clinic_insurance_item IS 'Dòng BH trong gói (nhiều loại BH / điều kiện theo chi nhánh)';
CREATE INDEX IF NOT EXISTS idx_ins_item_pkg ON tbl_clinic_insurance_item(insurance_package_id);
CREATE INDEX IF NOT EXISTS idx_ins_item_place ON tbl_clinic_insurance_item(clinic_place_id);


-- ---------------------------------------------------------------------------
-- PHẦN 1 — LỊCH HẸN (block lặp theo tuần + chuyên khoa + FK tới gói giá/BH mặc định)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tbl_appt_schedule_block (
    id                          SERIAL PRIMARY KEY,
    clinic_id                   INTEGER NOT NULL REFERENCES tbl_clinic(id) ON DELETE CASCADE,
    partner_id                  INTEGER NOT NULL REFERENCES tbl_partner(id) ON DELETE CASCADE,
    clinic_place_id             INTEGER NOT NULL REFERENCES tbl_clinic_place(id) ON DELETE CASCADE,

    day_of_week                 SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    session_type                SMALLINT NOT NULL CHECK (session_type BETWEEN 1 AND 4),
    -- 1=sáng 2=chiều 3=tối 4=đêm

    start_time                  TIME NOT NULL,
    end_time                    TIME NOT NULL,

    slot_step_minutes           INTEGER NOT NULL DEFAULT 30 CHECK (slot_step_minutes > 0),
    appointment_duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (appointment_duration_minutes > 0),
    cutoff_minutes_before_slot  INTEGER NOT NULL DEFAULT 30 CHECK (cutoff_minutes_before_slot >= 0),

    -- Cửa sổ áp dụng template (vd chỉ tháng 5/2026). NULL = bật vô hạn (do app giới hạn 30 ngày)
    valid_from                  DATE,
    valid_to                    DATE,

    -- Gắn mặc định gói giá / BH cho ca này (có thể NULL)
    default_price_package_id    INTEGER REFERENCES tbl_clinic_price_package(id) ON DELETE SET NULL,
    default_insurance_package_id INTEGER REFERENCES tbl_clinic_insurance_package(id) ON DELETE SET NULL,

    status                      INTEGER NOT NULL DEFAULT 1,
    rank                        INTEGER NOT NULL DEFAULT 99,

    created_at                  INTEGER,
    updated_at                  INTEGER
);
-- Lưu ý: ca qua nửa đêm (vd 22:00–02:00) không dùng CHECK end>start trên kiểu TIME; xử lý ở tầng app.

COMMENT ON TABLE tbl_appt_schedule_block IS 'Khung lịch lặp theo tuần: bác sĩ + đối tác + nơi khám + thứ + buổi';
COMMENT ON COLUMN tbl_appt_schedule_block.default_price_package_id IS 'Gợi ý gói giá khi bệnh nhân đặt ca này (tách bảng giá)';
COMMENT ON COLUMN tbl_appt_schedule_block.default_insurance_package_id IS 'Gợi ý gói BH kèm ca (tách bảng BH)';

CREATE INDEX IF NOT EXISTS idx_appt_block_clinic ON tbl_appt_schedule_block(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appt_block_place ON tbl_appt_schedule_block(clinic_place_id);
CREATE INDEX IF NOT EXISTS idx_appt_block_partner ON tbl_appt_schedule_block(partner_id);
CREATE INDEX IF NOT EXISTS idx_appt_block_dow_session ON tbl_appt_schedule_block(day_of_week, session_type);


CREATE TABLE IF NOT EXISTS tbl_appt_schedule_block_specialist (
    schedule_block_id   INTEGER NOT NULL REFERENCES tbl_appt_schedule_block(id) ON DELETE CASCADE,
    specialist_id       INTEGER NOT NULL REFERENCES tbl_clinic_specialist(id) ON DELETE CASCADE,
    PRIMARY KEY (schedule_block_id, specialist_id)
);

COMMENT ON TABLE tbl_appt_schedule_block_specialist IS 'Chuyên khoa hiển thị cùng ca lịch (nhiều-nhiều)';


-- (Tuỳ chọn) Ngoại lệ theo 1 ngày cụ thể — đóng cửa hoặc sửa giờ; triển khai phase 2
CREATE TABLE IF NOT EXISTS tbl_appt_schedule_day_override (
    id                  SERIAL PRIMARY KEY,
    clinic_id           INTEGER NOT NULL REFERENCES tbl_clinic(id) ON DELETE CASCADE,
    clinic_place_id     INTEGER REFERENCES tbl_clinic_place(id) ON DELETE CASCADE,
    override_date       DATE NOT NULL,
    is_closed           BOOLEAN NOT NULL DEFAULT FALSE,
    note                TEXT,
    -- Nếu không đóng: có thể lưu JSON thay thế slot hoặc thêm bảng con sau
    created_at          INTEGER,
    updated_at          INTEGER,
    UNIQUE (clinic_id, clinic_place_id, override_date)
);

COMMENT ON TABLE tbl_appt_schedule_day_override IS 'Ngoại lệ lịch theo ngày (nghỉ / đổi — chi tiết mở rộng sau)';

COMMIT;
