-- Seed tbl_partner suy ra từ tbl_ai_question.csv (CareNow)
-- Chạy: psql -U postgres -d CareNow -f src/config/migrations/2026_05_07_seed_partner_from_ai_question_sample.sql
--
-- Nguồn CSV:
-- - Các dòng flow=disease, partner_id rỗng → gom vào đối tác "Nội dung AI / FAQ".
-- - Dòng id=378, flow=publicHospital, tên trong flow_params → Bệnh viện Hữu nghị Việt Đức.

BEGIN;

INSERT INTO tbl_partner (
  name,
  short_name,
  description,
  address,
  status,
  created_time,
  updated_time,
  "group",
  rank,
  note
)
SELECT
  'Bệnh viện Hữu nghị Việt Đức',
  'BV Việt Đức',
  'Khoa Thận - Lọc máu: khám và điều trị bệnh lý thận nội khoa, tư vấn thận - tiết niệu; chuẩn bị và quản lý ghép thận. '
    || 'Các bệnh lý: suy thận cấp/mạn, sỏi thận, viêm đường tiết niệu, viêm tuyến tiền liệt, viêm bàng quang.',
  NULL,
  1,
  EXTRACT(EPOCH FROM NOW())::INTEGER,
  EXTRACT(EPOCH FROM NOW())::INTEGER,
  1,
  10,
  'Seed từ tbl_ai_question.csv: id=378, flow=publicHospital, partner_id trong CSV=10.'
WHERE NOT EXISTS (
  SELECT 1 FROM tbl_partner p WHERE p.name = 'Bệnh viện Hữu nghị Việt Đức'
);

INSERT INTO tbl_partner (
  name,
  short_name,
  description,
  address,
  status,
  created_time,
  updated_time,
  "group",
  rank,
  note
)
SELECT
  'Nội dung AI — Tư vấn sức khỏe (FAQ)',
  'AI FAQ',
  'Đối tác logic cho bộ câu hỏi–trả lời chủ đề bệnh học nhập từ kho AI (bóng đè, thủy đậu, chảy máu chân răng/mũi, nấc cụt, v.v.). '
    || 'Dùng khi cần gán partner_id cho nội dung không thuộc một bệnh viện cụ thể.',
  NULL,
  1,
  EXTRACT(EPOCH FROM NOW())::INTEGER,
  EXTRACT(EPOCH FROM NOW())::INTEGER,
  1,
  100,
  'Seed suy ra từ tbl_ai_question.csv: các dòng id IN (3,4,49,80,89,107), flow=disease, partner_id rỗng.'
WHERE NOT EXISTS (
  SELECT 1 FROM tbl_partner p WHERE p.short_name = 'AI FAQ'
);

COMMIT;
