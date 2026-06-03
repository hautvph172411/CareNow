import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:3001/api",
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Inject partner_id into query params and body for all requests since backend auth is bypassed
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.partner_id) {
        // Query params for GET
        config.params = { ...config.params, partner_id: user.partner_id };
        
        // Body payload for POST, PUT, PATCH
        if (config.method !== 'get' && config.method !== 'delete') {
          if (config.data instanceof FormData) {
            config.data.append('partner_id', user.partner_id);
          } else if (typeof config.data === 'object' && config.data !== null) {
            config.data = { ...config.data, partner_id: user.partner_id };
          } else if (!config.data) {
            config.data = { partner_id: user.partner_id };
          }
        }
      }
    }
  } catch (e) {
    console.error("Error parsing user from localStorage", e);
  }

  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("loginTime");
      window.location.href = "/?expired=true";
    }
    return Promise.reject(error);
  }
);

export default instance;
