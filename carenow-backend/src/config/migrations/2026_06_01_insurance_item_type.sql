ALTER TABLE tbl_clinic_insurance_item
ADD COLUMN IF NOT EXISTS insurance_type VARCHAR(20) NOT NULL DEFAULT 'private';

UPDATE tbl_clinic_insurance_item
SET insurance_type = 'public'
WHERE LOWER(COALESCE(insurer_name, '')) LIKE '%bhyt%'
   OR LOWER(COALESCE(insurer_code, '')) = 'bhyt';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_clinic_insurance_item_type'
  ) THEN
    ALTER TABLE tbl_clinic_insurance_item
      ADD CONSTRAINT chk_clinic_insurance_item_type
      CHECK (insurance_type IN ('public', 'private'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ins_item_type
ON tbl_clinic_insurance_item(insurance_type);
