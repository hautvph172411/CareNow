/** Chuyển HTML admin/CMS thành text hiển thị an toàn (không inject HTML). */
export function htmlToPlain(html) {
  if (html == null || html === "") return "";
  const s = String(html);
  if (typeof document === "undefined") {
    return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  try {
    const doc = new DOMParser().parseFromString(s, "text/html");
    const t = doc.body.textContent || "";
    return t.replace(/\s+/g, " ").trim();
  } catch {
    return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
}
