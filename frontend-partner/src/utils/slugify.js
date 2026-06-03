/** Slug URL-friendly từ tiếng Việt / chữ Latin */
export function slugifyVi(input) {
  if (!input || typeof input !== 'string') return '';
  const noAccent = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd');
  return noAccent
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
