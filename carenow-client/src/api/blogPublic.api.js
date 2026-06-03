import axios from "./axios";

/** Danh sách bài cẩm nang (public GET). */
export async function getBlogPublicList(params = {}) {
  const { data } = await axios.get("/blog-public", { params });
  return data;
}

/** Chi tiết bài theo id. */
export async function getBlogPublicById(id) {
  const { data } = await axios.get(`/blog-public/${id}`);
  return data;
}
