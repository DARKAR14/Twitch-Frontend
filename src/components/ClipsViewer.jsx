// src/components/ClipsViewer.jsx
import { useState, useEffect } from "react";
import { api } from "../lib/api";

function formatDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

function ClipGrid({ clips, loading }) {
  if (loading) return <div className="spinner" />;
  if (!clips.length) return (
    <div className="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
      </svg>
      <p>No hay clips en este período</p>
    </div>
  );

  return (
    <div className="clips-grid">
      {clips.map((clip) => (
        <a key={clip.id} href={clip.url} target="_blank" rel="noopener noreferrer" className="clip-card">
          <img
            className="clip-thumb"
            src={clip.thumbnail_url}
            alt={clip.title}
            loading="lazy"
            onError={(e) => { e.target.style.background = "#0d0d1a"; e.target.src = ""; }}
          />
          <div className="clip-body">
            <div className="clip-title">{clip.title}</div>
            <div className="clip-meta">
              <span>@{clip.creator_name}</span>
              <span className="clip-views">👁 {clip.view_count?.toLocaleString()}</span>
            </div>
            
            <div className="clip-meta" style={{ marginTop: "4px" }}>
              <span>{formatDate(clip.created_at)}</span>
              <span>{formatDuration(clip.duration)}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

export default function ClipsViewer() {
  const [tab, setTab] = useState("today"); // today | streams
  const [todayClips, setTodayClips] = useState([]);
  const [streams, setStreams] = useState([]);
  const [selectedStream, setSelectedStream] = useState(null);
  const [streamClips, setStreamClips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStream, setLoadingStream] = useState(false);

  // Cargar clips de hoy
  useEffect(() => {
    if (tab !== "today") return;
    setLoading(true);
    api.get("/clips/today?first=50")
      .then(({ data }) => setTodayClips(data.clips || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab]);

  // Cargar lista de streams
  useEffect(() => {
    if (tab !== "streams") return;
    setLoading(true);
    api.get("/clips/streams?first=15")
      .then(({ data }) => setStreams(data.streams || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab]);

  // Cargar clips de stream seleccionado
  const loadStreamClips = (stream) => {
    setSelectedStream(stream);
    setLoadingStream(true);
    api.get(`/clips/by-stream/${stream.id}?first=50`)
      .then(({ data }) => setStreamClips(data.clips || []))
      .catch(() => setStreamClips([]))
      .finally(() => setLoadingStream(false));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div className="tabs">
          <button className={`tab ${tab === "today" ? "active" : ""}`} onClick={() => setTab("today")}>
            Hoy
          </button>
          <button className={`tab ${tab === "streams" ? "active" : ""}`} onClick={() => setTab("streams")}>
            Streams anteriores
          </button>
        </div>
        <button className="refresh-btn" onClick={() => {
          setTodayClips([]); setStreams([]); setSelectedStream(null); setStreamClips([]);
          // Retrigger useEffect
          const t = tab; setTab(""); setTimeout(() => setTab(t), 50);
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          Recargar
        </button>
      </div>

      {/* Clips de hoy */}
      {tab === "today" && (
        <div className="card">
          <div className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8M12 17v4"/>
            </svg>
            Clips de hoy · {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "2-digit", month: "long" })}
            {todayClips.length > 0 && (
              <span style={{ marginLeft: "auto", fontSize: "11px", color: "var(--purple)", fontWeight: 600 }}>
                {todayClips.length} clips
              </span>
            )}
          </div>
          <ClipGrid clips={todayClips} loading={loading} />
        </div>
      )}

      {/* Streams anteriores */}
      {tab === "streams" && (
        <div className="clips-split">
          {/* Lista de streams */}
          <div className="card" style={{ position: "sticky", top: "20px" }}>
            <div className="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              Streams anteriores
            </div>
            {loading ? <div className="spinner" /> : (
              <div className="streams-list">
                {streams.map((s) => (
                  <button
                    key={s.id}
                    className={`stream-row ${selectedStream?.id === s.id ? "active" : ""}`}
                    onClick={() => loadStreamClips(s)}
                  >
                    <img className="stream-thumb" src={s.thumbnail_url} alt={s.title} />
                    <div className="stream-info">
                      <div className="stream-title-text">{s.title}</div>
                      <div className="stream-date">{formatDate(s.created_at)}</div>
                    </div>
                    <div className="stream-duration">{s.duration}</div>
                  </button>
                ))}
                {!loading && streams.length === 0 && (
                  <div className="empty-state"><p>No hay VODs disponibles</p></div>
                )}
              </div>
            )}
          </div>

          {/* Clips del stream seleccionado */}
          <div className="card">
            <div className="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2"/>
              </svg>
              {selectedStream ? (
                <>Clips de: <span style={{ color: "var(--purple)", fontWeight: 700 }}>{selectedStream.title}</span></>
              ) : "Selecciona un stream"}
              {streamClips.length > 0 && (
                <span style={{ marginLeft: "auto", fontSize: "11px", color: "var(--purple)", fontWeight: 600 }}>
                  {streamClips.length} clips
                </span>
              )}
            </div>
            {!selectedStream ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 18V5l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                </svg>
                <p>Elige un stream de la lista para ver sus clips</p>
              </div>
            ) : (
              <ClipGrid clips={streamClips} loading={loadingStream} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
