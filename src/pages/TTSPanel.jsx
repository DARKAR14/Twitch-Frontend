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

  // ── Cargar datos iniciales (Corregido con fallback de estructura) ──
  const fetchData = useCallback(async () => {
    try {
      const ttsRes = await fetch(`${BOT_API_URL}/cola`);
      if (ttsRes.ok) {
        const resJson = await ttsRes.json();
        
        // El secreto: Manejar ambos formatos posibles (con .data o directo)
        const mensajes = resJson.data?.mensajes || resJson.mensajes || [];
        const estadisticas = resJson.data?.total || resJson.stats || resJson.total || null;

        setCola(mensajes);
        setStats(estadisticas);
      }

      // Stats del Bot
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── WebSocket ───────────────────────────────────────────────────
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
          } catch (e) { console.error("Error WS parse:", e); }
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

  // Refresco automático cada 10s para stats pesados
  useEffect(() => {
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Acciones (Usando fetch nativo para evitar dependencias) ──
  async function limpiarCola() {
    if (!window.confirm("¿Estás seguro de limpiar toda la cola?")) return;
    try {
      const res = await fetch(`${BOT_API_URL}/cola`, { method: "DELETE" });
      if (res.ok) {
        setCola([]);
        setCurrent(null);
        fetchData();
      }
    } catch (err) {
      console.error("Error al limpiar cola:", err.message);
    }
  }

  async function marcarComoReproducido(id) {
    try {
      await fetch(`${BOT_API_URL}/tts/${id}/play`, { method: "PUT" });
      fetchData();
    } catch (err) {
      console.error("Error al marcar reproducción:", err.message);
    }
  }

  const porIdioma = stats?.porIdioma || {};
  const wsClientes = botStats?.websocket?.total || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        <StatCard label="En cola" value={cola.length} sub="mensajes" color="var(--purple)" />
        <StatCard 
          label="OBS" 
          value={wsClientes > 0 ? "Online" : "Offline"} 
          sub={`${wsClientes} clientes`} 
          color={wsClientes > 0 ? "var(--green)" : "var(--red)"} 
        />
        <StatCard 
          label="WS Bot" 
          value={wsStatus === "connected" ? "Conectado" : "Desconectado"} 
          sub="Status tiempo real" 
          color={wsStatus === "connected" ? "var(--green)" : "var(--red)"} 
        />
        <StatCard label="Usuarios" value={stats?.usuariosUnicos ?? "—"} sub="únicos" color="var(--text1)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", alignItems: "start" }}>
        
        <div className="card">
          <div className="card-title" style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <PulseDot active={wsStatus === "connected"} /> Cola de Mensajes
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={fetchData} style={btnStyle("var(--border)", "var(--text2)")}>↻</button>
              <button 
                onClick={limpiarCola} 
                style={btnStyle("rgba(255,71,87,0.1)", "var(--red)")}
                disabled={cola.length === 0}
              >
                Limpiar
              </button>
            </div>
          </div>

          {current && <CurrentPlayer current={current} />}

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center" }}>Cargando...</div>
          ) : cola.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text3)" }}>Cola vacía</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {cola.map((entry, i) => (
                <QueueItem key={entry.id || i} entry={entry} position={i + 1} onPlay={() => marcarComoReproducido(entry.id)} />
              ))}
            </div>
          )}
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="card">
            <div className="card-title">Idiomas</div>
            {Object.keys(FLAGS).map((lang) => (
              <LanguageBar key={lang} lang={lang} count={porIdioma[lang] || 0} max={Math.max(...Object.values(porIdioma), 1)} />
            ))}
          </div>
          
          <div className="card">
            <div className="card-title">Comandos</div>
            {/* Aquí tus comandos como los tenías */}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Sub-Componentes (Limpios) ──────────────────────────────────

function CurrentPlayer({ current }) {
  return (
    <div style={{ background: "rgba(145,71,255,0.08)", border: "1px solid rgba(145,71,255,0.2)", borderRadius: "10px", padding: "12px", marginBottom: "15px" }}>
      <div style={{ fontSize: "10px", color: "var(--purple)", fontWeight: 800 }}>REPRODUCIENDO</div>
      <div style={{ fontSize: "13px" }}>
        {FLAGS[current.idioma]} <strong>{current.usuario}</strong>: {current.mensaje}
      </div>
    </div>
  );
}

function QueueItem({ entry, position, onPlay }) {
  return (
    <div className="queue-item" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", background: "var(--bg2)", borderRadius: "8px", border: "1px solid var(--border)" }}>
      <span style={{ fontSize: "11px", color: "var(--text3)", width: "20px" }}>{position}</span>
      <span>{FLAGS[entry.idioma]}</span>
      <span style={{ color: "var(--purple)", fontWeight: 600, flex: 1 }}>{entry.usuario}</span>
      <span style={{ flex: 2, fontSize: "13px", color: "var(--text2)" }}>{entry.mensaje}</span>
      <button onClick={onPlay} style={{ background: "none", border: "none", cursor: "pointer" }}>{entry.reproduccion ? "✅" : "▶"}</button>
    </div>
  );
}

function LanguageBar({ lang, count, max }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
      <span style={{ width: "20px" }}>{FLAGS[lang]}</span>
      <div style={{ flex: 1, height: "6px", background: "var(--border)", borderRadius: "10px" }}>
        <div style={{ width: `${(count / max) * 100}%`, height: "100%", background: "var(--purple)", borderRadius: "10px" }} />
      </div>
      <span style={{ fontSize: "11px", color: "var(--text3)" }}>{count}</span>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card" style={{ padding: "15px" }}>
      <div style={{ fontSize: "11px", color: "var(--text3)" }}>{label}</div>
      <div style={{ fontSize: "20px", fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: "10px", color: "var(--text3)" }}>{sub}</div>
    </div>
  );
}

function PulseDot({ active }) {
  return (
    <span style={{ 
      width: "8px", height: "8px", borderRadius: "50%", 
      background: active ? "var(--green)" : "var(--red)",
      display: "inline-block" 
    }} />
  );
}

function btnStyle(bg, color) {
  return { background: bg, color, border: "none", padding: "4px 10px", borderRadius: "5px", cursor: "pointer", fontSize: "12px" };
}
