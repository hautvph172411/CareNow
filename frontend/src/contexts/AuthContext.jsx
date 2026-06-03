import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getUserPermissions } from "../api/auth_item.api";

export const AuthContext = createContext();

// Timeout constants - tạm thời để 1 năm (session gần như không hết hạn trong dev)
const TOKEN_LIFETIME = 365 * 24 * 60 * 60 * 1000;
const INACTIVE_TIMEOUT = 20 * 24 * 60 * 60 * 1000; // 20 ngày (tránh tràn số 32-bit của setTimeout)

// Role tên (string) được xem là super admin - luôn có full quyền
const SUPER_ADMIN_ROLES = ['super_admin'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("loginTime");
    setUser(null);
    setIsAuthenticated(false);
    setPermissions([]);
    setPermissionsLoaded(false);

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
    return true;
  }, [getTokenExpiry]);

  // Nạp permissions của user từ backend
  const loadPermissions = useCallback(async (userData) => {
    if (!userData?.id) {
      setPermissions([]);
      setPermissionsLoaded(true);
      return;
    }
    try {
      const res = await getUserPermissions(userData.id);
      if (res.success) {
        setPermissions(res.data || []);
      } else {
        setPermissions([]);
      }
    } catch (err) {
      console.error('Load permissions failed:', err);
      setPermissions([]);
    } finally {
      setPermissionsLoaded(true);
    }
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("loginTime", Date.now().toString());

    setUser(userData);
    setIsAuthenticated(true);
    setPermissionsLoaded(false);
    loadPermissions(userData);
  }, [loadPermissions]);

  // Khởi tạo state khi mount lần đầu
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    let userData = null;
    if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
      try {
        userData = JSON.parse(storedUser);
      } catch {
        userData = null;
      }
    }

    if (token && token !== 'undefined' && userData && userData.id && checkToken()) {
      setUser(userData);
      setIsAuthenticated(true);
      loadPermissions(userData);

      const expiry = getTokenExpiry(token);
      if (expiry) {
        tokenExpiryRef.current = setTimeout(() => {
          logout("expired");
        }, expiry - Date.now());
      }
    } else {
      // Dữ liệu localStorage không hợp lệ -> dọn sạch
      if (storedUser || token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
      }
      setPermissionsLoaded(true);
    }

    return () => {
      if (tokenExpiryRef.current) clearTimeout(tokenExpiryRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  /**
   * Kiểm tra user có quyền `name` không.
   * - Super admin (role integer = 2 hoặc role name nằm trong SUPER_ADMIN_ROLES): full quyền
   * - Chưa đăng nhập: không có quyền (FE route guard sẽ redirect /login)
   * - Đã đăng nhập: check permissions array
   */
  const hasPermission = useCallback((name) => {
    if (!name) return true;
    if (!isAuthenticated) return false;
    if (user?.role === 2) return true;
    if (user?.role_name && SUPER_ADMIN_ROLES.includes(user.role_name)) return true;
    return permissions.includes(name);
  }, [isAuthenticated, user, permissions]);

  const refreshPermissions = useCallback(() => {
    if (user) loadPermissions(user);
  }, [user, loadPermissions]);

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
    permissions,
    permissionsLoaded,
    login,
    logout,
    checkToken,
    hasPermission,
    refreshPermissions,
    updateUserSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
