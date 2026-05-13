/**
 * Tiện ích xử lý lịch khám từ tbl_appt_schedule_block
 * day_of_week: 0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7  (giống JS getDay())
 */

export const DOW_SHORT  = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
export const DOW_FULL   = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
export const SESSION_LABEL = { 1: 'Sáng', 2: 'Chiều', 3: 'Tối', 4: 'Cả ngày' };

/** Chuyển "07:30:00" → 450 (phút từ 0:00) */
function toMinutes(timeStr) {
  const [h, m] = String(timeStr).split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Sinh danh sách slot từ 1 block */
export function generateSlotsFromBlock(block) {
  const step     = Number(block.slot_step_minutes) || 30;
  const startMin = toMinutes(block.start_time);
  const endMin   = toMinutes(block.end_time);
  const slots    = [];
  for (let m = startMin; m < endMin; m += step) {
    const h  = Math.floor(m / 60);
    const mn = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(mn).padStart(2, '0')}`);
  }
  return slots;
}

/**
 * Lấy tất cả slots của một ngày cụ thể từ danh sách blocks của clinic
 * Trả về: { morning: [...], afternoon: [...], evening: [...], all: [...] }
 */
export function getSlotsForDate(blocks, date) {
  const d   = date instanceof Date ? date : new Date(date);
  const dow = d.getDay(); // 0=CN ... 6=T7

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayBlocks = blocks.filter((b) => {
    if (Number(b.day_of_week) !== dow) return false;
    if (Number(b.status) !== 1)        return false;
    if (b.valid_from && new Date(b.valid_from) > d) return false;
    if (b.valid_to   && new Date(b.valid_to)   < d) return false;
    return true;
  });

  const morning   = [];
  const afternoon = [];
  const evening   = [];

  dayBlocks.forEach((b) => {
    const slots = generateSlotsFromBlock(b);
    // Lọc slot quá khứ nếu là hôm nay
    const now = new Date();
    const filtered = d.toDateString() === today.toDateString()
      ? slots.filter((s) => {
          const [sh, sm] = s.split(':').map(Number);
          return sh * 60 + sm > now.getHours() * 60 + now.getMinutes() + 30;
        })
      : slots;

    if (b.session_type === 1) morning.push(...filtered);
    else if (b.session_type === 2) afternoon.push(...filtered);
    else if (b.session_type === 3) evening.push(...filtered);
    else { morning.push(...filtered); } // default
  });

  const dedup = (arr) => [...new Set(arr)].sort();

  return {
    morning:   dedup(morning),
    afternoon: dedup(afternoon),
    evening:   dedup(evening),
    all:       dedup([...morning, ...afternoon, ...evening]),
  };
}

/** Tập ngày nào trong tuần có lịch (Set of 0-6) */
export function getActiveDaysOfWeek(blocks) {
  return new Set(
    blocks
      .filter((b) => Number(b.status) === 1)
      .map((b) => Number(b.day_of_week))
  );
}

/** Sinh 14 ngày kế từ hôm nay */
export function getNext14Days() {
  const result = [];
  const today  = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    result.push(d);
  }
  return result;
}

/** Format Date → "YYYY-MM-DD" cho API */
export function toISODate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().split('T')[0];
}

/** Format Date → "05/05" hiển thị */
export function toDisplayDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}
