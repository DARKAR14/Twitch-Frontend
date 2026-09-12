/* eslint-disable react-refresh/only-export-components */
// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { api, authSession, connectSocket, disconnectSocket } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    authSession.initialize()
      .then(() => api.get("/auth/me"))
      .then(({ data }) => {
        if (active && data.authenticated) {
          setUser(data.user);
          connectSocket();
        }
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user || !authSession.expiresAt()) return;
    const timer = window.setInterval(() => {
      if (Date.now() >= authSession.expiresAt()) {
        authSession.clear();
        disconnectSocket();
        setUser(null);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [user]);

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    authSession.clear();
    disconnectSocket();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
