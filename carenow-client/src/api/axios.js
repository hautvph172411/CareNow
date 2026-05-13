import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("client_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("client_token");
      localStorage.removeItem("client_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
