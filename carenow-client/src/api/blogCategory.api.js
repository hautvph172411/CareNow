import axios from "./axios";

/** Danh mục cẩm nang (public GET). */
export async function getBlogCategories(params = {}) {
  const { data } = await axios.get("/blog-categories", { params });
  return data;
}
