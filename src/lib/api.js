// src/lib/api.js
import axios from "axios";
import { io } from "socket.io-client";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
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
