import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

const INACTIVE_TIMEOUT = 20 * 24 * 60 * 60 * 1000; // 20 ngày (tránh tràn số 32-bit của setTimeout)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const tokenExpiryRef = useRef(null);

  const getTokenExpiry = useCallback((token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(window.atob(base64));
      return payload.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }, []);

  const logout = useCallback((reason = "manual") => {
    if (tokenExpiryRef.current) clearTimeout(tokenExpiryRef.current);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("loginTime");
    setUser(null);
    setIsAuthenticated(false);
    if (reason !== "manual") {
      navigate("/?expired=true&reason=" + reason, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const checkToken = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return false;
    const expiry = getTokenExpiry(token);
    if (!expiry) return false;
    return Date.now() < expiry;
  }, [getTokenExpiry]);

  const login = useCallback((token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("loginTime", Date.now().toString());
    setUser(userData);
    setIsAuthenticated(true);

    const expiry = getTokenExpiry(token);
    if (expiry) {
      const delay = expiry - Date.now();
      if (delay > 0 && delay <= 2147483647) {
        tokenExpiryRef.current = setTimeout(() => logout("expired"), delay);
      }
    }
  }, [logout, getTokenExpiry]);

  // Khởi tạo state từ localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    let userData = null;
    if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
      try { userData = JSON.parse(storedUser); } catch { userData = null; }
    }

    if (token && token !== "undefined" && userData?.id && checkToken()) {
      setUser(userData);
      setIsAuthenticated(true);

      const expiry = getTokenExpiry(token);
      if (expiry) {
        const delay = expiry - Date.now();
        if (delay > 0 && delay <= 2147483647) {
          tokenExpiryRef.current = setTimeout(() => logout("expired"), delay);
        }
      }
    } else {
      if (storedUser || token) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("loginTime");
      }
    }

    setLoading(false);

    return () => {
      if (tokenExpiryRef.current) clearTimeout(tokenExpiryRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Kiểm tra xem user hiện tại có phải Manager không */
  const isManager = user?.partner_role === 'manager';

  const updateUserSession = useCallback((newUserData) => {
    setUser(prev => {
      const updatedUser = { ...prev, ...newUserData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    isManager,
    login,
    logout,
    checkToken,
    updateUserSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
