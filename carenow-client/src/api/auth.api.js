import axios from "./axios";

/**
 * Đăng nhập / đăng ký bằng Google ID token.
 * Backend sẽ verify token với Google, tạo patient nếu chưa có,
 * trả về JWT của hệ thống + thông tin patient.
 */
export const googleLogin = (idToken) =>
  axios.post("/auth/client/google-login", { id_token: idToken });

export const getMe = () => axios.get("/patient/me");
export const updateMe = (data) => axios.put("/patient/me", data);
