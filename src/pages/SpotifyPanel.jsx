// src/pages/SpotifyPanel.jsx
import { useState, useEffect, useRef } from "react";
import { api, getSocket } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function TrackCard({ track, isPlaying = false, requestedBy = null, small = false }) {
  if (!track) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: small ? "8px 12px" : "12px 14px",
      background: isPlaying ? "rgba(29,185,84,0.08)" : "var(--surface)",
      border: `1px solid ${isPlaying ? "rgba(29,185,84,0.3)" : "var(--border)"}`,
      borderRadius: "var(--radius-sm)",
      transition: "all 0.2s",
    }}>
      {track.album_art && (
        <img src={track.album_art} alt={track.album}
          style={{ width: small ? "36px" : "48px", height: small ? "36px" : "48px", borderRadius: "6px", flexShrink: 0, objectFit: "cover" }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: small ? "12px" : "13px", fontWeight: 600,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          color: isPlaying ? "#1DB954" : "var(--text)",
        }}>
          {isPlaying && <span style={{ marginRight: "6px" }}>▶</span>}
          {track.name}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "2px" }}>
          {track.artists} · {track.duration_label}
        </div>
        {requestedBy && (
          <div style={{ fontSize: "10px", color: "#1DB954", marginTop: "2px" }}>
            Solicitado por @{requestedBy}
          </div>
        )}
      </div>
      {track.url && (
        <a href={track.url} target="_blank" rel="noopener noreferrer"
          style={{ color: "var(--text3)", flexShrink: 0, fontSize: "11px", textDecoration: "none" }}>
          ↗
        </a>
      )}
    </div>
  );
}

function ConnectSection({ onConnected }) {
  const handleConnect = () => {
    window.location.href = `${API_URL}/spotify/auth`;
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "60px 24px", textAlign: "center",
    }}>
      {/* Logo Spotify */}
      <div style={{
        width: "72px", height: "72px", borderRadius: "50%",
        background: "rgba(29,185,84,0.15)", border: "1px solid rgba(29,185,84,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "20px", fontSize: "32px",
      }}>🎵</div>

      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 800, marginBottom: "10px" }}>
        Conecta tu Spotify
      </h2>
      <p style={{ color: "var(--text2)", fontSize: "14px", lineHeight: 1.6, maxWidth: "360px", marginBottom: "28px" }}>
        Vincula tu cuenta para que los viewers puedan añadir canciones a tu cola usando Channel Points.
        Se creará la recompensa automáticamente.
      </p>

      <button onClick={handleConnect} style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "12px 28px", borderRadius: "100px", border: "none",
        background: "#1DB954", color: "white",
        fontFamily: "var(--font-body)", fontSize: "15px", fontWeight: 700,
        cursor: "pointer", transition: "all 0.2s",
      }}
        onMouseEnter={(e) => e.currentTarget.style.background = "#1ed760"}
        onMouseLeave={(e) => e.currentTarget.style.background = "#1DB954"}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
        Conectar con Spotify
      </button>
    </div>
  );
}

