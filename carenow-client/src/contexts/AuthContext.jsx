import { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("client_token");
      const storedUser = localStorage.getItem("client_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to restore client session", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((nextToken, nextUser) => {
    localStorage.setItem("client_token", nextToken);
    localStorage.setItem("client_user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("client_token");
    localStorage.removeItem("client_user");
    setToken(null);
    setUser(null);
  }, []);

  /**
   * Cập nhật thông tin user trong context + localStorage.
   * Dùng sau khi PUT /patient/me thành công.
   */
  const updateUser = useCallback((nextUser) => {
    setUser((prev) => {
      const merged = { ...(prev || {}), ...(nextUser || {}) };
      localStorage.setItem("client_user", JSON.stringify(merged));
      return merged;
    });
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
