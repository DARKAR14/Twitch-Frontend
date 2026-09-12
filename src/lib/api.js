// src/lib/api.js
import axios from "axios";
import { io } from "socket.io-client";
import { createAuthSession } from "./authSession";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
});

export const authSession = createAuthSession({
  storage: {
    getItem: (key) => window.sessionStorage.getItem(key),
    setItem: (key, value) => window.sessionStorage.setItem(key, value),
    removeItem: (key) => window.sessionStorage.removeItem(key),
  },
  location: window.location,
  history: window.history,
  exchange: (code) => api.post("/auth/exchange", { code }).then(({ data }) => data),
});

api.interceptors.request.use((config) => {
  const token = authSession.token();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// NO hay interceptor de redirección en 401.
// El interceptor que hacía window.location.href = "/" causaba un loop infinito:
// /auth/me → 401 → reload → /auth/me → 401 → reload ...
// El AuthContext ya maneja el estado no autenticado correctamente.

// Socket.io singleton
let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(BASE, {
      withCredentials: true,
      autoConnect: false,
      auth: (callback) => callback({ token: authSession.token() }),
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
