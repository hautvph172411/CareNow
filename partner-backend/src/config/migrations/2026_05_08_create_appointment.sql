-- ============================================================
-- Bảng lịch đặt khám của bệnh nhân
-- Chạy: psql -d <dbname> -f 2026_05_08_create_appointment.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS tbl_appointment (
  id                   SERIAL PRIMARY KEY,
  booking_code         VARCHAR(20) UNIQUE NOT NULL,    -- VD: BK2605070001

  -- Liên kết cơ sở y tế (nullable để linh hoạt)
  clinic_id            INT  REFERENCES tbl_clinic(id),
  clinic_place_id      INT  REFERENCES tbl_clinic_place(id),
  specialist_id        INT  REFERENCES tbl_clinic_specialist(id),
  service_id           INT  REFERENCES tbl_service(id),
  schedule_block_id    INT  REFERENCES tbl_appt_schedule_block(id),
  price_package_id     INT  REFERENCES tbl_clinic_price_package(id),
  insurance_package_id INT  REFERENCES tbl_clinic_insurance_package(id),

  -- Thời gian khám
  appt_date            DATE      NOT NULL,
  appt_time            TIME      NOT NULL,
  session_type         SMALLINT  DEFAULT 1,
  -- 1=Buổi sáng  2=Buổi chiều  3=Buổi tối  4=Cả ngày

  -- Trạng thái lịch hẹn
  status               SMALLINT  DEFAULT 1,
  -- 1=pending (chờ xác nhận)   2=confirmed (đã xác nhận)
  -- 3=completed (đã khám xong) 4=cancelled_user (người dùng hủy)
  -- 5=cancelled_clinic (phòng khám hủy) 6=no_show (không đến)

  -- Thông tin bệnh nhân (denormalized — guest cũng đặt được)
  patient_id           INT  REFERENCES tbl_patient(id),  -- NULL nếu guest chưa đăng nhập
  patient_name         VARCHAR(150) NOT NULL,
  patient_phone        VARCHAR(20)  NOT NULL,
  patient_email        VARCHAR(150),
  patient_address      TEXT,
  patient_notes        TEXT,

  -- Ghi chú nội bộ (admin / phòng khám điền)
  admin_notes          TEXT,
  amount_vnd           NUMERIC(12,0),  -- giá khám tại thời điểm đặt (snapshot)

  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at         TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appt_patient   ON tbl_appointment(patient_id);
CREATE INDEX IF NOT EXISTS idx_appt_clinic    ON tbl_appointment(clinic_id, appt_date);
CREATE INDEX IF NOT EXISTS idx_appt_status    ON tbl_appointment(status);
CREATE INDEX IF NOT EXISTS idx_appt_code      ON tbl_appointment(booking_code);
CREATE INDEX IF NOT EXISTS idx_appt_date      ON tbl_appointment(appt_date);
CREATE INDEX IF NOT EXISTS idx_appt_specialist ON tbl_appointment(specialist_id);

-- Auto-update updated_at via trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appt_updated_at ON tbl_appointment;
CREATE TRIGGER trg_appt_updated_at
  BEFORE UPDATE ON tbl_appointment
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
