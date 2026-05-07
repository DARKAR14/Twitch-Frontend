// src/pages/TTSPanel.jsx
import { useState, useEffect, useRef, useCallback } from "react";

const BOT_WS_URL = import.meta.env.VITE_BOT_WS_URL || "ws://localhost:3000";
const BOT_API_URL = import.meta.env.VITE_BOT_API_URL || "http://localhost:3000";

const FLAGS = { es: "🇪🇸", en: "🇺🇸", ja: "🇯🇵", ru: "🇷🇺", pt: "🇧🇷" };
const COMANDOS = [
  { cmd: "!habla",    lang: "Español",  flag: "🇪🇸" },
  { cmd: "!speak",    lang: "Inglés",   flag: "🇺🇸" },
  { cmd: "!onichan",  lang: "Japonés",  flag: "🇯🇵" },
  { cmd: "!sukablad", lang: "Ruso",     flag: "🇷🇺" },
  { cmd: "!cr7",      flag: "🇧🇷",       lang: "Portugués" },
  { cmd: "!paja",     flag: "🥴",       lang: "El clásico" },
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

  // ── Estado para el Modal Personalizado ──
  const [modalConfig, setModalConfig] = useState({ show: false, accion: null, titulo: "", mensaje: "", cargando: false });

  // ── Carga de datos blindada ──
  const fetchData = useCallback(async () => {
    try {
      const ttsRes = await fetch(`${BOT_API_URL}/cola`);
      if (!ttsRes.ok) throw new Error();
      
      const resJson = await ttsRes.json();
      
      // Validación de mensajes (Evita el error .map)
      const mensajesExtraidos = resJson.data?.mensajes || resJson.mensajes || [];
      setCola(Array.isArray(mensajesExtraidos) ? mensajesExtraidos : []);
      setStats(resJson.data?.total || resJson.stats || resJson.total || null);

      // Stats independientes del bot
      const botRes = await fetch(`${BOT_API_URL}/stats`);
      if (botRes.ok) setBotStats(await botRes.json());
    } catch (err) {
      console.error("Fallo en carga:", err);
      setCola([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── WebSocket ──
  useEffect(() => {
    let t;
    const conectar = () => {
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
        t = setTimeout(conectar, 3000);
      };
    };
    conectar();
    return () => { wsRef.current?.close(); clearTimeout(t); };
  }, [fetchData]);

  // ── Acciones de Cola (Doble clic) ──
  const manejarLimpiar = async () => {
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
    } catch (e) {
      setConfirmandoLimpiar(false);
    }
  };

  // ── Lógica de Modal ──
  const abrirModal = (tipo) => {
    if (tipo === 'restart') {
      setModalConfig({
        show: true,
        accion: 'restart',
        titulo: "¿Deseas reiniciar el bot?",
        mensaje: "El proceso tardará aproximadamente entre 40 y 60 segundos en volver a estar online.",
        cargando: false
      });
    } else {
      setModalConfig({
        show: true,
        accion: 'suspend',
        titulo: "¿Suspender el servicio?",
        mensaje: "Solo el propietario puede iniciarlo de nuevo desde el Dashboard de Render.",
        cargando: false
      });
    }
  };

  const confirmarAccionRender = async () => {
    const { accion } = modalConfig;
    setModalConfig({ ...modalConfig, cargando: true });
    
    try {
      const res = await fetch(`${BOT_API_URL}/admin/servicio/${accion}`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // En lugar de alert(), cerramos el modal con éxito
      setModalConfig({ ...modalConfig, show: false, cargando: false });
    } catch (err) {
      setModalConfig({ ...modalConfig, titulo: "Error", mensaje: "No se pudo conectar con el bot.", cargando: false });
      setTimeout(() => setModalConfig({ ...modalConfig, show: false }), 2000);
    }
  };

  const colaSegura = Array.isArray(cola) ? cola : [];
  const porIdioma = stats?.porIdioma || {};
  const wsClientes = botStats?.websocket?.total || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", position: "relative" }}>
      
      {/* Modal Personalizado */}
      {modalConfig.show && (
        <div style={overlayStyle}>
          <div className="card" style={modalStyle}>
            <h3 style={{ marginTop: 0, color: "var(--purple)" }}>{modalConfig.titulo}</h3>
            <p style={{ color: "var(--text2)", fontSize: "14px", lineHeight: "1.5" }}>{modalConfig.mensaje}</p>
            
            <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
              {!modalConfig.cargando ? (
                <>
                  <button onClick={() => setModalConfig({ ...modalConfig, show: false })} style={btnStyle("var(--bg2)", "var(--text3)")}>Cancelar</button>
                  <button onClick={confirmarAccionRender} style={btnStyle("var(--purple)", "#fff")}>Confirmar</button>
                </>
              ) : (
                <span style={{ color: "var(--purple)", fontSize: "12px", fontWeight: "bold" }}>Procesando...</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Indicadores Superiores */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        <StatCard label="En cola" value={colaSegura.length} sub="mensajes pendientes" color="var(--purple)" />
        <StatCard label="OBS" value={wsClientes > 0 ? "ON" : "OFF"} sub={`${wsClientes} activos`} color={wsClientes > 0 ? "var(--green)" : "var(--red)"} />
        <StatCard label="Bot Status" value={wsStatus === "connected" ? "Online" : "Offline"} sub="WebSocket" color={wsStatus === "connected" ? "var(--green)" : "var(--red)"} />
        <StatCard label="Usuarios" value={stats?.usuariosUnicos ?? "—"} sub="únicos hoy" color="var(--text1)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", alignItems: "start" }}>
        
        {/* Panel Izquierdo: La Cola (MÁS AMPLIA) */}
        <div className="card" style={{ minHeight: "550px" }}>
          <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span><PulseDot active={wsStatus === "connected"} /> COLA TTS</span>
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
              {colaSegura.map((e, i) => (
                <QueueItem key={e.id || i} entry={e} position={i + 1} />
              ))}
            </div>
          )}
        </div>

        {/* Panel Derecho */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          
          <div className="card">
            <div className="card-title">IDIOMAS</div>
            {Object.keys(FLAGS).map(l => (
              <LanguageRow key={l} lang={l} count={porIdioma[l] || 0} max={Math.max(...Object.values(porIdioma), 1)} />
            ))}
          </div>

          <div className="card">
            <div className="card-title">COMANDOS</div>
            {COMANDOS.map(c => (
              <div key={c.cmd} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: "13px" }}>{c.flag} <strong>{c.cmd}</strong></span>
                <span style={{ fontSize: "11px", color: "var(--text3)" }}>{c.lang}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title">GESTIÓN DE SERVICIO</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" }}>
              <button onClick={() => abrirModal('restart')} style={btnStyle("rgba(145,71,255,0.15)", "var(--purple)")}>↻ Reiniciar</button>
              <button onClick={() => abrirModal('suspend')} style={btnStyle("rgba(255,71,87,0.15)", "var(--red)")}>🛑 Parar Bot</button>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '10px', textAlign: 'center' }}>
              * Al parar el bot, deberá iniciarse manualmente desde Render.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Estilos para el Modal ──
const overlayStyle = {
  position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
  backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center",
  alignItems: "center", zIndex: 1000, backdropFilter: "blur(6px)"
};

const modalStyle = {
  width: "420px", padding: "24px", border: "1px solid var(--border)",
  boxShadow: "0 20px 50px rgba(0,0,0,0.5)", animation: "modalIn 0.3s ease"
};

// ── Componentes de UI ──
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
  return { background: bg, color, border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 700, transition: "0.2s" };
}
