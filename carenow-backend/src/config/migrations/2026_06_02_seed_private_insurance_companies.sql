-- Seed danh sách công ty bảo hiểm bảo lãnh phổ biến cho các bác sĩ hiện có.
-- Chạy sau migration 2026_06_01_insurance_item_type.sql.

WITH private_package AS (
  INSERT INTO tbl_clinic_insurance_package (
    clinic_id,
    partner_id,
    name,
    description,
    status,
    rank,
    created_at,
    updated_at
  )
  SELECT
    c.id,
    NULL,
    'Bảo hiểm bảo lãnh',
    'Danh sách công ty bảo hiểm bảo lãnh được áp dụng.',
    1,
    20,
    EXTRACT(EPOCH FROM NOW())::int,
    EXTRACT(EPOCH FROM NOW())::int
  FROM tbl_clinic c
  WHERE NOT EXISTS (
    SELECT 1
    FROM tbl_clinic_insurance_package ip
    WHERE ip.clinic_id = c.id
      AND (
        LOWER(ip.name) LIKE '%bảo hiểm bảo lãnh%'
        OR LOWER(ip.name) LIKE '%bao hiem bao lanh%'
      )
  )
  RETURNING id, clinic_id
),
existing_package AS (
  SELECT DISTINCT ON (ip.clinic_id)
    ip.id,
    ip.clinic_id
  FROM tbl_clinic_insurance_package ip
  WHERE LOWER(ip.name) LIKE '%bảo hiểm bảo lãnh%'
     OR LOWER(ip.name) LIKE '%bao hiem bao lanh%'
  ORDER BY ip.clinic_id, ip.rank ASC NULLS LAST, ip.id ASC
),
target_package AS (
  SELECT id, clinic_id
  FROM private_package

  UNION ALL

  SELECT id, clinic_id
  FROM existing_package
),
company_seed(rank, insurer_name, insurer_code) AS (
  VALUES
    (1,  'Bảo hiểm Bảo Việt', 'BAOVIET'),
    (2,  'Bảo hiểm PVI', 'PVI'),
    (3,  'Bảo hiểm Bưu điện PTI', 'PTI'),
    (4,  'Bảo hiểm Bảo Minh', 'BAOMINH'),
    (5,  'Bảo hiểm Quân đội MIC', 'MIC'),
    (6,  'Bảo hiểm PJICO', 'PJICO'),
    (7,  'Bảo hiểm VBI', 'VBI'),
    (8,  'Bảo hiểm VietinBank VBI', 'VIETINBANK_VBI'),
    (9,  'Bảo hiểm BIDV BIC', 'BIC'),
    (10, 'Bảo hiểm Liberty', 'LIBERTY'),
    (11, 'Bảo hiểm AIA', 'AIA'),
    (12, 'Bảo hiểm Manulife Việt Nam', 'MANULIFE'),
    (13, 'Bảo hiểm Prudential Việt Nam', 'PRUDENTIAL'),
    (14, 'Bảo hiểm Sun Life Việt Nam', 'SUNLIFE'),
    (15, 'Bảo hiểm Dai-ichi Life Việt Nam', 'DAIICHI'),
    (16, 'Bảo hiểm FWD Việt Nam', 'FWD'),
    (17, 'Bảo hiểm Chubb Life Việt Nam', 'CHUBB'),
    (18, 'Bảo hiểm Generali Việt Nam', 'GENERALI'),
    (19, 'Bảo hiểm Hanwha Life Việt Nam', 'HANWHA'),
    (20, 'Bảo hiểm MB Ageas Life', 'MBAL'),
    (21, 'Bảo hiểm Tokio Marine Việt Nam', 'TOKIO_MARINE'),
    (22, 'Bảo hiểm Pacific Cross Việt Nam', 'PACIFIC_CROSS'),
    (23, 'Bảo hiểm Fullerton Health Việt Nam', 'FULLERTON'),
    (24, 'Bảo hiểm Insmart', 'INSMART'),
    (25, 'Bảo hiểm CarePlus', 'CAREPLUS'),
    (26, 'South Asia Services', 'SAS'),
    (27, 'AXA Assistance', 'AXA'),
    (28, 'LUMA Care', 'LUMA'),
    (29, 'April International', 'APRIL'),
    (30, 'Bảo hiểm MSIG Việt Nam', 'MSIG')
)
INSERT INTO tbl_clinic_insurance_item (
  insurance_package_id,
  clinic_place_id,
  insurance_type,
  insurer_name,
  insurer_code,
  coverage_note,
  copay_note,
  requires_referral,
  status,
  rank,
  created_at,
  updated_at
)
SELECT
  tp.id,
  NULL,
  'private',
  cs.insurer_name,
  cs.insurer_code,
  'Áp dụng theo chính sách bảo lãnh của từng hợp đồng bảo hiểm.',
  NULL,
  FALSE,
  1,
  cs.rank,
  EXTRACT(EPOCH FROM NOW())::int,
  EXTRACT(EPOCH FROM NOW())::int
FROM target_package tp
CROSS JOIN company_seed cs
WHERE NOT EXISTS (
  SELECT 1
  FROM tbl_clinic_insurance_item ii
  WHERE ii.insurance_package_id = tp.id
    AND LOWER(ii.insurer_name) = LOWER(cs.insurer_name)
);
