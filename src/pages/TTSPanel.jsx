// src/pages/TTSPanel.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../lib/api";

const BOT_WS_URL = import.meta.env.VITE_BOT_WS_URL || "ws://localhost:3000";

const FLAGS = { es: "🇪🇸", en: "🇺🇸", ja: "🇯🇵", ru: "🇷🇺", pt: "🇧🇷" };
const LANG_NAMES = { es: "Español", en: "Inglés", ja: "Japonés", ru: "Ruso", pt: "Portugués" };

export default function TTSPanel() {
  const [cola, setCola]         = useState([]);
  const [stats, setStats]       = useState(null);
  const [botStats, setBotStats] = useState(null);
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [current, setCurrent]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const wsRef = useRef(null);

  // ── Cargar datos iniciales ─────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      // Obtener datos de TTS desde MongoDB (backend)
      const ttsRes = await api.get("/tts/cola");
      setCola(ttsRes.data.mensajes || []);
      setStats(ttsRes.data.stats);

      // Intentar obtener stats del bot (websocket, OBS)
      try {
        const botRes = await api.get(`${import.meta.env.VITE_BOT_WS_URL || "http://localhost:3000"}/stats`);
        setBotStats(botRes.data);
      } catch {
        // Bot puede estar offline
      }
    } catch (err) {
      console.error("Error cargando TTS", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── WebSocket al bot ───────────────────────────────────────
  useEffect(() => {
    function conectar() {
      const ws = new WebSocket(BOT_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus("connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.tipo === "nuevo") {
            setCurrent(data);
            fetchData();
          }
        } catch {}
      };

      ws.onclose = () => {
        setWsStatus("disconnected");
        setTimeout(conectar, 3000);
      };

      ws.onerror = () => ws.close();
    }

    conectar();
    return () => wsRef.current?.close();
  }, [fetchData]);

  // Refresco periódico de stats (cada 5s)
  useEffect(() => {
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Acciones ───────────────────────────────────────────────
  async function limpiarCola() {
    try {
      await api.delete("/tts");
      setCola([]);
      setCurrent(null);
      fetchData();
    } catch (err) {
      console.error("Error limpiando cola", err.message);
    }
  }

  async function marcarComoReproducido(id) {
    try {
      await api.put(`/tts/${id}/play`);
      fetchData();
    } catch (err) {
      console.error("Error marcando como reproducido", err.message);
    }
  }

  const porIdioma = stats?.porIdioma || {};
  const wsClientes = botStats?.websocket?.total || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* ── Fila de stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        <StatCard
          label="En cola"
          value={cola.length}
          sub="mensajes pendientes"
          color="var(--purple)"
        />
        <StatCard
          label="OBS conectado"
          value={wsClientes > 0 ? "Sí" : "No"}
          sub={`${wsClientes} cliente${wsClientes !== 1 ? "s" : ""} activo${wsClientes !== 1 ? "s" : ""}`}
          color={wsClientes > 0 ? "var(--green)" : "var(--red)"}
        />
        <StatCard
          label="WebSocket bot"
          value={wsStatus === "connected" ? "Online" : "Offline"}
          sub={wsStatus === "connected" ? "Recibiendo eventos" : "Reconectando..."}
          color={wsStatus === "connected" ? "var(--green)" : "var(--red)"}
        />
        <StatCard
          label="Usuarios únicos"
          value={stats?.usuariosUnicos ?? "—"}
          sub="en cola actual"
          color="var(--text1)"
        />
      </div>

      {/* ── Fila principal ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", alignItems: "start" }}>

        {/* Cola de mensajes */}
        <div className="card">
          <div className="card-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <PulseDot active={wsStatus === "connected"} />
              Cola TTS
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={fetchData}
                style={btnStyle("var(--border)", "var(--text2)")}
              >
                ↻ Refrescar
              </button>
              <button
                onClick={limpiarCola}
                style={btnStyle("rgba(255,71,87,0.15)", "var(--red)")}
                disabled={cola.length === 0}
              >
                🗑 Limpiar cola
              </button>
            </div>
          </div>

          {/* Mensaje reproduciéndose */}
          {current && (
            <div style={{
              background: "rgba(145,71,255,0.08)",
              border: "1px solid rgba(145,71,255,0.25)",
              borderRadius: "10px",
              padding: "12px 14px",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}>
              <span style={{ fontSize: "18px" }}>🔊</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", color: "var(--purple)", fontWeight: 600, marginBottom: "2px" }}>
                  REPRODUCIENDO AHORA
                </div>
                <div style={{ fontSize: "13px", color: "var(--text1)", fontWeight: 500 }}>
                  {FLAGS[current.idioma] || "🌐"} {current.usuario}
                  <span style={{ color: "var(--text3)", fontWeight: 400 }}> · {current.mensaje}</span>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text3)", fontSize: "13px" }}>
              Cargando cola...
            </div>
          ) : cola.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text3)", fontSize: "13px" }}>
              📭 Cola vacía
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {cola.map((entry, i) => (
                <QueueItem key={entry.id} entry={entry} position={i + 1} />
              ))}
            </div>
          )}
        </div>

        {/* Panel derecho */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Idiomas en cola */}
          <div className="card">
            <div className="card-title">Idiomas en cola</div>
            {Object.keys(FLAGS).map((lang) => {
              const count = porIdioma[lang] || 0;
              const max   = Math.max(...Object.values(porIdioma), 1);
              return (
                <div key={lang} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "16px", width: "24px" }}>{FLAGS[lang]}</span>
                  <span style={{ fontSize: "12px", color: "var(--text2)", width: "60px" }}>{LANG_NAMES[lang]}</span>
                  <div style={{ flex: 1, height: "5px", background: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{
                      width: `${(count / max) * 100}%`,
                      height: "100%",
                      background: "var(--purple)",
                      borderRadius: "3px",
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text3)", minWidth: "16px", textAlign: "right" }}>{count}</span>
                </div>
              );
            })}
          </div>

          {/* Comandos disponibles */}
          <div className="card">
            <div className="card-title">Comandos</div>
            {[
              { cmd: "!habla",    lang: "Español",  flag: "🇪🇸" },
              { cmd: "!speak",    lang: "Inglés",   flag: "🇺🇸" },
              { cmd: "!onichan",  lang: "Japonés",  flag: "🇯🇵" },
              { cmd: "!sukablad", lang: "Ruso",     flag: "🇷🇺" },
              { cmd: "!cr7",      lang: "Portugués",flag: "🇧🇷" },
            ].map(({ cmd, lang, flag }) => (
              <div key={cmd} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "6px 0", borderBottom: "1px solid var(--border)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "15px" }}>{flag}</span>
                  <span style={{ fontSize: "12px", color: "var(--text1)", fontFamily: "var(--font-mono)" }}>{cmd}</span>
                </div>
                <span style={{ fontSize: "11px", color: "var(--text3)" }}>{lang}</span>
              </div>
            ))}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "6px 0",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "15px" }}>🥴</span>
                <span style={{ fontSize: "12px", color: "var(--text1)", fontFamily: "var(--font-mono)" }}>!paja</span>
              </div>
              <span style={{ fontSize: "11px", color: "var(--text3)" }}>El clásico</span>
            </div>
          </div>

          {/* OBS clientes */}
          {botStats?.websocket?.clientes?.length > 0 && (
            <div className="card">
              <div className="card-title">Clientes OBS</div>
              {botStats.websocket.clientes.map((c, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: "12px",
                }}>
                  <span style={{ color: "var(--green)" }}>● {c.ip}</span>
                  <span style={{ color: "var(--text3)" }}>{formatUptime(c.uptimeSegundos)}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Componentes auxiliares ─────────────────────────────────────

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card" style={{ padding: "16px 18px" }}>
      <div style={{ fontSize: "11px", color: "var(--text3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.8px" }}>
        {label}
      </div>
      <div style={{ fontSize: "24px", fontWeight: 600, color, marginBottom: "2px" }}>
        {value}
      </div>
      <div style={{ fontSize: "11px", color: "var(--text3)" }}>{sub}</div>
    </div>
  );
}

function QueueItem({ entry, position }) {
  const time = new Date(entry.createdAt || entry.timestamp).toLocaleTimeString("es-CO", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  const statusIcon = entry.reproduccion ? "✅" : "⏳";
  const statusColor = entry.reproduccion ? "var(--green)" : "var(--text3)";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "9px 12px",
      background: "var(--bg2)",
      border: "1px solid var(--border)",
      borderRadius: "8px",
    }}>
      <div style={{
        width: "22px", height: "22px", borderRadius: "5px",
        background: "rgba(145,71,255,0.15)", color: "var(--purple)",
        fontSize: "11px", fontWeight: 600,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {position}
      </div>
      <span style={{ fontSize: "16px", flexShrink: 0 }}>{FLAGS[entry.idioma] || "🌐"}</span>
      <span style={{ fontSize: "13px", color: "var(--purple)", fontWeight: 500, minWidth: "90px" }}>
        {entry.usuario}
      </span>
      <span style={{ fontSize: "13px", color: "var(--text2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {entry.mensaje}
      </span>
      <span style={{ fontSize: "11px", color: statusColor, flexShrink: 0 }}>
        {statusIcon}
      </span>
      <span style={{ fontSize: "11px", color: "var(--text3)", flexShrink: 0 }}>{time}</span>
    </div>
  );
}

function PulseDot({ active }) {
  return (
    <span style={{
      width: "7px", height: "7px", borderRadius: "50%",
      background: active ? "var(--green)" : "var(--text3)",
      display: "inline-block",
      animation: active ? "pulse 2s infinite" : "none",
    }} />
  );
}

function btnStyle(bg, color) {
  return {
    background: bg, color, border: `1px solid ${bg}`,
    borderRadius: "6px", padding: "5px 12px",
    fontSize: "12px", fontWeight: 500, cursor: "pointer",
  };
}

function formatUptime(seconds) {
  if (seconds < 60)   return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}
