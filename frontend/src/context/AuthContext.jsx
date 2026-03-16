import React, { createContext, useContext, useState, useCallback } from "react";
import { apiService } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("demandiq-user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email, password) => {
    const res = await apiService.login({ email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem("demandiq-token", access_token);
    localStorage.setItem("demandiq-user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (data) => {
    const res = await apiService.register(data);
    const { access_token, user: userData } = res.data;
    localStorage.setItem("demandiq-token", access_token);
    localStorage.setItem("demandiq-user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("demandiq-token");
    localStorage.removeItem("demandiq-user");
    setUser(null);
  }, []);

  const updateUser = useCallback(
    (updated) => {
      const merged = { ...user, ...updated };
      localStorage.setItem("demandiq-user", JSON.stringify(merged));
      setUser(merged);
    },
    [user],
  );

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
