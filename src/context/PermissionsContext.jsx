// src/context/PermissionsContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { api, getSocket } from "../lib/api";
import { useAuth } from "./AuthContext";

const PermissionsContext = createContext(null);

// Tabs que SIEMPRE se muestran independientemente de permisos
const ALWAYS_VISIBLE = ["channel"];

export function PermissionsProvider({ children }) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setPermissions(null); setLoading(false); return; }

    // Admin siempre tiene todo — no necesita consultar
    if (user.role === "admin") {
      setPermissions({ clips: true, chat: true, stats: true, moderation: true });
      setLoading(false);
      return;
    }

    // Mods: consultar permisos desde el backend
    api.get("/modpermissions/me")
      .then(({ data }) => setPermissions(data.permissions))
      .catch(() => {
        // Si falla, dar permisos por defecto
        setPermissions({ clips: true, chat: true, stats: true, moderation: true });
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Escuchar cambios en tiempo real vía Socket.io
  useEffect(() => {
    if (!user || user.role === "admin") return;
    const socket = getSocket();

    const handler = (data) => {
      setPermissions(data.permissions);
      // Pequeña notificación visual
      const tabName = data.changed_tab;
      const action = data.enabled ? "activado" : "desactivado";
      console.log(`[Permissions] ${tabName} ${action} por ${data.updated_by}`);
    };

    socket.on("permissions:updated", handler);
    return () => socket.off("permissions:updated", handler);
  }, [user]);

  /**
   * Verifica si el usuario puede ver un tab específico
   */
  function canSee(tabId) {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (ALWAYS_VISIBLE.includes(tabId)) return true;
    if (!permissions) return false;
    return permissions[tabId] === true;
  }

  return (
    <PermissionsContext.Provider value={{ permissions, loading, canSee }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export const usePermissions = () => useContext(PermissionsContext);