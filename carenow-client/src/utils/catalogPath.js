/**
 * URL chi tiết: /bac-si/{slug}p-{id}, /chuyen-khoa/{slug}p-{id}, /noi-kham/{slug}p-{id}
 * Slug ưu tiên cột `url` (chuẩn hóa), không có th/ghép title + name.
 */

export function slugifyVi(input) {
  if (input == null || input === "") return "";
  let s = String(input).trim();
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  s = s.replace(/đ/g, "d").replace(/Đ/g, "d");
  s = s.toLowerCase();
  s = s.replace(/[^a-z0-9]+/g, "-");
  s = s.replace(/^-+|-+$/g, "");
  return s;
}

function slugFromUrlColumn(rawUrl) {
  if (!rawUrl || !String(rawUrl).trim()) return "";
  let u = String(rawUrl).trim();
  u = u.replace(/^https?:\/\/[^/]+/i, "").replace(/^\//, "");
  const seg = u.split("/").filter(Boolean).pop() || u;
  return String(seg)
    .replace(/p-\d+$/i, "")
    .replace(/-+$/g, "")
    .replace(/^-+/g, "");
}

function baseSlug(row, textParts) {
  const fromUrl = slugFromUrlColumn(row.url);
  if (fromUrl) return slugifyVi(fromUrl) || "item";
  const text = textParts.filter(Boolean).join(" ").trim();
  return slugifyVi(text) || "item";
}

export function buildDoctorPath(row) {
  if (!row?.id) return "/";
  const base = baseSlug(row, [row.title, row.name]);
  return `/bac-si/${base}p-${row.id}`;
}

export function buildPlacePath(row) {
  if (!row?.id) return "/";
  const base = baseSlug(row, [row.short_name, row.display_name, row.name]);
  return `/noi-kham/${base}p-${row.id}`;
}

export function buildSpecialtyPath(row) {
  if (!row?.id) return "/";
  const base = baseSlug(row, [row.name]);
  return `/chuyen-khoa/${base}p-${row.id}`;
}

/**
 * Phân tích param route: "...p-123" hoặc chỉ "123" (tương thích cũ).
 * @returns {{ id: number, slug: string } | null}
 */
export function parseCatalogSlugRef(param) {
  if (param == null || param === "") return null;
  const s = decodeURIComponent(String(param));
  if (/^\d+$/.test(s)) {
    const id = parseInt(s, 10);
    return Number.isNaN(id) ? null : { id, slug: "" };
  }
  const m = s.match(/^(.+)p-(\d+)$/);
  if (!m) return null;
  const id = parseInt(m[2], 10);
  if (Number.isNaN(id)) return null;
  return { slug: m[1], id };
}
