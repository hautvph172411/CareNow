CREATE TABLE IF NOT EXISTS tbl_consultation (
    id SERIAL PRIMARY KEY,
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(50) NOT NULL,
    patient_email VARCHAR(255),
    symptoms TEXT NOT NULL,
    status INT DEFAULT 1, -- 1: Chưa xử lý, 2: Đã xử lý
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION update_tbl_consultation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_consultation_timestamp ON tbl_consultation;

CREATE TRIGGER update_consultation_timestamp
BEFORE UPDATE ON tbl_consultation
FOR EACH ROW
EXECUTE FUNCTION update_tbl_consultation_updated_at();
