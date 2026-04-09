// src/pages/ChatControls.jsx
import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";

const TIMEOUT_PRESETS = [
  { label: "1 min", value: 60 },
  { label: "10 min", value: 600 },
  { label: "1 hora", value: 3600 },
  { label: "24h", value: 86400 },
  { label: "1 semana", value: 604800 },
];

const REASON_PRESETS = ["Spam", "Lenguaje ofensivo", "Acoso", "NSFW", "Publicidad", "Otro"];

export default function ChatControls() {
  const [username, setUsername] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState(null); // null = ban permanente
  const [preview, setPreview] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const debounceRef = useRef(null);

  // Historial de comandos
  useEffect(() => {
    api.get("/chat/history").then(({ data }) => setHistory(data.history || [])).catch(() => {});
  }, []);

  // Preview del usuario con debounce
  useEffect(() => {
    clearTimeout(debounceRef.current);
    setPreview(null);
    if (username.length < 2) return;
    debounceRef.current = setTimeout(async () => {
      setLoadingUser(true);
      try {
        const { data } = await api.get(`/chat/user/${username}`);
        if (data.success) setPreview(data.user);
      } catch {
        setPreview({ not_found: true });
      } finally {
        setLoadingUser(false);
      }
    }, 500);
  }, [username]);

  const handleAction = async (action) => {
    if (!username.trim()) return;
    setSending(true);
    setResult(null);
    setShowConfirm(false);
    try {
      let res;
      if (action === "unban") {
        res = await api.post("/chat/unban", { user_login: username.trim() });
      } else {
        const body = { user_login: username.trim(), reason };
        if (action === "timeout" && duration) body.duration = duration;
        res = await api.post("/chat/ban", body);
      }
      setResult({ type: "success", msg: res.data.message });
      setUsername("");
      setReason("");
      setPreview(null);
      // Refrescar historial
      api.get("/chat/history").then(({ data }) => setHistory(data.history || [])).catch(() => {});
    } catch (err) {
      setResult({ type: "error", msg: err.response?.data?.error || "Error al ejecutar comando" });
    } finally {
      setSending(false);
    }
  };

  const commandText = () => {
    if (!username) return "";
    if (duration) return `/timeout ${username} ${duration} ${reason}`.trim();
    return `/ban ${username} ${reason}`.trim();
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", alignItems: "start" }}>

      {/* Panel principal */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Buscar usuario */}
        <div className="card">
          <div className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Comando de moderación
          </div>

          {/* Input usuario */}
          <div style={{ marginBottom: "12px" }}>
            <div className="field-label">Usuario</div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text3)", fontSize: "14px" }}>@</span>
              <input
                className="field-input"
                style={{ paddingLeft: "26px" }}
                value={username}
                onChange={(e) => setUsername(e.target.value.replace("@", ""))}
                placeholder="nombre_de_usuario"
                autoComplete="off"
              />
            </div>

            {/* Preview del usuario */}
            {loadingUser && (
              <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text3)" }}>Buscando...</div>
            )}
            {preview && !preview.not_found && (
              <div style={{
                marginTop: "8px", display: "flex", alignItems: "center", gap: "10px",
                padding: "8px 12px", background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
              }}>
                <img src={preview.profile_image_url} alt="" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>{preview.display_name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text3)" }}>
                    Cuenta creada: {new Date(preview.created_at).toLocaleDateString("es-CO")}
                    {preview.is_banned && <span style={{ marginLeft: "8px", color: "var(--red)", fontWeight: 600 }}>· Ya baneado</span>}
                  </div>
                </div>
              </div>
            )}
            {preview?.not_found && (
              <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--red)" }}>Usuario no encontrado</div>
            )}
          </div>

          {/* Razón */}
          <div style={{ marginBottom: "12px" }}>
            <div className="field-label">Razón</div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "6px" }}>
              {REASON_PRESETS.map((r) => (
                <button key={r} onClick={() => setReason(r)} style={{
                  padding: "3px 10px", borderRadius: "100px", fontSize: "11px", cursor: "pointer",
                  background: reason === r ? "var(--purple-dim)" : "var(--surface)",
                  border: `1px solid ${reason === r ? "var(--purple-border)" : "var(--border)"}`,
                  color: reason === r ? "var(--purple)" : "var(--text2)",
                }}>{r}</button>
              ))}
            </div>
            <input
              className="field-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Razón personalizada..."
            />
          </div>

          {/* Tipo de acción */}
          <div style={{ marginBottom: "16px" }}>
            <div className="field-label">Tipo</div>
            <div className="tabs">
              <button className={`tab ${duration === null ? "active" : ""}`} onClick={() => setDuration(null)}>
                Ban permanente
              </button>
              <button className={`tab ${duration !== null ? "active" : ""}`} onClick={() => setDuration(600)}>
                Timeout
              </button>
            </div>

            {duration !== null && (
              <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                {TIMEOUT_PRESETS.map((p) => (
                  <button key={p.value} onClick={() => setDuration(p.value)} style={{
                    padding: "5px 12px", borderRadius: "var(--radius-sm)", fontSize: "12px", cursor: "pointer",
                    background: duration === p.value ? "var(--purple)" : "var(--surface)",
                    border: `1px solid ${duration === p.value ? "var(--purple)" : "var(--border)"}`,
                    color: duration === p.value ? "white" : "var(--text2)",
                  }}>{p.label}</button>
                ))}
              </div>
            )}
          </div>

          {/* Preview del comando */}
          {username && (
            <div style={{
              marginBottom: "14px", padding: "10px 14px",
              background: "rgba(0,0,0,0.3)", borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--cyan)",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <span>{commandText()}</span>
              <button onClick={() => navigator.clipboard.writeText(commandText())} style={{
                background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: "11px"
              }}>Copiar</button>
            </div>
          )}

          {/* Resultado */}
          {result && (
            <div style={{
              marginBottom: "12px", padding: "10px 14px", borderRadius: "var(--radius-sm)",
              background: result.type === "success" ? "rgba(46,204,113,0.1)" : "rgba(255,71,87,0.1)",
              border: `1px solid ${result.type === "success" ? "rgba(46,204,113,0.3)" : "rgba(255,71,87,0.3)"}`,
              color: result.type === "success" ? "var(--green)" : "var(--red)",
              fontSize: "13px",
            }}>{result.msg}</div>
          )}

          {/* Botones */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!username.trim() || sending || preview?.not_found}
              className="save-btn"
              style={{ flex: 2, background: duration === null ? "#FF4757" : "#FF8C00" }}
            >
              {sending ? "Enviando..." : duration === null ? "🔨 Banear" : `⏱ Timeout ${TIMEOUT_PRESETS.find(p => p.value === duration)?.label}`}
            </button>
            <button
              onClick={() => handleAction("unban")}
              disabled={!username.trim() || sending}
              className="save-btn"
              style={{ flex: 1, background: "rgba(46,204,113,0.15)", color: "var(--green)", border: "1px solid rgba(46,204,113,0.3)" }}
            >
              Unban
            </button>
          </div>

          {/* Confirm modal */}
          {showConfirm && (
            <div style={{
              marginTop: "12px", padding: "14px",
              background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.3)",
              borderRadius: "var(--radius-sm)",
            }}>
              <div style={{ fontSize: "13px", marginBottom: "10px" }}>
                ¿Confirmas {duration === null ? "banear" : `timeout`} a <strong>@{username}</strong>?
                {reason && <span style={{ color: "var(--text3)" }}> · {reason}</span>}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => handleAction(duration === null ? "ban" : "timeout")}
                  style={{ padding: "6px 16px", background: "var(--red)", border: "none", borderRadius: "6px", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
                  Confirmar
                </button>
                <button onClick={() => setShowConfirm(false)}
                  style={{ padding: "6px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text2)", cursor: "pointer", fontSize: "13px" }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Historial de comandos */}
      <div className="card">
        <div className="card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          Últimos comandos
        </div>
        {history.length === 0 ? (
          <div className="empty-state"><p>Sin comandos aún</p></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {history.map((cmd, i) => (
              <div key={i} style={{
                padding: "8px 10px", background: "var(--surface)", borderRadius: "var(--radius-sm)",
                borderLeft: `3px solid ${cmd.action === "unban" ? "var(--green)" : cmd.duration ? "#FF8C00" : "var(--red)"}`,
                cursor: "pointer",
              }} onClick={() => setUsername(cmd.user_login)}>
                <div style={{ fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--cyan)" }}>
                  {cmd.action === "unban" ? "/unban" : cmd.duration ? "/timeout" : "/ban"} @{cmd.user_login}
                </div>
                {cmd.reason && <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "2px" }}>{cmd.reason}</div>}
                <div style={{ fontSize: "10px", color: "var(--text3)", marginTop: "2px" }}>
                  {new Date(cmd.executed_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}