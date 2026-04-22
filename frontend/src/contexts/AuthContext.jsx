import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const AuthContext = createContext();

// Constants for timeouts (in milliseconds)
// Constants for timeouts - Disabled for now as per user request
const TOKEN_LIFETIME = 365 * 24 * 60 * 60 * 1000; // 1 year
const INACTIVE_TIMEOUT = 365 * 24 * 60 * 60 * 1000; // 1 year
const WARNING_BEFORE_LOGOUT = 1000; 

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const tokenExpiryRef = useRef(null);
  const inactiveTimerRef = useRef(null);
  const warningTimerRef = useRef(null);

  // Parse JWT token to get expiry
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

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (inactiveTimerRef.current) clearTimeout(inactiveTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
  }, []);

  // Logout function
  const logout = useCallback((reason = "manual") => {
    clearAllTimers();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("loginTime");
    setUser(null);
    setIsAuthenticated(false);
    setShowWarning(false);

    if (reason !== "manual") {
      navigate("/?expired=true&reason=" + reason, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [navigate, clearAllTimers]);

  // Check if token is valid
  const checkToken = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return false;

    const expiry = getTokenExpiry(token);
    if (!expiry) return false;

    const now = Date.now();
    // if (now >= expiry) {
    //   logout("expired");
    //   return false;
    // }

    return true;
  }, [getTokenExpiry, logout]);

  // Set up inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (!isAuthenticated) return;

    clearAllTimers();

    // Set warning timer
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, INACTIVE_TIMEOUT - WARNING_BEFORE_LOGOUT);

    // Set logout timer
    inactiveTimerRef.current = setTimeout(() => {
      logout("inactive");
    }, INACTIVE_TIMEOUT);
  }, [isAuthenticated, logout, clearAllTimers]);

  // Handle user activity
  const handleActivity = useCallback(() => {
    if (isAuthenticated) {
      // Only reset if token is still valid
      if (checkToken()) {
        resetInactivityTimer();
      }
    }
  }, [isAuthenticated, checkToken, resetInactivityTimer]);

  // Login function
  const login = useCallback((token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("loginTime", Date.now().toString());

    setUser(userData);
    setIsAuthenticated(true);

    // Set up timers
    resetInactivityTimer();

    // Set token expiry check
    // const expiry = getTokenExpiry(token);
    // if (expiry) {
    //   tokenExpiryRef.current = setTimeout(() => {
    //     logout("expired");
    //   }, expiry - Date.now());
    // }
  }, [getTokenExpiry, logout, resetInactivityTimer]);

  // Extend session
  const extendSession = useCallback(() => {
    setShowWarning(false);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // Initialize auth state on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      if (checkToken()) {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        resetInactivityTimer();

        const expiry = getTokenExpiry(token);
        if (expiry) {
          tokenExpiryRef.current = setTimeout(() => {
            logout("expired");
          }, expiry - Date.now());
        }
      }
    }

    return () => {
      clearAllTimers();
      if (tokenExpiryRef.current) clearTimeout(tokenExpiryRef.current);
    };
  }, [checkToken, logout, resetInactivityTimer, getTokenExpiry, clearAllTimers]);

  // Set up activity listeners
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

  const value = {
    user,
    isAuthenticated,
    showWarning,
    login,
    logout,
    extendSession,
    checkToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}