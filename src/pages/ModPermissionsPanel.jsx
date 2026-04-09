// src/pages/ModPermissionsPanel.jsx
import { useState, useEffect } from "react";
import { api, getSocket } from "../lib/api";

const TAB_COLORS = {
  clips:      { color: "var(--purple)", bg: "rgba(145,70,255,0.12)", border: "rgba(145,70,255,0.3)" },
  chat:       { color: "var(--cyan)",   bg: "rgba(0,229,255,0.1)",   border: "rgba(0,229,255,0.25)" },
  stats:      { color: "#FFD700",       bg: "rgba(255,215,0,0.1)",   border: "rgba(255,215,0,0.25)" },
  moderation: { color: "var(--green)",  bg: "rgba(46,204,113,0.1)",  border: "rgba(46,204,113,0.25)" },
};

function Toggle({ enabled, onChange, loading }) {
  return (
    <button
      onClick={onChange}
      disabled={loading}
      style={{
        width: "42px", height: "24px", borderRadius: "12px", border: "none",
        background: enabled ? "var(--purple)" : "rgba(255,255,255,0.1)",
        cursor: loading ? "not-allowed" : "pointer",
        position: "relative", transition: "background 0.2s",
        opacity: loading ? 0.6 : 1, flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: "3px",
        left: enabled ? "21px" : "3px",
        width: "18px", height: "18px", borderRadius: "50%",
        background: "white", transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }} />
    </button>
  );
}

export default function ModPermissionsPanel() {
  const [mods, setMods] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState({}); // { "modId:tabId": true }
  const [recentChange, setRecentChange] = useState(null);

  const fetchData = () => {
    setLoading(true);
    api.get("/modpermissions/all")
      .then(({ data }) => {
        setMods(data.mods || []);
        setTabs(data.tabs || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Escuchar confirmaciones del socket cuando cambia un permiso
  useEffect(() => {
    const socket = getSocket();
    const handler = (data) => {
      setMods((prev) => prev.map((m) =>
        m.user_id === data.mod_id
          ? { ...m, permissions: data.permissions }
          : m
      ));
      setRecentChange({ mod_id: data.mod_id, tab: data.tab, enabled: data.enabled });
      setTimeout(() => setRecentChange(null), 2500);
    };
    socket.on("modpermissions:changed", handler);
    return () => socket.off("modpermissions:changed", handler);
  }, []);

  const handleToggle = async (modId, tabId, currentValue) => {
    const key = `${modId}:${tabId}`;
    setToggling((prev) => ({ ...prev, [key]: true }));

    // Optimistic update
    setMods((prev) => prev.map((m) =>
      m.user_id === modId
        ? { ...m, permissions: { ...m.permissions, [tabId]: !currentValue } }
        : m
    ));

    try {
      await api.patch(`/modpermissions/${modId}`, { tab: tabId, enabled: !currentValue });
    } catch {
      // Revertir si falla
      setMods((prev) => prev.map((m) =>
        m.user_id === modId
          ? { ...m, permissions: { ...m.permissions, [tabId]: currentValue } }
          : m
      ));
    } finally {
      setToggling((prev) => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  const handleReset = async (modId) => {
    try {
      const { data } = await api.put(`/modpermissions/${modId}/reset`);
      setMods((prev) => prev.map((m) =>
        m.user_id === modId ? { ...m, permissions: data.permissions } : m
      ));
    } catch {}
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Header con leyenda */}
      <div style={{
        padding: "14px 16px",
        background: "rgba(145,70,255,0.06)", border: "1px solid rgba(145,70,255,0.2)",
        borderRadius: "var(--radius)", fontSize: "13px", color: "var(--text2)", lineHeight: 1.6,
      }}>
        <strong style={{ color: "var(--purple)" }}>⚡ Tiempo real</strong> — Los cambios se aplican
        instantáneamente al panel de cada moderador sin que tenga que recargar la página.
      </div>

      {/* Toast de cambio reciente */}
      {recentChange && (
        <div style={{
          padding: "10px 16px", borderRadius: "var(--radius-sm)", fontSize: "13px",
          background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.3)",
          color: "var(--green)", animation: "fadeIn 0.2s ease",
        }}>
          ✓ Permiso <strong>{recentChange.tab}</strong> {recentChange.enabled ? "activado" : "desactivado"}
        </div>
      )}

      {/* Tabla de permisos */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>

        {/* Header de columnas */}
        <div style={{
          display: "grid",
          gridTemplateColumns: `220px repeat(${tabs.length}, 1fr) 100px`,
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          background: "rgba(255,255,255,0.02)",
        }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Moderador
          </div>
          {tabs.map((tab) => {
            const c = TAB_COLORS[tab.id] || {};
            return (
              <div key={tab.id} style={{ textAlign: "center", fontSize: "11px", fontWeight: 700, color: c.color || "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {tab.icon} {tab.label}
              </div>
            );
          })}
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center" }}>
            Reset
          </div>
        </div>

        {/* Filas de mods */}
        {loading ? (
          <div className="spinner" />
        ) : mods.length === 0 ? (
          <div className="empty-state"><p>No hay moderadores en este canal</p></div>
        ) : (
          mods.map((mod, i) => (
            <div
              key={mod.user_id}
              style={{
                display: "grid",
                gridTemplateColumns: `220px repeat(${tabs.length}, 1fr) 100px`,
                padding: "14px 16px",
                borderBottom: i < mods.length - 1 ? "1px solid var(--border)" : "none",
                alignItems: "center",
                transition: "background 0.15s",
                background: recentChange?.mod_id === mod.user_id ? "rgba(145,70,255,0.04)" : "transparent",
              }}
            >
              {/* Nombre del mod */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{
                  width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
                  background: "rgba(255,255,255,0.15)",
                }} />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>@{mod.user_name}</div>
                  <div style={{ fontSize: "10px", color: "var(--text3)", fontFamily: "var(--font-mono)" }}>
                    {mod.user_id}
                  </div>
                </div>
              </div>

              {/* Toggles por tab */}
              {tabs.map((tab) => {
                const key = `${mod.user_id}:${tab.id}`;
                const enabled = mod.permissions?.[tab.id] ?? true;
                const c = TAB_COLORS[tab.id] || {};
                return (
                  <div key={tab.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <Toggle
                      enabled={enabled}
                      loading={!!toggling[key]}
                      onChange={() => handleToggle(mod.user_id, tab.id, enabled)}
                    />
                    <span style={{
                      fontSize: "10px", fontWeight: 600, padding: "1px 6px", borderRadius: "100px",
                      background: enabled ? c.bg : "rgba(255,255,255,0.04)",
                      color: enabled ? c.color : "var(--text3)",
                      border: `1px solid ${enabled ? c.border : "transparent"}`,
                      transition: "all 0.2s",
                    }}>
                      {enabled ? "ON" : "OFF"}
                    </span>
                  </div>
                );
              })}

              {/* Botón reset */}
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => handleReset(mod.user_id)}
                  style={{
                    background: "none", border: "1px solid var(--border)",
                    borderRadius: "6px", color: "var(--text3)", padding: "4px 10px",
                    fontSize: "11px", cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.target.style.borderColor = "var(--purple-border)"; e.target.style.color = "var(--purple)"; }}
                  onMouseLeave={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.color = "var(--text3)"; }}
                >
                  Reset
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Botón refrescar */}
      <button className="refresh-btn" onClick={fetchData} style={{ width: "fit-content" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 4v6h-6M1 20v-6h6"/>
          <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
        </svg>
        Refrescar lista
      </button>
    </div>
  );
}