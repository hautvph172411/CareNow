/** Nhãn hiển thị — day_of_week DB: 0=CN … 6=T7 */
export const DAY_LABELS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

/** session_type: 1–4 */
export const SESSION_LABELS = { 1: 'Sáng', 2: 'Chiều', 3: 'Tối', 4: 'Đêm' };

/** Cấu hình giờ phổ biến — bấm một lần áp dụng buổi + khung giờ */
export const SCHEDULE_TIME_PRESETS = [
  { key: 'morning', label: 'Sáng 7h–12h', session_type: '1', start_time: '07:00', end_time: '12:00' },
  { key: 'afternoon', label: 'Chiều 13h–17h30', session_type: '2', start_time: '13:00', end_time: '17:30' },
  { key: 'evening', label: 'Tối 18h–21h', session_type: '3', start_time: '18:00', end_time: '21:00' },
  { key: 'night', label: 'Đêm 20h–23h', session_type: '4', start_time: '20:00', end_time: '23:00' },
];

export function formatTimeInput(pgTime) {
  if (!pgTime) return '';
  const s = String(pgTime);
  return s.length >= 5 ? s.slice(0, 5) : s;
}
