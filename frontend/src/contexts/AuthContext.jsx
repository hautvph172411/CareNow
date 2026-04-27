import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getUserPermissions } from "../api/auth_item.api";

export const AuthContext = createContext();

// Timeout constants - tạm thời để 1 năm (session gần như không hết hạn trong dev)
const TOKEN_LIFETIME = 365 * 24 * 60 * 60 * 1000;
const INACTIVE_TIMEOUT = 365 * 24 * 60 * 60 * 1000;
const WARNING_BEFORE_LOGOUT = 1000;

// Role tên (string) được xem là super admin - luôn có full quyền
const SUPER_ADMIN_ROLES = ['super_admin'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const tokenExpiryRef = useRef(null);
  const inactiveTimerRef = useRef(null);
  const warningTimerRef = useRef(null);

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

  const clearAllTimers = useCallback(() => {
    if (inactiveTimerRef.current) clearTimeout(inactiveTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
  }, []);

  const logout = useCallback((reason = "manual") => {
    clearAllTimers();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("loginTime");
    setUser(null);
    setIsAuthenticated(false);
    setPermissions([]);
    setPermissionsLoaded(false);
    setShowWarning(false);

    if (reason !== "manual") {
      navigate("/?expired=true&reason=" + reason, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [navigate, clearAllTimers]);

  const checkToken = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return false;
    const expiry = getTokenExpiry(token);
    if (!expiry) return false;
    return true;
  }, [getTokenExpiry]);

  const resetInactivityTimer = useCallback(() => {
    if (!isAuthenticated) return;
    clearAllTimers();
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, INACTIVE_TIMEOUT - WARNING_BEFORE_LOGOUT);
    inactiveTimerRef.current = setTimeout(() => {
      logout("inactive");
    }, INACTIVE_TIMEOUT);
  }, [isAuthenticated, logout, clearAllTimers]);

  const handleActivity = useCallback(() => {
    if (isAuthenticated && checkToken()) {
      resetInactivityTimer();
    }
  }, [isAuthenticated, checkToken, resetInactivityTimer]);

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

    resetInactivityTimer();
  }, [resetInactivityTimer, loadPermissions]);

  const extendSession = useCallback(() => {
    setShowWarning(false);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

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
      resetInactivityTimer();

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
      clearAllTimers();
      if (tokenExpiryRef.current) clearTimeout(tokenExpiryRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, handleActivity]);

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

  const value = {
    user,
    isAuthenticated,
    showWarning,
    permissions,
    permissionsLoaded,
    login,
    logout,
    extendSession,
    checkToken,
    hasPermission,
    refreshPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
