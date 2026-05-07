import { useState, useEffect, useRef, useCallback } from "react";

const BOT_WS_URL = import.meta.env.VITE_BOT_WS_URL || "ws://localhost:3000";
const BOT_API_URL = import.meta.env.VITE_BOT_API_URL || "http://localhost:3000";

const FLAGS = { es: "🇪🇸", en: "🇺🇸", ja: "🇯🇵", ru: "🇷🇺", pt: "🇧🇷" };
const LANG_NAMES = { es: "Español", en: "Inglés", ja: "Japonés", ru: "Ruso", pt: "Portugués" };
const COMANDOS = [
  { cmd: "!habla",    lang: "Español",  flag: "🇪🇸" },
  { cmd: "!speak",    lang: "Inglés",   flag: "🇺🇸" },
  { cmd: "!onichan",  lang: "Japonés",  flag: "🇯🇵" },
  { cmd: "!sukablad", lang: "Ruso",     flag: "🇷🇺" },
  { cmd: "!cr7",      lang: "Portugués",flag: "🇧🇷" },
  { cmd: "!paja",     lang: "El clásico", flag: "🥴" },
];

export default function TTSPanel() {
  const [cola, setCola] = useState([]);
  const [stats, setStats] = useState(null);
  const [botStats, setBotStats] = useState(null);
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmandoLimpiar, setConfirmandoLimpiar] = useState(false);
  const wsRef = useRef(null);

  // ── Carga de datos con Blindaje Total ──
  const fetchData = useCallback(async () => {
    try {
      const ttsRes = await fetch(`${BOT_API_URL}/cola`);
      if (!ttsRes.ok) throw new Error("Respuesta no exitosa");
      
      const resJson = await ttsRes.json();
      
      // Intentamos extraer la lista de mensajes de cualquier estructura posible
      let mensajesFinales = [];
      if (resJson) {
        if (Array.isArray(resJson)) {
          mensajesFinales = resJson;
        } else if (resJson.data && Array.isArray(resJson.data.mensajes)) {
          mensajesFinales = resJson.data.mensajes;
        } else if (Array.isArray(resJson.mensajes)) {
          mensajesFinales = resJson.mensajes;
        }
      }

      setCola(mensajesFinales);
      setStats(resJson?.data?.total || resJson?.stats || resJson?.total || null);

      // Stats del bot (independiente)
      try {
        const botRes = await fetch(`${BOT_API_URL}/stats`);
        if (botRes.ok) setBotStats(await botRes.json());
      } catch { setBotStats(null); }

    } catch (err) {
      console.error("Error en fetchData:", err.message);
      setCola([]); // Ante error, garantizamos array vacío
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── WebSocket ──
  useEffect(() => {
    let timeout;
    const conectar = () => {
      try {
        const ws = new WebSocket(BOT_WS_URL);
        wsRef.current = ws;
        ws.onopen = () => setWsStatus("connected");
        ws.onmessage = (e) => {
          try {
            const d = JSON.parse(e.data);
            if (d.tipo === "nuevo") { setCurrent(d); fetchData(); }
          } catch {}
        };
        ws.onclose = () => {
          setWsStatus("disconnected");
          timeout = setTimeout(conectar, 3000);
        };
        ws.onerror = () => wsRef.current?.close();
      } catch {
        timeout = setTimeout(conectar, 5000);
      }
    };
    conectar();
    return () => { wsRef.current?.close(); clearTimeout(timeout); };
  }, [fetchData]);

  // ── Acción Limpiar (Doble clic) ──
  async function manejarLimpiar() {
    if (!confirmandoLimpiar) {
      setConfirmandoLimpiar(true);
      setTimeout(() => setConfirmandoLimpiar(false), 3000);
      return;
    }

    try {
      const res = await fetch(`${BOT_API_URL}/cola`, { method: "DELETE" });
      if (res.ok) {
        setCola([]);
        setCurrent(null);
        setConfirmandoLimpiar(false);
        fetchData();
      }
    } catch (err) {
      console.error("Error al limpiar:", err);
      setConfirmandoLimpiar(false);
    }
  }

  const porIdioma = stats?.porIdioma || {};
  const wsClientes = botStats?.websocket?.total || 0;

  // Forzar que cola siempre sea iterable para el render
  const colaSegura = Array.isArray(cola) ? cola : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        <StatCard label="En cola" value={colaSegura.length} sub="mensajes pendientes" color="var(--purple)" />
        <StatCard label="OBS" value={wsClientes > 0 ? "ON" : "OFF"} sub={`${wsClientes} activos`} color={wsClientes > 0 ? "var(--green)" : "var(--red)"} />
        <StatCard label="WebSocket" value={wsStatus === "connected" ? "Online" : "Offline"} sub="Bot Status" color={wsStatus === "connected" ? "var(--green)" : "var(--red)"} />
        <StatCard label="Usuarios" value={stats?.usuariosUnicos ?? "—"} sub="únicos" color="var(--text1)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", alignItems: "start" }}>
        
        {/* Lado Izquierdo: Cola */}
        <div className="card">
          <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <PulseDot active={wsStatus === "connected"} /> COLA TTS
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={fetchData} style={btnStyle("var(--border)", "var(--text2)")}>↻</button>
              <button 
                onClick={manejarLimpiar} 
                style={btnStyle(confirmandoLimpiar ? "var(--red)" : "rgba(255,71,87,0.1)", confirmandoLimpiar ? "#fff" : "var(--red)")}
                disabled={colaSegura.length === 0 && !confirmandoLimpiar}
              >
                {confirmandoLimpiar ? "⚠️ ¿Seguro?" : "🗑 Limpiar cola"}
              </button>
            </div>
          </div>

          {current && (
            <div style={{ background: "rgba(145,71,255,0.08)", border: "1px solid rgba(145,71,255,0.2)", borderRadius: "8px", padding: "12px", marginBottom: "15px" }}>
              <div style={{ fontSize: "10px", color: "var(--purple)", fontWeight: 800 }}>REPRODUCIENDO</div>
              <div style={{ fontSize: "13px" }}>{FLAGS[current.idioma]} <strong>{current.usuario}</strong>: {current.mensaje}</div>
            </div>
          )}

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center" }}>Cargando...</div>
          ) : colaSegura.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text3)" }}>📭 Cola vacía</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {colaSegura.map((entry, i) => (
                <QueueItem key={entry.id || i} entry={entry} position={i + 1} />
              ))}
            </div>
          )}
        </div>

        {/* Lado Derecho: Info y Comandos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="card">
            <div className="card-title">IDIOMAS EN COLA</div>
            {Object.keys(FLAGS).map((lang) => (
              <LanguageRow key={lang} lang={lang} count={porIdioma[lang] || 0} max={Math.max(...Object.values(porIdioma), 1)} />
            ))}
          </div>

          <div className="card">
            <div className="card-title">COMANDOS</div>
            {COMANDOS.map((c) => (
              <div key={c.cmd} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: "13px", color: "var(--text1)" }}><strong>{c.flag} {c.cmd}</strong></span>
                <span style={{ fontSize: "11px", color: "var(--text3)" }}>{c.lang}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Componentes de Soporte ──

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
      <span style={{ fontSize: "13px", color: "var(--text2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.mensaje}</span>
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

function PulseDot({ active }) {
  return <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: active ? "var(--green)" : "var(--text3)", display: "inline-block" }} />;
}

function btnStyle(bg, color) {
  return { background: bg, color, border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600 };
}
