import axios from "./axios"; // dùng instance chung có Bearer token

// ── Lấy danh sách users ──────────────────────────────────────────────────────
export const fetchUsers = () => axios.get("/users");
export const getUsers   = () => axios.get("/users");

// ── Tạo user mới ─────────────────────────────────────────────────────────────
export const createUser = (data) => axios.post("/users/register", data);

// ── Cập nhật user ─────────────────────────────────────────────────────────────
export const updateUser = (id, data) => axios.put(`/users/${id}`, data);

// ── Xoá user ──────────────────────────────────────────────────────────────────
export const deleteUser = (id) => axios.delete(`/users/${id}`);

// ── Toggle trạng thái (status: 0 | 1) ────────────────────────────────────────
export const toggleUserStatus = (id, newStatus) =>
  axios.put(`/users/${id}`, { status: newStatus });
