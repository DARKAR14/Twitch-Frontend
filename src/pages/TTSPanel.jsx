// src/pages/TTSPanel.jsx
import { useState, useEffect, useRef, useCallback } from "react";

const BOT_WS_URL = import.meta.env.VITE_BOT_WS_URL || "ws://localhost:3000";
const BOT_API_URL = import.meta.env.VITE_BOT_API_URL || "http://localhost:3000";

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

  // ── Carga de datos con validación anti-errores ──
  const fetchData = useCallback(async () => {
    try {
      const ttsRes = await fetch(`${BOT_API_URL}/cola`);
      if (!ttsRes.ok) throw new Error("Error en servidor");
      
      const resJson = await ttsRes.json();
      
      // Extraemos datos probando las rutas posibles de tu API
      const mensajesRaw = resJson.data?.mensajes || resJson.mensajes;
      const statsRaw = resJson.data?.total || resJson.stats || resJson.total;

      // EL CAMBIO CLAVE: Si mensajesRaw no es un array, ponemos [] para que .map() no falle
      setCola(Array.isArray(mensajesRaw) ? mensajesRaw : []);
      setStats(statsRaw || null);

      // Intentar obtener stats del bot
      try {
        const botRes = await fetch(`${BOT_API_URL}/stats`);
        if (botRes.ok) {
          const botData = await botRes.json();
          setBotStats(botData);
        }
      } catch {
        setBotStats(null);
      }
    } catch (err) {
      console.error("Error cargando TTS:", err.message);
      setCola([]); // Reset defensivo
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── WebSocket ──
  useEffect(() => {
    let reconnectTimeout;
    function conectar() {
      try {
        const ws = new WebSocket(BOT_WS_URL);
        wsRef.current = ws;
        ws.onopen = () => setWsStatus("connected");
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
          reconnectTimeout = setTimeout(conectar, 3000);
        };
        ws.onerror = () => ws.close();
      } catch {
        setWsStatus("disconnected");
        reconnectTimeout = setTimeout(conectar, 5000);
      }
    }
    conectar();
    return () => {
      wsRef.current?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [fetchData]);

  // Refresco cada 10s
  useEffect(() => {
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Acciones ──
  async function limpiarCola() {
    if (!window.confirm("¿Vaciar la cola?")) return;
    try {
      const res = await fetch(`${BOT_API_URL}/cola`, { method: "DELETE" });
      if (res.ok) {
        setCola([]);
        setCurrent(null);
        fetchData();
      }
    } catch (err) {
      console.error("Error limpiando:", err.message);
    }
  }

  const porIdioma = stats?.porIdioma || {};
  const wsClientes = botStats?.websocket?.total || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", color: "var(--text1)" }}>
      
      {/* Fila de Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        <StatCard label="En cola" value={cola.length} sub="pendientes" color="var(--purple)" />
        <StatCard label="OBS" value={wsClientes > 0 ? "ON" : "OFF"} sub={`${wsClientes} activos`} color={wsClientes > 0 ? "var(--green)" : "var(--red)"} />
        <StatCard label="WebSocket" value={wsStatus === "connected" ? "OK" : "ERR"} sub="Bot Status" color={wsStatus === "connected" ? "var(--green)" : "var(--red)"} />
        <StatCard label="Usuarios" value={stats?.usuariosUnicos ?? "—"} sub="en cola" color="var(--text1)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", alignItems: "start" }}>
        
        {/* Lado Izquierdo: Cola */}
        <div className="card">
          <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Cola TTS</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={fetchData} style={btnStyle("var(--border)", "var(--text2)")}>↻</button>
              <button onClick={limpiarCola} style={btnStyle("rgba(255,71,87,0.1)", "var(--red)")} disabled={cola.length === 0}>🗑 Limpiar</button>
            </div>
          </div>

          {current && (
            <div style={{ background: "rgba(145,71,255,0.08)", border: "1px solid rgba(145,71,255,0.2)", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
              <div style={{ fontSize: "10px", color: "var(--purple)", fontWeight: 700 }}>REPRODUCIENDO</div>
              <div style={{ fontSize: "13px" }}>{FLAGS[current.idioma]} <strong>{current.usuario}</strong>: {current.mensaje}</div>
            </div>
          )}

          {loading ? (
            <div style={{ padding: "30px", textAlign: "center", color: "var(--text3)" }}>Cargando...</div>
          ) : cola.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center", color: "var(--text3)" }}>📭 Vacío</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {cola.map((entry, i) => (
                <QueueItem key={entry.id || i} entry={entry} position={i + 1} />
              ))}
            </div>
          )}
        </div>

        {/* Lado Derecho: Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="card">
            <div className="card-title">Idiomas</div>
            {Object.keys(FLAGS).map((lang) => (
              <LanguageRow key={lang} lang={lang} count={porIdioma[lang] || 0} max={Math.max(...Object.values(porIdioma), 1)} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Componentes Pequeños ──

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card" style={{ padding: "16px" }}>
      <div style={{ fontSize: "11px", color: "var(--text3)", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: "22px", fontWeight: 700, color, margin: "4px 0" }}>{value}</div>
      <div style={{ fontSize: "11px", color: "var(--text3)" }}>{sub}</div>
    </div>
  );
}

function QueueItem({ entry, position }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "8px" }}>
      <span style={{ fontSize: "11px", color: "var(--purple)", fontWeight: 700, width: "20px" }}>{position}</span>
      <span style={{ fontSize: "16px" }}>{FLAGS[entry.idioma]}</span>
      <span style={{ fontWeight: 600, color: "var(--purple)", minWidth: "80px" }}>{entry.usuario}</span>
      <span style={{ fontSize: "13px", color: "var(--text2)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.mensaje}</span>
      {entry.reproduccion && <span style={{ fontSize: "11px" }}>✅</span>}
    </div>
  );
}

function LanguageRow({ lang, count, max }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
      <span style={{ width: "20px" }}>{FLAGS[lang]}</span>
      <div style={{ flex: 1, height: "6px", background: "var(--border)", borderRadius: "10px" }}>
        <div style={{ width: `${(count / max) * 100}%`, height: "100%", background: "var(--purple)", borderRadius: "10px" }} />
      </div>
      <span style={{ fontSize: "11px", color: "var(--text3)", minWidth: "15px" }}>{count}</span>
    </div>
  );
}

function btnStyle(bg, color) {
  return { background: bg, color, border: "none", padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 500 };
}
