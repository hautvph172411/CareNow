ALTER TABLE tbl_appt_schedule_day_override 
ADD COLUMN session_type SMALLINT NULL;

COMMENT ON COLUMN tbl_appt_schedule_day_override.session_type IS '1: Sáng, 2: Chiều, NULL: Cả ngày';
