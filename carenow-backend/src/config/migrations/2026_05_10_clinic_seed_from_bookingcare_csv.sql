-- Import bác sĩ (tbl_clinic) từ export BookingCare — file `sql (5).csv`
-- Dữ liệu có ô HTML nhiều dòng → dùng script Node thay vì SQL thuần.
--
-- Tách file (core + jsonl nguồn) VÀ/Hoặc ghi DB:
--   cd carenow-backend
--   SPLIT_OUTPUT=1 DRY_RUN=1 npm run import:clinic -- "/abs/path/sql (5).csv"
--
-- Chỉ UPSERT vào DB:
--   npm run import:clinic -- "/abs/path/sql (5).csv"
--
-- Output tách mặc định: scripts/generated/clinic_bookingcare_core.csv,
--                        scripts/generated/clinic_bookingcare_source.jsonl

SELECT 1;
