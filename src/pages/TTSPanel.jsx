import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const LANGUAGES = { es: "Español", en: "Inglés", ja: "Japonés", ru: "Ruso", pt: "Portugués" };
const getError = (error, fallback) => error?.response?.data?.error || error?.message || fallback;

function formatAge(value) {
  if (!value) return "Sin espera";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export default function TTSPanel() {
  const { user } = useAuth();
  const hasOverview = useRef(false);
  const [overview, setOverview] = useState(null);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [message, setMessage] = useState("");
  const [voice, setVoice] = useState("auto");
  const [action, setAction] = useState("speak");
  const [sending, setSending] = useState(false);
  const [clearArmed, setClearArmed] = useState(false);
  const [serviceAction, setServiceAction] = useState(null);
  const [serviceBusy, setServiceBusy] = useState(false);

  const loadOverview = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setRefreshing(true);
    try {
      const { data } = await api.get("/bots/tts/overview");
      hasOverview.current = true;
      setOverview(data);
      setStale(false);
      setNotice((current) => current?.type === "success" ? current : null);
    } catch (error) {
      setStale(true);
      const suffix = hasOverview.current ? " Los datos anteriores quedan marcados como no verificados." : "";
      setNotice({ type: "error", text: `${getError(error, "No se pudo conectar con TTS Bot.")}${suffix}` });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") loadOverview({ silent: true });
    }, 20_000);
    return () => window.clearInterval(timer);
  }, [loadOverview]);

  const capabilities = overview?.capabilities || {};
  const queue = Array.isArray(overview?.queue?.mensajes) ? overview.queue.mensajes : [];
  const stats = overview?.stats || {};
  const queueStats = stats.cola || {};
  const voices = Array.isArray(capabilities.voices) ? capabilities.voices : [];
  const maxMessage = Number(capabilities.maxMessage) || 500;
  const currentId = stats.playback?.activoId || null;
  const provider = stats.tts?.provider || "No informado";
  const languageRows = useMemo(() => Object.entries(LANGUAGES).map(([id, label]) => ({
    id, label, count: queueStats.porIdioma?.[id] || 0,
  })), [queueStats.porIdioma]);

  async function submitMessage(event) {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage) return;
    setSending(true);
    setNotice(null);
    try {
      const { data } = await api.post("/bots/tts/messages", { message: cleanMessage, voice, action });
      setMessage("");
      setNotice({ type: "success", text: `Mensaje añadido${data.position ? ` en la posición ${data.position}` : ""}.` });
      await loadOverview({ silent: true });
    } catch (error) {
      setNotice({ type: "error", text: getError(error, "No se pudo enviar el mensaje.") });
    } finally {
      setSending(false);
    }
  }

  async function clearQueue() {
    if (!clearArmed) {
      setClearArmed(true);
      window.setTimeout(() => setClearArmed(false), 4_000);
      return;
    }
    setRefreshing(true);
    try {
      const { data } = await api.delete("/bots/tts/queue");
      const removed = Array.isArray(data.eliminados) ? data.eliminados.length : queue.length;
      setNotice({ type: "success", text: `Cola limpiada: ${removed} mensaje${removed === 1 ? "" : "s"}.` });
      setClearArmed(false);
      await loadOverview({ silent: true });
    } catch (error) {
      setNotice({ type: "error", text: getError(error, "No se pudo limpiar la cola.") });
    } finally {
      setRefreshing(false);
    }
  }

  async function manageService() {
    if (!serviceAction) return;
    setServiceBusy(true);
    try {
      await api.post(`/bots/tts/service/${serviceAction}`);
      setNotice({ type: "success", text: serviceAction === "restart" ? "Reinicio solicitado." : "Suspensión solicitada." });
      setServiceAction(null);
    } catch (error) {
      setNotice({ type: "error", text: getError(error, "No se pudo gestionar el servicio.") });
    } finally {
      setServiceBusy(false);
    }
  }

  if (loading && !overview) return <PanelLoading label="Cargando la operación de TTS Bot" />;
  if (!overview) return <PanelUnavailable message={notice?.text} onRetry={() => loadOverview()} busy={refreshing} />;

  return (
    <section className={`bot-panel tts-panel ${stale ? "is-stale" : ""}`} aria-label="Operación de TTS Bot">
      {notice && <Notice notice={notice} onClose={() => setNotice(null)} />}

      <div className="bot-metrics" aria-label="Estado de TTS Bot">
        <Metric label="En cola" value={queue.length} detail={`${queueStats.generando || 0} generando`} icon="queue" />
        <Metric label="Reproductor OBS" value={stale ? "No verificado" : (stats.websocket?.total || 0) > 0 ? "Conectado" : "Sin cliente"} detail={stale ? "Último estado conservado" : `${stats.websocket?.total || 0} cliente(s)`} icon="monitor" state={stale ? "bad" : (stats.websocket?.total || 0) > 0 ? "good" : "muted"} />
        <Metric label="Servicio" value={stale ? "Sin conexión" : overview.online ? "Online" : "Offline"} detail={stale ? "Datos anteriores" : `Proveedor ${provider}`} icon="pulse" state={!stale && overview.online ? "good" : "bad"} />
        <Metric label="Usuarios" value={queueStats.usuariosUnicos || 0} detail={`Espera mayor ${formatAge(queueStats.masAntiguo)}`} icon="users" />
      </div>

      <div className="tts-workspace">
        <div className="bot-primary-stack">
          <article className="card bot-compose-card">
            <div className="bot-card-heading bot-card-heading-row">
              <div><h2>Enviar al TTS</h2><p>Emisión autenticada a nombre de {user?.display_name || "tu cuenta de Twitch"}.</p></div>
              <span className="bot-identity-chip">{user?.display_name || "Moderador"}</span>
            </div>
            <form className="tts-compose-form" onSubmit={submitMessage}>
              <fieldset className="bot-segmented">
                <legend>Acción</legend>
                {(capabilities.actions || ["speak", "ask"]).map((item) => (
                  <label key={item}><input type="radio" name="tts-action" checked={action === item} onChange={() => setAction(item)} /><span>{item === "ask" ? "Preguntar a IA" : "Hablar"}</span></label>
                ))}
              </fieldset>
              <label className="bot-field"><span>Voz</span><select value={voice} onChange={(event) => setVoice(event.target.value)}>
                {voices.length === 0 && <option value="auto">Automática</option>}
                {voices.map((item) => <option key={item.id} value={item.id}>{item.label || item.id}</option>)}
              </select></label>
              <label className="bot-field tts-message-field"><span>Mensaje</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={maxMessage} placeholder={action === "ask" ? "Escribe una pregunta para la IA…" : "Escribe el mensaje que debe sonar en stream…"} rows="4" /><small>{message.length}/{maxMessage}</small></label>
              <div className="bot-form-footer"><span>Cooldown del panel: {capabilities.cooldownSeconds || 0}s</span><button className="save-btn bot-submit" type="submit" disabled={sending || stale || !message.trim()}><SendIcon />{sending ? "Enviando…" : action === "ask" ? "Enviar pregunta" : "Enviar mensaje"}</button></div>
            </form>
          </article>

          <article className="card bot-queue-card">
            <div className="bot-card-heading bot-card-heading-row">
              <div><h2>Cola de reproducción</h2><p>Orden FIFO actualizado desde el servicio.</p></div>
              <div className="bot-actions">
                <button className="refresh-btn" type="button" onClick={() => loadOverview()} disabled={refreshing}><RefreshIcon />{refreshing ? "Actualizando" : "Actualizar"}</button>
                <button className={`bot-danger-button ${clearArmed ? "armed" : ""}`} type="button" onClick={clearQueue} disabled={queue.length === 0 || refreshing || stale}><TrashIcon />{clearArmed ? "Confirmar limpieza" : "Limpiar cola"}</button>
              </div>
            </div>
            {queue.length === 0 ? <EmptyState /> : <div className="bot-table-wrap"><table className="bot-table">
              <thead><tr><th>Pos.</th><th>Usuario</th><th>Mensaje</th><th>Voz</th><th>Estado</th></tr></thead>
              <tbody>{queue.map((entry, index) => <tr key={entry.id || `${entry.usuario}-${index}`} className={entry.id === currentId ? "is-playing" : ""}>
                <td><span className="queue-position">{index + 1}</span></td><td><strong>{entry.usuario || "Anónimo"}</strong></td><td><span className="queue-message">{entry.mensaje}</span></td><td>{LANGUAGES[entry.idioma] || entry.idioma || "Auto"}</td><td><StatePill state={entry.id === currentId ? "playing" : entry.estado} /></td>
              </tr>)}</tbody>
            </table></div>}
          </article>
        </div>

        <aside className="bot-side-stack">
          <article className="card bot-language-card">
            <div className="bot-card-heading"><h2>Top usuarios</h2><p>Mensajes en la cola actual.</p></div>
            <div className="language-list">{Object.entries(queue.reduce((counts, entry) => {
              const name = entry.usuario || "Anónimo";
              counts[name] = (counts[name] || 0) + 1;
              return counts;
            }, Object.create(null))).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count], index, rows) => (
              <div key={name}><span>{name}</span><div><i style={{ width: `${(count / rows[0][1]) * 100}%` }} /></div><strong>{count}</strong></div>
            ))}</div>
            {queue.length === 0 && <p>Sin mensajes pendientes.</p>}
          </article>
          <article className="card bot-runtime-card"><div className="bot-card-heading"><h2>Motor de voz</h2></div><dl className="bot-detail-list">
            <div><dt>Proveedor</dt><dd>{provider}</dd></div><div><dt>Listos</dt><dd>{queueStats.listo || 0}</dd></div><div><dt>Generando</dt><dd>{queueStats.generando || 0}</dd></div><div><dt>Instancia</dt><dd className="mono">{stats.instancia || "—"}</dd></div>
          </dl></article>
          <article className="card bot-language-card"><div className="bot-card-heading"><h2>Idiomas</h2><p>Distribución de la cola actual.</p></div><div className="language-list">{languageRows.map((item) => <div key={item.id}><span>{item.label}</span><div><i style={{ width: `${queue.length ? Math.max(6, (item.count / queue.length) * 100) : 0}%` }} /></div><strong>{item.count}</strong></div>)}</div></article>
          {user?.role === "admin" && <article className="card bot-service-card">
            <div className="bot-card-heading"><h2>Servicio</h2><p>Solo administradores. Estas acciones afectan la instancia completa.</p></div>
            {serviceAction ? <div className="bot-confirm-box" role="alert"><strong>{serviceAction === "restart" ? "¿Reiniciar el bot?" : "¿Suspender el bot?"}</strong><span>{serviceAction === "restart" ? "Puede tardar cerca de un minuto en volver." : "Tendrás que reanudarlo desde el proveedor de hosting."}</span><div><button type="button" onClick={() => setServiceAction(null)} disabled={serviceBusy}>Cancelar</button><button type="button" onClick={manageService} disabled={serviceBusy}>{serviceBusy ? "Procesando…" : "Confirmar"}</button></div></div> : <div className="bot-service-actions"><button type="button" onClick={() => setServiceAction("restart")} disabled={stale}><RefreshIcon />Reiniciar</button><button type="button" className="danger" onClick={() => setServiceAction("suspend")} disabled={stale}><StopIcon />Suspender</button></div>}
          </article>}
        </aside>
      </div>
    </section>
  );
}

