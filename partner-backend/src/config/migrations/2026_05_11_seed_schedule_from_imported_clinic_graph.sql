-- Seed lịch hẹn + gói giá/BH mặc định từ đồ thị clinic ↔ clinic_place ↔ partner đã import.
-- Logic nằm trong Node (parse place_ids / partner_ids dạng JSON hoặc CSV).
--
--   cd carenow-backend
--   npm run seed:schedule
--
-- Tuỳ chọn:
--   DRY_RUN=1 npm run seed:schedule
--   LIMIT_CLINICS=20 npm run seed:schedule
--
-- Bảng liên quan: tbl_clinic_price_package, tbl_clinic_price_item,
--   tbl_clinic_insurance_package, tbl_clinic_insurance_item,
--   tbl_appt_schedule_block, tbl_appt_schedule_block_specialist

SELECT 1;