export default function SpotifyPanel() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [status, setStatus] = useState(null); // null = cargando
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [requests, setRequests] = useState([]);
  const [reward, setReward] = useState(null);
  const [tab, setTab] = useState("queue"); // queue | requests
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const pollRef = useRef(null);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get("/spotify/status");
      setStatus(data);
      if (data.connected) {
        setCurrent(data.current);
        setQueue(data.queue || []);
      }
    } catch { setStatus({ connected: false }); }
  };

  const fetchQueue = async () => {
    if (!status?.connected) return;
    setLoadingQueue(true);
    try {
      const { data } = await api.get("/spotify/queue");
      setCurrent(data.current);
      setQueue(data.queue || []);
    } catch {}
    finally { setLoadingQueue(false); }
  };

  const fetchRequests = async () => {
    try {
      const { data } = await api.get("/spotify/requests");
      setRequests(data.requests || []);
    } catch {}
  };

  const fetchReward = async () => {
    try {
      const { data } = await api.get("/spotify/reward-info");
      setReward(data.reward);
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (!status?.connected) return;
    fetchRequests();
    fetchReward();
    // Poll de la cola cada 10s
    pollRef.current = setInterval(fetchQueue, 10000);
    return () => clearInterval(pollRef.current);
  }, [status?.connected]);

  // Redirigido desde callback de Spotify
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("spotify") === "connected") {
      fetchStatus();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Socket: nueva canción añadida
  useEffect(() => {
    const socket = getSocket();
    const handler = (data) => {
      setRequests((prev) => [data, ...prev].slice(0, 50));
      // Refrescar cola
      setTimeout(fetchQueue, 1000);
    };
    socket.on("spotify:track_added", handler);
    socket.on("spotify:disconnected", () => setStatus({ connected: false }));
    return () => {
      socket.off("spotify:track_added", handler);
      socket.off("spotify:disconnected");
    };
  }, []);

  const handleDisconnect = async () => {
    if (!confirm("¿Desconectar Spotify? Se desactivará la recompensa de Channel Points.")) return;
    setDisconnecting(true);
    try {
      await api.post("/spotify/disconnect");
      setStatus({ connected: false });
    } catch {}
    finally { setDisconnecting(false); }
  };

  // Cargando
  if (!status) return <div className="spinner" />;

  // No conectado
  if (!status.connected) {
    return isAdmin
      ? <ConnectSection onConnected={fetchStatus} />
      : (
        <div className="empty-state">
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>🎵</div>
          <p>El admin aún no ha conectado Spotify</p>
        </div>
      );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Header estado */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", borderRadius: "var(--radius)",
        background: "rgba(29,185,84,0.08)", border: "1px solid rgba(29,185,84,0.25)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#1DB954", boxShadow: "0 0 8px #1DB954", display: "inline-block" }} />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#1DB954" }}>Spotify conectado</span>
          {reward && (
            <span style={{
              fontSize: "11px", padding: "2px 10px", borderRadius: "100px",
              background: "rgba(29,185,84,0.15)", color: "#1DB954", border: "1px solid rgba(29,185,84,0.3)",
            }}>
              🎁 Recompensa: {reward.cost?.toLocaleString()} pts
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button className="refresh-btn" onClick={fetchQueue} disabled={loadingQueue}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Actualizar
          </button>
          {isAdmin && (
            <button onClick={handleDisconnect} disabled={disconnecting} style={{
              background: "none", border: "1px solid rgba(255,71,87,0.3)",
              color: "var(--red)", borderRadius: "6px", padding: "5px 12px",
              fontSize: "12px", cursor: "pointer",
            }}>
              {disconnecting ? "..." : "Desconectar"}
            </button>
          )}
        </div>
      </div>

      {/* Canción actual */}
      {current && (
        <div className="card">
          <div className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
            </svg>
            Sonando ahora
          </div>
          <TrackCard track={current} isPlaying={true} />
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === "queue" ? "active" : ""}`} onClick={() => setTab("queue")}>
          Cola ({queue.length})
        </button>
        <button className={`tab ${tab === "requests" ? "active" : ""}`} onClick={() => { setTab("requests"); fetchRequests(); }}>
          Solicitudes ({requests.length})
        </button>
      </div>

      {/* Cola */}
      {tab === "queue" && (
        <div className="card">
          <div className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            Próximas canciones
          </div>
          {loadingQueue ? <div className="spinner" /> : queue.length === 0 ? (
            <div className="empty-state"><p>La cola está vacía</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {queue.map((track, i) => (
                <div key={track.id + i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text3)", fontFamily: "var(--font-mono)", width: "20px", textAlign: "right", flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <TrackCard track={track} small />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Solicitudes */}
      {tab === "requests" && (
        <div className="card">
          <div className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Historial de solicitudes
          </div>
          {requests.length === 0 ? (
            <div className="empty-state"><p>Aún no hay solicitudes</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {requests.map((req, i) => (
                <TrackCard
                  key={i}
                  track={req.track}
                  requestedBy={req.requested_by}
                  small
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info para viewers */}
      {reward && (
        <div style={{
          padding: "12px 16px", borderRadius: "var(--radius-sm)", fontSize: "12px",
          background: "var(--surface)", border: "1px solid var(--border)",
          color: "var(--text3)", lineHeight: 1.6,
        }}>
          💡 Los viewers pueden pedir canciones canjeando <strong style={{ color: "var(--text2)" }}>{reward.cost?.toLocaleString()} Channel Points</strong> con la recompensa <strong style={{ color: "#1DB954" }}>"{reward.title}"</strong> y pegando el link de Spotify.
        </div>
      )}
    </div>
  );
}