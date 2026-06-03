-- =============================================================================
-- Seed 7 dịch vụ + chuyên khoa tương ứng cho CareNow.
--
-- Idempotent: chạy nhiều lần không tạo bản ghi trùng (kiểm tra theo name).
-- Run:  psql -U postgres -d CareNow -f src/config/migrations/2026_05_02_seed_services_specialties.sql
-- =============================================================================

BEGIN;

-- 1) Dọn 3 dịch vụ default (lowercase) đã seed ở migration trước, nếu còn nguyên/chưa được tham chiếu
DELETE FROM tbl_service
WHERE name IN ('Khám chuyên khoa', 'Khám từ xa', 'Gói phẫu thuật')
  AND NOT EXISTS (SELECT 1 FROM tbl_clinic_specialist WHERE service_id = tbl_service.id);

-- 2) Insert 7 dịch vụ chính (NOT EXISTS để idempotent)
INSERT INTO tbl_service (name, url, description, rank, status, created_at, updated_at)
SELECT v.name, v.url, v.description, v.rank, 1,
       EXTRACT(EPOCH FROM NOW())::INT, EXTRACT(EPOCH FROM NOW())::INT
FROM (VALUES
    ('Khám Chuyên khoa',   'kham-chuyen-khoa',   'Khám và điều trị chuyên sâu theo từng chuyên khoa tại cơ sở y tế', 1),
    ('Khám từ xa',         'kham-tu-xa',         'Tư vấn / khám online qua video với bác sĩ chuyên khoa',           2),
    ('Khám tổng quát',     'kham-tong-quat',     'Gói khám sức khỏe tổng quát định kỳ',                              3),
    ('Xét nghiệm y học',   'xet-nghiem-y-hoc',   'Xét nghiệm máu, nước tiểu, sinh hóa và các xét nghiệm chuyên sâu',4),
    ('Sức khỏe tinh thần', 'suc-khoe-tinh-than', 'Tư vấn và điều trị các vấn đề về tâm lý, tâm thần',                5),
    ('Khám nha khoa',      'kham-nha-khoa',      'Khám và điều trị các vấn đề răng miệng',                           6),
    ('Gói Phẫu thuật',     'goi-phau-thuat',     'Các gói phẫu thuật trọn gói theo chuyên khoa',                     7)
) AS v(name, url, description, rank)
WHERE NOT EXISTS (SELECT 1 FROM tbl_service s WHERE s.name = v.name);

