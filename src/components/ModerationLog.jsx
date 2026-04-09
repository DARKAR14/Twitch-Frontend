// src/components/ModerationLog.jsx
import { useState, useEffect, useCallback } from "react";
import { api, getSocket } from "../lib/api";

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

function LogEntry({ entry }) {
  const type = entry.type;
  const icons = { follow: "👋", ban: "🔨", timeout: "⏱" };

  return (
    <div className={`log-entry ${type}`}>
      <div className={`log-icon ${type}`}>
        {icons[type] || "•"}
      </div>
      <div className="log-body">
        <div className="log-name">{entry.user_name || entry.user_login}</div>
        <div className="log-detail">
          {type === "follow" && "Nuevo seguidor"}
          {type === "ban" && (
            <>
              Baneado permanentemente
              {entry.reason && entry.reason !== "Sin razón especificada" && (
                <> · <em>{entry.reason}</em></>
              )}
              {entry.moderator_login && <> por @{entry.moderator_login}</>}
            </>
          )}
          {type === "timeout" && (
            <>
              Timeout
              {entry.expires_at && (
                <> hasta {new Date(entry.expires_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</>
              )}
              {entry.moderator_login && <> por @{entry.moderator_login}</>}
            </>
          )}
        </div>
      </div>
      <div className="log-time">
        {timeAgo(entry.timestamp || entry.followed_at || entry.banned_at)}
      </div>
    </div>
  );
}

export default function ModerationLog() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | follows | bans
  const [liveEntries, setLiveEntries] = useState([]);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get("/moderation/activity?first=30")
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Socket: nuevos followers y bans en tiempo real
  useEffect(() => {
    const socket = getSocket();

    const onFollow = (entry) => {
      setLiveEntries((prev) => [entry, ...prev].slice(0, 50));
    };
    const onBan = (entry) => {
      setLiveEntries((prev) => [entry, ...prev].slice(0, 50));
    };
    const onModInit = ({ followers, banned }) => {
      const all = [
        ...followers.map((f) => ({ ...f, type: "follow" })),
        ...banned.map((b) => ({ ...b, type: b.expires_at ? "timeout" : "ban" })),
      ].sort((a, b) => new Date(b.timestamp || b.followed_at || b.banned_at) - new Date(a.timestamp || a.followed_at || a.banned_at));
      setLiveEntries(all.slice(0, 50));
    };

    socket.on("moderation:new_follower", onFollow);
    socket.on("moderation:new_ban", onBan);
    socket.on("moderation:init", onModInit);

    return () => {
      socket.off("moderation:new_follower", onFollow);
      socket.off("moderation:new_ban", onBan);
      socket.off("moderation:init", onModInit);
    };
  }, []);

  // Combinar entradas de socket con datos de API
  const allActivity = [
    ...liveEntries,
    ...(data?.activity || []).filter(
      (a) => !liveEntries.find((l) => l.user_id === a.user_id && l.type === a.type)
    ),
  ].slice(0, 60);

  const filtered = allActivity.filter((e) => {
    if (filter === "follows") return e.type === "follow";
    if (filter === "bans") return e.type === "ban" || e.type === "timeout";
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Resumen */}
      {data?.summary && (
        <div className="mod-summary">
          <div className="stat-chip follows">
            <div className="stat-num">{data.summary.new_followers}</div>
            <div className="stat-label">Nuevos seguidores</div>
          </div>
          <div className="stat-chip bans">
            <div className="stat-num">{data.summary.banned_users}</div>
            <div className="stat-label">Baneados</div>
          </div>
          <div className="stat-chip timeouts">
            <div className="stat-num">{data.summary.timed_out_users}</div>
            <div className="stat-label">Timeouts</div>
          </div>
        </div>
      )}

      {/* Log principal */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: "12px" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          Log de actividad
          {liveEntries.length > 0 && (
            <span style={{ marginLeft: "6px", fontSize: "11px", background: "rgba(145,70,255,0.15)", color: "var(--purple)", padding: "2px 8px", borderRadius: "100px", border: "1px solid var(--purple-border)" }}>
              ⚡ En vivo
            </span>
          )}
          <button className="refresh-btn" onClick={fetchData} style={{ marginLeft: "auto" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Actualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="tabs" style={{ marginBottom: "16px" }}>
          <button className={`tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>Todo</button>
          <button className={`tab ${filter === "follows" ? "active" : ""}`} onClick={() => setFilter("follows")}>Seguidores</button>
          <button className={`tab ${filter === "bans" ? "active" : ""}`} onClick={() => setFilter("bans")}>Bans / Timeouts</button>
        </div>

        {/* Entries */}
        {loading && !data ? (
          <div className="spinner" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            <p>No hay actividad reciente</p>
          </div>
        ) : (
          <div className="mod-log">
            {filtered.map((entry, i) => (
              <LogEntry key={`${entry.user_id}-${entry.type}-${i}`} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
