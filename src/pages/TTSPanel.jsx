// src/pages/TTSPanel.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

// ── Cliente apuntando al bot TTS (puede ser un Render distinto) ──
const ttsApi = axios.create({
  baseURL: import.meta.env.VITE_TTS_URL || import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: false, // el bot TTS no maneja sesiones
});

const LANG_META = {
  es: { flag: "🇪🇸", name: "Español",    cmd: "!habla",    color: "#FF6B6B" },
  en: { flag: "🇺🇸", name: "Inglés",     cmd: "!speak",    color: "#4ECDC4" },
  ja: { flag: "🇯🇵", name: "Japonés",    cmd: "!onichan",  color: "#FF6B9D" },
  ru: { flag: "🇷🇺", name: "Ruso",       cmd: "!sukablad", color: "#C77DFF" },
  pt: { flag: "🇧🇷", name: "Portugués",  cmd: "!cr7",      color: "#F4A261" },
};

function formatTime(isoStr) {
  if (!isoStr) return "";
  return new Date(isoStr).toLocaleTimeString("es-CO", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function timeAgo(isoStr) {
  if (!isoStr) return "";
  const diff = Date.now() - new Date(isoStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}m`;
  return `hace ${Math.floor(m / 60)}h`;
}

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderTop: `3px solid ${color}`,
      borderRadius: "var(--radius)",
      padding: "16px 18px",
    }}>
      <div style={{ fontSize: "11px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
        <span>{icon}</span>
        {label}
      </div>
      <div style={{ fontSize: "28px", fontWeight: 800, fontFamily: "var(--font-display)", color, lineHeight: 1 }}>
        {value ?? "—"}
      </div>
      {sub && <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "4px" }}>{sub}</div>}
    </div>
  );
}

function LangBar({ porIdioma }) {
  const entries = Object.entries(LANG_META).map(([code, meta]) => ({
    code, ...meta, count: porIdioma?.[code] || 0,
  }));
  const max = Math.max(...entries.map(e => e.count), 1);

  return (
    <div className="card">
      <div className="card-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 8h14M5 8a2 2 0 010-4h14a2 2 0 010 4M5 8l1 12M19 8l-1 12m-5-12v12m-3-6h6"/>
        </svg>
        Idiomas en cola
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {entries.map(({ code, flag, name, cmd, color, count }) => (
          <div key={code} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px", width: "24px", flexShrink: 0 }}>{flag}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "12px", color: "var(--text2)", fontWeight: 600 }}>{name}</span>
                <span style={{ fontSize: "11px", color, fontFamily: "var(--font-mono)", fontWeight: 700 }}>{count}</span>
              </div>
              <div style={{ height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{
                  width: `${(count / max) * 100}%`,
                  height: "100%",
                  background: color,
                  borderRadius: "2px",
                  transition: "width 0.5s ease",
                  minWidth: count > 0 ? "4px" : "0",
                }} />
              </div>
            </div>
            <span style={{
              fontSize: "10px", color: "var(--text3)", fontFamily: "var(--font-mono)",
              background: "rgba(255,255,255,0.04)", padding: "2px 6px", borderRadius: "4px",
              whiteSpace: "nowrap",
            }}>{cmd}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QueueItem({ entry, position, onMarkPlayed, marking }) {
  const lang = LANG_META[entry.idioma] || LANG_META.es;
  const [confirm, setConfirm] = useState(false);

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "10px",
      padding: "10px 14px",
      background: entry.reproduccion ? "rgba(46,204,113,0.04)" : "var(--surface)",
      border: `1px solid ${entry.reproduccion ? "rgba(46,204,113,0.2)" : "var(--border)"}`,
      borderLeft: `3px solid ${lang.color}`,
      borderRadius: "var(--radius-sm)",
      transition: "all 0.2s",
    }}>
      <div style={{
        width: "24px", height: "24px", borderRadius: "6px",
        background: `${lang.color}22`, color: lang.color,
        fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-display)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {position}
      </div>
      <span style={{ fontSize: "16px", flexShrink: 0, lineHeight: 1.5 }}>{lang.flag}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: lang.color }}>{entry.usuario}</span>
          {entry.reproduccion && (
            <span style={{
              fontSize: "9px", fontWeight: 700, padding: "1px 6px", borderRadius: "100px",
              background: "rgba(46,204,113,0.15)", color: "var(--green)", border: "1px solid rgba(46,204,113,0.3)",
            }}>REPRODUCIDO</span>
          )}
        </div>
        <div style={{
          fontSize: "13px", color: "var(--text2)", lineHeight: 1.4,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {entry.mensaje}
        </div>
        <div style={{ fontSize: "10px", color: "var(--text3)", marginTop: "3px", fontFamily: "var(--font-mono)" }}>
          {timeAgo(entry.createdAt)} · {formatTime(entry.createdAt)}
        </div>
      </div>
      {!entry.reproduccion && (
        confirm ? (
          <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
            <button
              onClick={() => { onMarkPlayed(entry.id); setConfirm(false); }}
              disabled={marking}
              style={{
                padding: "4px 8px", background: "rgba(46,204,113,0.15)",
                border: "1px solid rgba(46,204,113,0.3)", borderRadius: "6px",
                color: "var(--green)", cursor: "pointer", fontSize: "11px", fontWeight: 600,
              }}>
              {marking ? "..." : "✓"}
            </button>
            <button onClick={() => setConfirm(false)} style={{
              padding: "4px 8px", background: "none",
              border: "1px solid var(--border)", borderRadius: "6px",
              color: "var(--text3)", cursor: "pointer", fontSize: "11px",
            }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)} style={{
            padding: "4px 10px", background: "none",
            border: "1px solid var(--border)", borderRadius: "6px",
            color: "var(--text3)", cursor: "pointer", fontSize: "11px",
            flexShrink: 0, transition: "all 0.15s",
          }} title="Marcar como reproducido">▶</button>
        )
      )}
    </div>
  );
}

export default function TTSPanel() {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marking, setMarking] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [filter, setFilter] = useState("pending");
  const [lastRefresh, setLastRefresh] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const { data } = await ttsApi.get("/cola?limit=100");
      setQueue(data.mensajes || []);
      setStats(data.stats || null);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("[TTS]", err.message);
      setError("No se pudo conectar con el bot TTS. Verifica que esté activo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchData, 5000);
    }
    return () => clearInterval(intervalRef.current);
  }, [fetchData, autoRefresh]);

  const handleMarkPlayed = async (id) => {
    setMarking(id);
    try {
      await ttsApi.put(`/${id}/play`);
      setQueue(prev => prev.map(m => m.id === id ? { ...m, reproduccion: true } : m));
      setStats(prev => prev ? { ...prev, pending: Math.max(0, (prev.pending || 0) - 1) } : prev);
    } catch (err) {
      console.error("[TTS Mark]", err.message);
    } finally {
      setMarking(null);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await ttsApi.delete("/cola");
      setQueue([]);
      setStats(prev => prev ? { ...prev, pending: 0, total: 0 } : prev);
      setConfirmClear(false);
    } catch (err) {
      console.error("[TTS Clear]", err.message);
    } finally {
      setClearing(false);
    }
  };

  const pendingQueue = queue.filter(m => !m.reproduccion);
  const displayQueue = filter === "pending" ? pendingQueue : queue;
  const porIdioma = stats?.porIdioma || {};
  const usuariosUnicos = new Set(pendingQueue.map(m => m.usuario)).size;

  // ── Error de conexión ──
  if (error && !loading) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "60px 24px", textAlign: "center", gap: "16px",
      }}>
        <div style={{ fontSize: "48px" }}>🎙️</div>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--red)" }}>
          Error de conexión con el bot TTS
        </div>
        <div style={{ fontSize: "13px", color: "var(--text3)", maxWidth: "400px", lineHeight: 1.6 }}>
          {error}
        </div>
        <div style={{
          fontSize: "12px", color: "var(--text3)", fontFamily: "var(--font-mono)",
          background: "var(--surface)", padding: "8px 14px", borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)",
        }}>
          URL: {import.meta.env.VITE_TTS_URL || import.meta.env.VITE_API_URL || "http://localhost:3000"}
        </div>
        <button className="save-btn" style={{ width: "auto", padding: "10px 24px" }} onClick={fetchData}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        <StatCard label="En cola"       value={pendingQueue.length}                              sub="mensajes pendientes"  color="var(--purple)" icon="🎙️" />
        <StatCard label="Total"         value={stats?.total ?? queue.length}                     sub="mensajes procesados"  color="var(--cyan)"   icon="📊" />
        <StatCard label="Usuarios"      value={usuariosUnicos}                                   sub="en cola actual"       color="#F4A261"       icon="👥" />
        <StatCard label="Reproducidos"  value={stats?.played ?? queue.filter(m => m.reproduccion).length} sub="completados" color="var(--green)"  icon="✅" />
      </div>

      {/* Grid principal */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px", alignItems: "start" }}>

        {/* Cola */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div className="card-title" style={{ marginBottom: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
              Cola TTS
              {lastRefresh && (
                <span style={{ fontSize: "10px", color: "var(--text3)", fontFamily: "var(--font-mono)", fontWeight: 400 }}>
                  · act. {formatTime(lastRefresh.toISOString())}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={() => setAutoRefresh(p => !p)}
                style={{
                  padding: "5px 10px",
                  background: autoRefresh ? "rgba(145,70,255,0.12)" : "var(--surface)",
                  border: `1px solid ${autoRefresh ? "var(--purple-border)" : "var(--border)"}`,
                  borderRadius: "6px",
                  color: autoRefresh ? "var(--purple)" : "var(--text3)",
                  cursor: "pointer", fontSize: "11px", fontWeight: 600,
                }}
              >
                {autoRefresh ? "⏸ Auto" : "▶ Auto"}
              </button>
              <button className="refresh-btn" onClick={fetchData}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
                Actualizar
              </button>
              {confirmClear ? (
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={handleClear} disabled={clearing} style={{
                    padding: "5px 10px", background: "rgba(255,71,87,0.15)",
                    border: "1px solid rgba(255,71,87,0.3)", borderRadius: "6px",
                    color: "var(--red)", cursor: "pointer", fontSize: "11px", fontWeight: 600,
                  }}>{clearing ? "..." : "🗑 Sí, limpiar"}</button>
                  <button onClick={() => setConfirmClear(false)} style={{
                    padding: "5px 10px", background: "var(--surface)",
                    border: "1px solid var(--border)", borderRadius: "6px",
                    color: "var(--text2)", cursor: "pointer", fontSize: "11px",
                  }}>Cancelar</button>
                </div>
              ) : (
                <button onClick={() => setConfirmClear(true)} disabled={pendingQueue.length === 0} style={{
                  padding: "5px 12px", background: "none",
                  border: "1px solid rgba(255,71,87,0.3)", borderRadius: "6px",
                  color: "var(--red)", cursor: "pointer", fontSize: "11px",
                  opacity: pendingQueue.length === 0 ? 0.4 : 1,
                }}>🗑 Limpiar</button>
              )}
            </div>
          </div>

          <div className="tabs" style={{ marginBottom: "14px" }}>
            <button className={`tab ${filter === "pending" ? "active" : ""}`} onClick={() => setFilter("pending")}>
              Pendientes ({pendingQueue.length})
            </button>
            <button className={`tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
              Todos ({queue.length})
            </button>
          </div>

          {loading ? (
            <div className="spinner" />
          ) : displayQueue.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              </svg>
              <p>{filter === "pending" ? "No hay mensajes pendientes" : "La cola está vacía"}</p>
              <p style={{ fontSize: "11px", marginTop: "4px", opacity: 0.6 }}>
                Los mensajes aparecen cuando los viewers usan !habla, !speak, etc.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {displayQueue.map((entry, i) => (
                <QueueItem
                  key={entry.id || entry._id}
                  entry={entry}
                  position={i + 1}
                  onMarkPlayed={handleMarkPlayed}
                  marking={marking === entry.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <LangBar porIdioma={porIdioma} />

          <div className="card">
            <div className="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
              </svg>
              Comandos del chat
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {Object.entries(LANG_META).map(([code, meta]) => (
                <div key={code} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 0", borderBottom: "1px solid var(--border)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "15px" }}>{meta.flag}</span>
                    <code style={{ fontSize: "12px", color: meta.color, fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      {meta.cmd}
                    </code>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text3)" }}>{meta.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            padding: "12px 14px",
            background: "rgba(145,70,255,0.04)",
            border: "1px solid rgba(145,70,255,0.2)",
            borderRadius: "var(--radius-sm)",
            fontSize: "12px", color: "var(--text3)", lineHeight: 1.6,
          }}>
            <div style={{ fontWeight: 600, color: "var(--purple)", marginBottom: "4px" }}>ℹ️ Conexión</div>
            Conectado a: <span style={{ color: "var(--cyan)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
              {import.meta.env.VITE_TTS_URL || import.meta.env.VITE_API_URL || "http://localhost:3000"}
            </span>
            <br/>
            Se actualiza cada <strong style={{ color: "var(--text2)" }}>5 segundos</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}
