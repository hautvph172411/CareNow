-- =============================================================================
-- Migration: gán service_id cho các chuyên khoa trong tbl_clinic_specialist
-- Idempotent: dùng UPDATE ... FROM tbl_service, chỉ cập nhật bản ghi khớp tên.
-- Run:
--   psql -U postgres -d CareNow \
--        -f src/config/migrations/2026_05_07_assign_service_to_specialties.sql
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- Hàm helper: UPDATE một nhóm chuyên khoa theo tên service
-- ─────────────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════
-- 1. KHÁM TỪ XA
-- ══════════════════════════════════════════
UPDATE tbl_clinic_specialist cs
SET    service_id = s.id
FROM   tbl_service s
WHERE  s.name = 'Khám từ xa'
  AND  cs.name IN (
    'Tư vấn tâm lý từ xa',
    'Tư vấn dinh dưỡng từ xa',
    'Tư vấn sản phụ khoa từ xa',
    'Tư vấn nhi khoa từ xa',
    'Tư vấn da liễu từ xa',
    'Tư vấn tim mạch từ xa',
    'Tư vấn cơ xương khớp từ xa',
    'Tư vấn nội tổng quát từ xa'
  );

-- ══════════════════════════════════════════
-- 2. KHÁM TỔNG QUÁT
-- ══════════════════════════════════════════
UPDATE tbl_clinic_specialist cs
SET    service_id = s.id
FROM   tbl_service s
WHERE  s.name = 'Khám tổng quát'
  AND  cs.name IN (
    'Khám lái xe / xin việc',
    'Khám sức khoẻ người cao tuổi',
    'Khám sức khoẻ trẻ em',
    'Khám tiền hôn nhân',
    'Tổng quát doanh nghiệp',
    'Tổng quát nâng cao',
    'Tổng quát cơ bản'
  );

-- ══════════════════════════════════════════
-- 3. XÉT NGHIỆM Y HỌC
-- ══════════════════════════════════════════
UPDATE tbl_clinic_specialist cs
SET    service_id = s.id
FROM   tbl_service s
WHERE  s.name = 'Xét nghiệm y học'
  AND  cs.name IN (
    'Xét nghiệm dị ứng',
    'Xét nghiệm ADN huyết thống',
    'Tầm soát ung thư',
    'Xét nghiệm HIV',
    'Xét nghiệm viêm gan B, C',
    'Xét nghiệm tuyến giáp',
    'Xét nghiệm mỡ máu',
    'Xét nghiệm tiểu đường',
    'Xét nghiệm chức năng thận',
    'Xét nghiệm chức năng gan',
    'Xét nghiệm nước tiểu',
    'Xét nghiệm máu tổng quát'
  );

-- ══════════════════════════════════════════
-- 4. SỨC KHỎE TINH THẦN
-- ══════════════════════════════════════════
UPDATE tbl_clinic_specialist cs
SET    service_id = s.id
FROM   tbl_service s
WHERE  s.name = 'Sức khỏe tinh thần'
  AND  cs.name IN (
    'Tự kỷ và rối loạn phát triển',
    'Tâm lý trẻ em - vị thành niên',
    'Tâm lý hôn nhân - cặp đôi',
    'Tâm lý cá nhân',
    'Rối loạn cảm xúc lưỡng cực',
    'Stress - Căng thẳng',
    'Mất ngủ',
    'Rối loạn lo âu',
    'Trầm cảm'
  );

-- ══════════════════════════════════════════
-- 5. KHÁM NHA KHOA
-- ══════════════════════════════════════════
UPDATE tbl_clinic_specialist cs
SET    service_id = s.id
FROM   tbl_service s
WHERE  s.name = 'Khám nha khoa'
  AND  cs.name IN (
    'Răng trẻ em',
    'Tẩy trắng răng',
    'Cấy ghép Implant',
    'Bọc răng sứ',
    'Niềng răng - Chỉnh nha',
    'Điều trị tuỷ',
    'Nhổ răng khôn',
    'Nhổ răng',
    'Trám răng - Hàn răng',
    'Cạo vôi - Đánh bóng răng',
    'Khám tổng quát răng miệng'
  );

-- ══════════════════════════════════════════
-- 6. GÓI PHẪU THUẬT
--    Khớp tên cả 2 cách viết: 'Gói Phẫu thuật' và 'Gói phẫu thuật'
-- ══════════════════════════════════════════
UPDATE tbl_clinic_specialist cs
SET    service_id = s.id
FROM   tbl_service s
WHERE  lower(s.name) = 'gói phẫu thuật'
  AND  cs.name IN (
    'Phẫu thuật tai mũi họng',
    'Phẫu thuật sản phụ khoa',
    'Phẫu thuật ung bướu',
    'Phẫu thuật tiêu hoá',
    'Phẫu thuật khớp',
    'Phẫu thuật cột sống',
    'Phẫu thuật tim mạch',
    'Phẫu thuật thẩm mỹ',
    'Phẫu thuật mắt',
    'Phẫu thuật nam học'
  );

-- ══════════════════════════════════════════
-- 7. KHÁM CHUYÊN KHOA
--    Bao gồm cả biến thể viết hoa/thường
-- ══════════════════════════════════════════
UPDATE tbl_clinic_specialist cs
SET    service_id = s.id
FROM   tbl_service s
WHERE  lower(s.name) = 'khám chuyên khoa'
  AND  cs.name IN (
    'Tiết niệu - Nam khoa',
    'Nhi khoa',
    'Sản phụ khoa',
    'Da liễu',
    'Mắt',
    'Tai Mũi Họng',
    'Nội tiết - Đái tháo đường',
    'Thần kinh',
    'Hô hấp',
    'Tiêu hoá - Gan mật',
    'Tâm lý trẻ em - vị thành niên',   -- có thể chuyên khoa trực tiếp lẫn SKTT
    'Tâm lý hôn nhân - cặp đôi',
    'Tâm lý cá nhân',
    'Cơ xương khớp',
    'Cơ Xương Khớp',                   -- biến thể viết hoa
    'Tim mạch'
  )
  AND cs.service_id IS NULL;           -- chỉ ghi đè khi chưa có service_id

-- ─────────────────────────────────────────────────────────────────────────────
-- Báo cáo sau khi chạy
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
    total_assigned  INT;
    total_unassigned INT;
BEGIN
    SELECT COUNT(*) INTO total_assigned   FROM tbl_clinic_specialist WHERE service_id IS NOT NULL;
    SELECT COUNT(*) INTO total_unassigned FROM tbl_clinic_specialist WHERE service_id IS NULL;
    RAISE NOTICE '✓ Đã gán service_id: % chuyên khoa | Chưa gán: %', total_assigned, total_unassigned;
END $$;

COMMIT;
