CREATE TABLE IF NOT EXISTS tbl_partner_contact (
    id SERIAL PRIMARY KEY,
    contact_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    contact_email VARCHAR(255),
    clinic_name VARCHAR(255) NOT NULL,
    clinic_address TEXT,
    notes TEXT,
    status INT DEFAULT 1, -- 1: Pending, 2: Processed, 3: Ignored
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION update_tbl_partner_contact_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_partner_contact_timestamp ON tbl_partner_contact;

CREATE TRIGGER update_partner_contact_timestamp
BEFORE UPDATE ON tbl_partner_contact
FOR EACH ROW
EXECUTE FUNCTION update_tbl_partner_contact_updated_at();