-- 3) Insert chuyên khoa cho từng dịch vụ (lookup service_id theo name)
--    Bảng tbl_clinic_specialist cột: name, url, description, service_id, rank, status, type, updated_time
INSERT INTO tbl_clinic_specialist (name, url, description, service_id, rank, status, type, updated_time)
SELECT v.name, v.url, v.description, s.id, v.rank, 1, 1, EXTRACT(EPOCH FROM NOW())::INT
FROM (VALUES
    -- ===================== KHÁM CHUYÊN KHOA =====================
    ('Tim mạch',                    'tim-mach',                    'Khám và điều trị các bệnh lý tim, huyết áp, mạch máu',           1,  'Khám Chuyên khoa'),
    ('Cơ xương khớp',               'co-xuong-khop',               'Đau lưng, thoái hoá khớp, viêm khớp, chấn thương cơ xương',      2,  'Khám Chuyên khoa'),
    ('Tiêu hoá - Gan mật',          'tieu-hoa-gan-mat',            'Đau dạ dày, viêm gan, sỏi mật, rối loạn tiêu hoá',               3,  'Khám Chuyên khoa'),
    ('Hô hấp',                      'ho-hap',                      'Hen suyễn, viêm phổi, bệnh phổi tắc nghẽn mạn tính (COPD)',      4,  'Khám Chuyên khoa'),
    ('Thần kinh',                   'than-kinh',                   'Đau đầu, đau dây thần kinh, động kinh, đột quỵ',                 5,  'Khám Chuyên khoa'),
    ('Nội tiết - Đái tháo đường',   'noi-tiet-dai-thao-duong',     'Tiểu đường, rối loạn nội tiết, tuyến giáp',                      6,  'Khám Chuyên khoa'),
    ('Tai Mũi Họng',                'tai-mui-hong',                'Viêm xoang, viêm họng, viêm tai giữa, polyp mũi',                7,  'Khám Chuyên khoa'),
    ('Mắt',                         'mat',                         'Khám tật khúc xạ, đục thuỷ tinh thể, tăng nhãn áp',              8,  'Khám Chuyên khoa'),
    ('Da liễu',                     'da-lieu',                     'Mụn, nám, vảy nến, eczema, dị ứng da',                           9,  'Khám Chuyên khoa'),
    ('Sản phụ khoa',                'san-phu-khoa',                'Khám thai, khám phụ khoa, tư vấn tiền sản',                     10,  'Khám Chuyên khoa'),
    ('Nhi khoa',                    'nhi-khoa',                    'Khám và điều trị các bệnh ở trẻ em từ sơ sinh đến 16 tuổi',     11,  'Khám Chuyên khoa'),
    ('Tiết niệu - Nam khoa',        'tiet-nieu-nam-khoa',          'Sỏi thận, viêm tiết niệu, các bệnh nam khoa',                   12,  'Khám Chuyên khoa'),

    -- ===================== KHÁM TỪ XA =====================
    ('Tư vấn nội tổng quát từ xa',  'tu-van-noi-tong-quat-tu-xa',  'Bác sĩ nội khoa tư vấn online qua video',                        1,  'Khám từ xa'),
    ('Tư vấn cơ xương khớp từ xa',  'tu-van-co-xuong-khop-tu-xa',  'Tư vấn đau lưng, thoái hoá khớp online',                         2,  'Khám từ xa'),
    ('Tư vấn tim mạch từ xa',       'tu-van-tim-mach-tu-xa',       'Tư vấn huyết áp, rối loạn nhịp tim online',                      3,  'Khám từ xa'),
    ('Tư vấn da liễu từ xa',        'tu-van-da-lieu-tu-xa',        'Gửi ảnh tư vấn mụn, dị ứng da, nám',                             4,  'Khám từ xa'),
    ('Tư vấn nhi khoa từ xa',       'tu-van-nhi-khoa-tu-xa',       'Bác sĩ nhi tư vấn online cho trẻ',                               5,  'Khám từ xa'),
    ('Tư vấn sản phụ khoa từ xa',   'tu-van-san-phu-khoa-tu-xa',   'Tư vấn thai kỳ, sức khoẻ phụ nữ',                                6,  'Khám từ xa'),
    ('Tư vấn dinh dưỡng từ xa',     'tu-van-dinh-duong-tu-xa',     'Lên thực đơn, tư vấn giảm cân, ăn theo bệnh lý',                 7,  'Khám từ xa'),
    ('Tư vấn tâm lý từ xa',         'tu-van-tam-ly-tu-xa',         'Tư vấn stress, lo âu, trầm cảm online',                          8,  'Khám từ xa'),

    -- ===================== KHÁM TỔNG QUÁT =====================
    ('Tổng quát cơ bản',            'tong-quat-co-ban',            'Gói khám tổng quát cơ bản: huyết áp, cân, máu, nước tiểu',       1,  'Khám tổng quát'),
    ('Tổng quát nâng cao',          'tong-quat-nang-cao',          'Khám tổng quát + siêu âm + điện tim + xét nghiệm chuyên sâu',    2,  'Khám tổng quát'),
    ('Tổng quát doanh nghiệp',      'tong-quat-doanh-nghiep',      'Gói khám sức khoẻ định kỳ cho nhân viên công ty',                3,  'Khám tổng quát'),
    ('Khám tiền hôn nhân',          'kham-tien-hon-nhan',          'Khám sức khoẻ trước khi kết hôn cho cả nam và nữ',               4,  'Khám tổng quát'),
    ('Khám sức khoẻ trẻ em',        'kham-suc-khoe-tre-em',        'Khám định kỳ tăng trưởng, tiêm chủng cho trẻ',                   5,  'Khám tổng quát'),
    ('Khám sức khoẻ người cao tuổi','kham-suc-khoe-nguoi-cao-tuoi','Tầm soát toàn diện cho người trên 60 tuổi',                      6,  'Khám tổng quát'),
    ('Khám lái xe / xin việc',      'kham-lai-xe-xin-viec',        'Cấp giấy khám sức khoẻ lái xe, xin việc',                        7,  'Khám tổng quát'),

    -- ===================== XÉT NGHIỆM Y HỌC =====================
    ('Xét nghiệm máu tổng quát',    'xn-mau-tong-quat',            'Công thức máu, sinh hoá máu cơ bản',                             1,  'Xét nghiệm y học'),
    ('Xét nghiệm nước tiểu',        'xn-nuoc-tieu',                '10 chỉ số nước tiểu, vi sinh nước tiểu',                         2,  'Xét nghiệm y học'),
    ('Xét nghiệm chức năng gan',    'xn-chuc-nang-gan',            'AST, ALT, GGT, Bilirubin, Albumin',                              3,  'Xét nghiệm y học'),
    ('Xét nghiệm chức năng thận',   'xn-chuc-nang-than',           'Creatinin, Urea, eGFR',                                          4,  'Xét nghiệm y học'),
    ('Xét nghiệm tiểu đường',       'xn-tieu-duong',               'Đường huyết, HbA1c, dung nạp glucose',                           5,  'Xét nghiệm y học'),
    ('Xét nghiệm mỡ máu',           'xn-mo-mau',                   'Cholesterol, Triglyceride, HDL-C, LDL-C',                        6,  'Xét nghiệm y học'),
    ('Xét nghiệm tuyến giáp',       'xn-tuyen-giap',               'TSH, FT3, FT4, kháng thể tuyến giáp',                            7,  'Xét nghiệm y học'),
    ('Xét nghiệm viêm gan B, C',    'xn-viem-gan-b-c',             'HBsAg, Anti-HCV, định lượng virus',                              8,  'Xét nghiệm y học'),
    ('Xét nghiệm HIV',              'xn-hiv',                      'Test nhanh HIV, định lượng virus HIV',                           9,  'Xét nghiệm y học'),
    ('Tầm soát ung thư',            'xn-tam-soat-ung-thu',         'Marker ung thư: AFP, CEA, PSA, CA 125, CA 19-9...',             10,  'Xét nghiệm y học'),
    ('Xét nghiệm ADN huyết thống',  'xn-adn-huyet-thong',          'Xét nghiệm ADN cha-con, mẹ-con, anh em',                        11,  'Xét nghiệm y học'),
    ('Xét nghiệm dị ứng',           'xn-di-ung',                   'Panel dị ứng thức ăn, thuốc, môi trường',                       12,  'Xét nghiệm y học'),

    -- ===================== SỨC KHOẺ TINH THẦN =====================
    ('Trầm cảm',                    'tram-cam',                    'Đánh giá và điều trị trầm cảm các mức độ',                       1,  'Sức khỏe tinh thần'),
    ('Rối loạn lo âu',              'roi-loan-lo-au',              'Lo âu lan toả, hoảng loạn, ám ảnh sợ hãi',                       2,  'Sức khỏe tinh thần'),
    ('Mất ngủ',                     'mat-ngu',                     'Khó ngủ, ngủ chập chờn, ngủ không sâu giấc',                     3,  'Sức khỏe tinh thần'),
    ('Stress - Căng thẳng',         'stress-cang-thang',           'Tư vấn quản lý stress, kiệt sức',                                4,  'Sức khỏe tinh thần'),
    ('Rối loạn cảm xúc lưỡng cực',  'roi-loan-luong-cuc',          'Đánh giá và điều trị bipolar disorder',                          5,  'Sức khỏe tinh thần'),
    ('Tâm lý cá nhân',              'tu-van-tam-ly-ca-nhan',       'Tư vấn các vấn đề cảm xúc, mối quan hệ',                         6,  'Sức khỏe tinh thần'),
    ('Tâm lý hôn nhân - cặp đôi',   'tu-van-hon-nhan-cap-doi',     'Tư vấn mối quan hệ vợ chồng, tiền hôn nhân',                     7,  'Sức khỏe tinh thần'),
    ('Tâm lý trẻ em - vị thành niên','tu-van-tam-ly-tre-em',       'Tư vấn cho trẻ em và thanh thiếu niên',                          8,  'Sức khỏe tinh thần'),
    ('Tự kỷ và rối loạn phát triển','tu-ky-roi-loan-phat-trien',   'Tầm soát và can thiệp sớm tự kỷ, ADHD',                          9,  'Sức khỏe tinh thần'),

    -- ===================== KHÁM NHA KHOA =====================
    ('Khám tổng quát răng miệng',   'kham-tong-quat-rang-mieng',   'Khám răng định kỳ, tư vấn vệ sinh răng miệng',                   1,  'Khám nha khoa'),
    ('Cạo vôi - Đánh bóng răng',    'cao-voi-danh-bong-rang',      'Lấy cao răng, đánh bóng làm sạch',                               2,  'Khám nha khoa'),
    ('Trám răng - Hàn răng',        'tram-rang',                   'Trám răng sâu, sứt mẻ với composite, GIC',                       3,  'Khám nha khoa'),
    ('Nhổ răng',                    'nho-rang',                    'Nhổ răng sâu, răng hỏng không thể bảo tồn',                      4,  'Khám nha khoa'),
    ('Nhổ răng khôn',               'nho-rang-khon',               'Tiểu phẫu nhổ răng khôn mọc lệch, mọc ngầm',                     5,  'Khám nha khoa'),
    ('Điều trị tuỷ',                'dieu-tri-tuy',                'Lấy tuỷ, trám bít ống tuỷ',                                      6,  'Khám nha khoa'),
    ('Niềng răng - Chỉnh nha',      'nieng-rang-chinh-nha',        'Niềng kim loại, niềng trong suốt Invisalign',                    7,  'Khám nha khoa'),
    ('Bọc răng sứ',                 'boc-rang-su',                 'Bọc sứ thẩm mỹ, sứ kim loại, sứ toàn sứ',                        8,  'Khám nha khoa'),
    ('Cấy ghép Implant',            'cay-ghep-implant',            'Trồng răng Implant đơn lẻ, toàn hàm',                            9,  'Khám nha khoa'),
    ('Tẩy trắng răng',              'tay-trang-rang',              'Tẩy trắng tại phòng khám và tại nhà',                           10,  'Khám nha khoa'),
    ('Răng trẻ em',                 'rang-tre-em',                 'Khám và điều trị răng cho trẻ',                                 11,  'Khám nha khoa'),

    -- ===================== GÓI PHẪU THUẬT =====================
    ('Phẫu thuật nam học',          'phau-thuat-nam-hoc',          'Cắt bao quy đầu, điều trị giãn tĩnh mạch thừng tinh',            1,  'Gói Phẫu thuật'),
    ('Phẫu thuật mắt',              'phau-thuat-mat',              'Lasik, ReLEx Smile, Phaco - thay thuỷ tinh thể',                 2,  'Gói Phẫu thuật'),
    ('Phẫu thuật thẩm mỹ',          'phau-thuat-tham-my',          'Nâng mũi, cắt mí, hút mỡ, độn cằm',                              3,  'Gói Phẫu thuật'),
    ('Phẫu thuật tim mạch',         'phau-thuat-tim-mach',         'Mổ tim, đặt stent mạch vành',                                    4,  'Gói Phẫu thuật'),
    ('Phẫu thuật cột sống',         'phau-thuat-cot-song',         'Mổ thoát vị đĩa đệm, hẹp ống sống',                              5,  'Gói Phẫu thuật'),
    ('Phẫu thuật khớp',             'phau-thuat-khop',             'Thay khớp gối, khớp háng, nội soi khớp',                         6,  'Gói Phẫu thuật'),
    ('Phẫu thuật tiêu hoá',         'phau-thuat-tieu-hoa',         'Mổ ruột thừa, sỏi mật, thoát vị bẹn',                            7,  'Gói Phẫu thuật'),
    ('Phẫu thuật ung bướu',         'phau-thuat-ung-buou',         'Cắt u tuyến giáp, u xơ tử cung, u đại tràng',                    8,  'Gói Phẫu thuật'),
    ('Phẫu thuật sản phụ khoa',     'phau-thuat-san-phu-khoa',     'Mổ lấy thai, mổ u nang buồng trứng',                             9,  'Gói Phẫu thuật'),
    ('Phẫu thuật tai mũi họng',     'phau-thuat-tai-mui-hong',     'Cắt amidan, nạo VA, nội soi xoang',                             10,  'Gói Phẫu thuật')

) AS v(name, url, description, rank, service_name)
INNER JOIN tbl_service s ON s.name = v.service_name
WHERE NOT EXISTS (
    SELECT 1 FROM tbl_clinic_specialist cs
    WHERE cs.name = v.name AND cs.service_id = s.id
);

-- 4) Báo cáo kết quả
DO $$
DECLARE
    n_services INT;
    n_specs    INT;
BEGIN
    SELECT COUNT(*) INTO n_services FROM tbl_service;
    SELECT COUNT(*) INTO n_specs    FROM tbl_clinic_specialist WHERE service_id IS NOT NULL;
    RAISE NOTICE 'Seed xong: % dịch vụ, % chuyên khoa đã gán dịch vụ', n_services, n_specs;
END $$;

COMMIT;
