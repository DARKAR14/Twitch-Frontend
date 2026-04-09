// src/components/ChannelHistory.jsx
import { useState, useEffect } from "react";
import { api, getSocket } from "../lib/api";

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

export default function ChannelHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = () => {
    api.get("/history/channel?limit=25")
      .then(({ data }) => setHistory(data.history || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();

    // Escuchar actualizaciones en tiempo real
    const socket = getSocket();
    const handler = () => {
      // Pequeño delay para que el backend ya haya guardado
      setTimeout(fetchHistory, 500);
    };
    socket.on("channel:updated", handler);
    return () => socket.off("channel:updated", handler);
  }, []);

  if (loading) return <div className="spinner" />;
  if (!history.length) return (
    <div className="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
      <p>Sin cambios registrados aún</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {history.map((entry) => (
        <div key={entry.id} style={{
          display: "flex", alignItems: "flex-start", gap: "12px",
          padding: "12px 14px",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderLeft: "3px solid var(--purple)",
          borderRadius: "var(--radius-sm)",
        }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: "var(--purple-dim)", display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0, fontSize: "13px"
          }}>✏️</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: "13px", fontWeight: 600, marginBottom: "3px",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
            }}>
              {entry.title}
            </div>
            {entry.game_name && (
              <div style={{ fontSize: "12px", color: "var(--purple)", marginBottom: "3px" }}>
                🎮 {entry.game_name}
              </div>
            )}
            <div style={{ fontSize: "11px", color: "var(--text3)" }}>
              por <span style={{ color: "var(--text2)", fontWeight: 600 }}>@{entry.changed_by}</span>
              {" "}·{" "}
              <span style={{
                padding: "1px 6px", borderRadius: "100px",
                background: entry.changed_by_role === "admin" ? "rgba(255,215,0,0.1)" : "rgba(0,229,255,0.1)",
                color: entry.changed_by_role === "admin" ? "var(--gold)" : "var(--cyan)",
                fontSize: "10px", fontWeight: 700
              }}>{entry.changed_by_role}</span>
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text3)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
            {timeAgo(entry.changed_at)}
          </div>
        </div>
      ))}
    </div>
  );
}