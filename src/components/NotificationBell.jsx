// src/components/NotificationBell.jsx
import { useState, useEffect, useRef } from "react";
import { api, getSocket } from "../lib/api";

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  return `hace ${Math.floor(mins / 60)}h`;
}

const TYPE_STYLES = {
  success: { bg: "rgba(46,204,113,0.1)", border: "rgba(46,204,113,0.25)", color: "#2ECC71", icon: "✓" },
  warning: { bg: "rgba(255,140,0,0.1)", border: "rgba(255,140,0,0.25)", color: "#FF8C00", icon: "⚠" },
  error:   { bg: "rgba(255,71,87,0.1)",  border: "rgba(255,71,87,0.25)",  color: "#FF4757", icon: "✕" },
  info:    { bg: "rgba(0,229,255,0.1)",  border: "rgba(0,229,255,0.25)",  color: "#00E5FF", icon: "ℹ" },
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  // Cargar notificaciones
  useEffect(() => {
    api.get("/history/notifications")
      .then(({ data }) => {
        setNotifications(data.notifications || []);
        setUnread(data.unread_count || 0);
      }).catch(() => {});
  }, []);

  // Socket: nuevas notificaciones en tiempo real
  useEffect(() => {
    const socket = getSocket();
    const handler = (notif) => {
      setNotifications((prev) => [
        { ...notif, id: Date.now(), read: false, created_at: new Date().toISOString() },
        ...prev
      ].slice(0, 50));
      setUnread((n) => n + 1);
    };
    socket.on("notification:new", handler);
    return () => socket.off("notification:new", handler);
  }, []);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open && unread > 0) {
      api.post("/history/notifications/read").then(() => {
        setUnread(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }).catch(() => {});
    }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={handleOpen}
        style={{
          position: "relative",
          background: open ? "var(--purple-dim)" : "var(--surface)",
          border: `1px solid ${open ? "var(--purple-border)" : "var(--border)"}`,
          borderRadius: "var(--radius-sm)",
          color: "var(--text2)",
          width: "36px", height: "36px",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.15s",
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span style={{
            position: "absolute", top: "-5px", right: "-5px",
            background: "#FF4757", color: "white",
            borderRadius: "100px", fontSize: "10px", fontWeight: 700,
            minWidth: "18px", height: "18px",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px",
          }}>{unread > 99 ? "99+" : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: "320px", maxHeight: "400px", overflowY: "auto",
          background: "#10101d", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          zIndex: 200,
        }}>
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            fontSize: "12px", fontWeight: 700, color: "var(--text2)",
            fontFamily: "var(--font-display)", letterSpacing: "0.05em"
          }}>
            NOTIFICACIONES
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text3)", fontSize: "13px" }}>
              Sin notificaciones
            </div>
          ) : (
            notifications.map((n) => {
              const style = TYPE_STYLES[n.type] || TYPE_STYLES.info;
              return (
                <div key={n.id} style={{
                  display: "flex", gap: "10px", padding: "10px 14px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  background: n.read ? "transparent" : "rgba(145,70,255,0.04)",
                  transition: "background 0.2s",
                }}>
                  <span style={{
                    width: "24px", height: "24px", borderRadius: "50%",
                    background: style.bg, border: `1px solid ${style.border}`,
                    color: style.color, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "12px", flexShrink: 0,
                  }}>{style.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", color: "var(--text)", lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ fontSize: "10px", color: "var(--text3)", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
