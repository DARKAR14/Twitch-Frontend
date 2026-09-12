// src/components/ChannelHistory.jsx
import { useState, useEffect } from "react";
import { api, getSocket } from "../lib/api";

function timeAgo(iso) {
  const timestamp = new Date(iso).getTime();
  if (!iso || !Number.isFinite(timestamp)) return "fecha no disponible";
  const diff = Math.max(0, Date.now() - timestamp);
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
    <div className="channel-history-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {history.map((entry) => {
        const role = entry.changed_by_role || entry.changer_role;
        return (
        <article className="history-row" key={entry.id}>
          <div className="history-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: "13px", fontWeight: 600, marginBottom: "3px",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
            }}>
              {entry.title}
            </div>
            {entry.game_name && (
              <div className="history-game">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 12h4m-2-2v4"/><path d="M15 13h.01M18 11h.01"/><path d="M6.5 6h11A4.5 4.5 0 0 1 22 10.5v3a4.5 4.5 0 0 1-7.7 3.18L12 14.38l-2.3 2.3A4.5 4.5 0 0 1 2 13.5v-3A4.5 4.5 0 0 1 6.5 6Z"/></svg>
                {entry.game_name}
              </div>
            )}
            <div style={{ fontSize: "11px", color: "var(--text3)" }}>
              por <span style={{ color: "var(--text2)", fontWeight: 600 }}>@{entry.changed_by}</span>
              {" "}·{" "}
              <span style={{
                padding: "1px 6px", borderRadius: "100px",
                background: role === "admin" ? "rgba(215,198,141,0.1)" : "rgba(172,213,222,0.1)",
                color: role === "admin" ? "var(--gold)" : "var(--cyan)",
                fontSize: "10px", fontWeight: 700
              }}>{role || "rol no disponible"}</span>
            </div>
          </div>
          <div className="history-time">
            {timeAgo(entry.changed_at || entry.created_at)}
          </div>
        </article>
      );})}
    </div>
  );
}