function Metric({ label, value, detail, icon, state = "" }) { return <article className={`bot-metric ${state}`}><div className="bot-metric-icon"><MetricIcon name={icon} /></div><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
function StatePill({ state }) { const labels = { playing: "Reproduciendo", listo: "Listo", generando: "Generando", finalized: "Finalizado" }; return <span className={`bot-state-pill ${state || "pending"}`}>{labels[state] || "Pendiente"}</span>; }
function PanelLoading({ label }) { return <div className="card bot-loading" role="status"><span className="spinner" /><p>{label}…</p></div>; }
function PanelUnavailable({ message, onRetry, busy }) { return <div className="card bot-unavailable" role="alert"><StatusIcon type="error" /><div><h2>TTS Bot no está disponible</h2><p>{message || "Revisa la URL y el token de la integración en el backend."}</p></div><button className="refresh-btn" type="button" onClick={onRetry} disabled={busy}><RefreshIcon />Reintentar</button></div>; }
function Notice({ notice, onClose }) { return <div className={`bot-notice ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}><StatusIcon type={notice.type} /><span>{notice.text}</span><button type="button" onClick={onClose} aria-label="Cerrar aviso"><CloseIcon /></button></div>; }
function EmptyState() { return <div className="bot-empty"><QueueIcon /><strong>La cola está vacía</strong><p>Los mensajes enviados desde Twitch o desde este panel aparecerán aquí.</p></div>; }
function MetricIcon({ name }) {
  if (name === "monitor") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
  if (name === "pulse") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12h4l2-7 4 14 2-7h6"/></svg>;
  if (name === "users") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  return <QueueIcon />;
}
function QueueIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="3" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="3" cy="18" r="1" fill="currentColor" stroke="none"/></svg>; }
function RefreshIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5"/></svg>; }
function TrashIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/></svg>; }
function StopIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>; }
function SendIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>; }
function CloseIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18"/></svg>; }
function StatusIcon({ type }) { return type === "success" ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/></svg>; }
