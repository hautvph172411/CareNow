-- Không chứa INSERT (file nguồn có trường đa dòng / HTML rất lớn).
-- Import từ tbl_clinic_place.csv (export BookingCare) vào tbl_clinic_place:
--
--   cd carenow-backend
--   npm run import:clinic-place -- /đường/dẫn/tới/tbl_clinic_place.csv
--
-- Hoặc:
--
--   node scripts/import_clinic_place_from_csv.js
--   (mặc định đọc ../../tbl_clinic_place.csv từ thư mục carenow-backend)
--
-- Kiểm tra không ghi DB:
--   DRY_RUN=1 node scripts/import_clinic_place_from_csv.js
--
-- Nên chạy seed partner (2026_05_08_…) trước để FK partner_id hợp lệ.

SELECT 1;
