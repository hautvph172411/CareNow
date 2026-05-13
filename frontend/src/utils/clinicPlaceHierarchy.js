/** Nhãn loại cơ sở (metadata.place_kind) — 0 Ẩn … 5 Trụ sở */
export const PLACE_KIND_LABELS = {
  0: 'Ẩn',
  1: 'Khoa/Phòng',
  2: 'Bệnh viện',
  3: 'Chi nhánh',
  4: 'Khu vực',
  5: 'Trụ sở',
};

export const PLACE_KIND_OPTIONS = [0, 1, 2, 3, 4, 5].map((value) => ({
  value,
  label: PLACE_KIND_LABELS[value],
}));

/**
 * Loại cha được phép khi tạo/sửa con (cùng đối tác).
 * Ẩn(0)→BV/CN/KV/TS; Khoa(1)→BV; BV(2)→KV/TS; CN(3)→KV; KV(4)→TS; TS(5)→không cha.
 */
export function parentKindsForChild(placeKind) {
  const k = parseInt(placeKind, 10);
  if (Number.isNaN(k)) return [];
  switch (k) {
    case 0:
      return [2, 3, 4, 5];
    case 1:
      return [2];
    case 2:
      return [4, 5];
    case 3:
      return [4];
    case 4:
      return [5];
    case 5:
    default:
      return [];
  }
}

export function showParentField(placeKind) {
  return parentKindsForChild(placeKind).length > 0;
}

/** Hiển thị trên form — đúng thứ tự thiết kế */
export const PLACE_KIND_RULE_LINES = [
  'Trụ sở — không chọn cơ sở cha (gốc trong đối tác).',
  'Khu vực — cha hợp lệ: Trụ sở.',
  'Chi nhánh — cha hợp lệ: Khu vực.',
  'Bệnh viện — cha hợp lệ: Trụ sở hoặc Khu vực.',
  'Khoa/Phòng — cha hợp lệ: Bệnh viện (có thể để trống).',
  'Ẩn — cha hợp lệ: Bệnh viện, Chi nhánh, Khu vực hoặc Trụ sở.',
];

/** Gửi parent_id: Khoa/Phòng cho phép null; loại không có ô cha → null */
export function resolveParentIdForSubmit(placeKind, parentIdRaw) {
  const pk = parseInt(placeKind, 10);
  if (Number.isNaN(pk) || !showParentField(pk)) return null;
  if (parentIdRaw === '' || parentIdRaw == null) return null;
  return parseInt(parentIdRaw, 10);
}

export function parentFieldLabel(placeKind) {
  const k = parseInt(placeKind, 10);
  switch (k) {
    case 0:
      return 'Cơ sở cha — Bệnh viện, Chi nhánh, Khu vực hoặc Trụ sở';
    case 1:
      return 'Bệnh viện cha (tùy chọn)';
    case 2:
      return 'Cơ sở cha — Trụ sở hoặc Khu vực';
    case 3:
      return 'Khu vực cha';
    case 4:
      return 'Trụ sở cha';
    default:
      return 'Cơ sở cha';
  }
}
