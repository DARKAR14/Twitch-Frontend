import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import RisitasBirthdays from "./RisitasBirthdays";

const getError = (error, fallback) => error?.response?.data?.error || error?.message || fallback;

function formatUptime(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3_600);
  if (days) return `${days}d ${hours}h`;
  return `${hours}h ${Math.floor((total % 3_600) / 60)}m`;
}

function readableDiscordText(value) {
  return String(value || "").replace(/<@&\d+>/g, "@Cumpleaños").replace(/<@!?\d+>/g, "@Usuario").replace(/<#\d+>/g, "#canal");
}

export default function RisitasPanel() {
  const [view, setView] = useState("commands");
  const [birthdayOpened, setBirthdayOpened] = useState(false);
  return <section aria-label="Risitas Bot">
    <nav className="risitas-nav" aria-label="Vistas de Risitas Bot">
      <button type="button" aria-current={view === "commands" ? "page" : undefined} onClick={() => setView("commands")}>Comandos y estado</button>
      <button type="button" aria-current={view === "birthdays" ? "page" : undefined} onClick={() => { setBirthdayOpened(true); setView("birthdays"); }}>Cumpleaños · Editor de embed</button>
    </nav>
    <div hidden={view !== "commands"}><RisitasOverview /></div>
    {birthdayOpened && <div hidden={view !== "birthdays"}><RisitasBirthdays /></div>}
  </section>;
}

function RisitasOverview() {
  const hasOverview = useRef(false);
  const [overview, setOverview] = useState(null);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState(new Set());
  const [syncing, setSyncing] = useState(false);

  const loadOverview = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setRefreshing(true);
    try {
      const { data } = await api.get("/bots/risitas/overview");
      hasOverview.current = true;
      setOverview(data);
      setStale(false);
      setNotice((current) => current?.type === "error" ? null : current);
    } catch (error) {
      setStale(true);
      const suffix = hasOverview.current ? " Los datos anteriores quedan marcados como no verificados." : "";
      setNotice({ type: "error", text: `${getError(error, "No se pudo conectar con Risitas Bot.")}${suffix}` });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") loadOverview({ silent: true });
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [loadOverview]);

  const status = overview?.status || {};
  const commands = Array.isArray(overview?.commands) ? overview.commands : [];
  const enabledCount = commands.filter((command) => command.enabled).length;
  const commandNeedle = search.trim().toLocaleLowerCase("es");
  const filteredCommands = commandNeedle
    ? commands.filter((command) => `${command.name} ${command.description} ${command.module}`.toLocaleLowerCase("es").includes(commandNeedle))
    : commands;

  async function toggleCommand(command) {
    const nextEnabled = !command.enabled;
    setUpdating((current) => new Set(current).add(command.name));
    try {
      const { data } = await api.patch(`/bots/risitas/commands/${encodeURIComponent(command.name)}`, { enabled: nextEnabled });
      const updated = data.command || { ...command, enabled: nextEnabled };
      setOverview((current) => ({ ...current, commands: current.commands.map((item) => item.name === command.name ? { ...item, ...updated } : item) }));
      setNotice({ type: "success", text: `Comando /${command.name} ${nextEnabled ? "activado" : "desactivado"}.` });
    } catch (error) {
      setNotice({ type: "error", text: getError(error, `No se pudo actualizar /${command.name}.`) });
    } finally {
      setUpdating((current) => { const next = new Set(current); next.delete(command.name); return next; });
    }
  }

  async function syncCommands() {
    setSyncing(true);
    try {
      const { data } = await api.post("/bots/risitas/commands/sync");
      setNotice({ type: "success", text: `${data.synced ?? data.commands?.length ?? 0} comandos sincronizados con Discord.` });
      await loadOverview({ silent: true });
    } catch (error) {
      setNotice({ type: "error", text: getError(error, "No se pudieron sincronizar los comandos.") });
    } finally {
      setSyncing(false);
    }
  }

  if (loading && !overview) return <div className="card bot-loading" role="status"><span className="spinner" /><p>Cargando Risitas Bot…</p></div>;
  if (!overview) return <div className="card bot-unavailable" role="alert"><AlertIcon /><div><h2>Risitas Bot no está disponible</h2><p>{notice?.text || "Revisa la URL y la API key configuradas en el backend."}</p></div><button className="refresh-btn" type="button" onClick={() => loadOverview()} disabled={refreshing}><RefreshIcon />Reintentar</button></div>;

  const birthday = overview.birthday_embed || {};
  const embed = birthday.embed || {};
  const imageUrl = embed.image?.url;
  const thumbnailUrl = embed.thumbnail?.url;
  const placeholders = Array.isArray(birthday.placeholders)
    ? birthday.placeholders
    : Object.keys(birthday.placeholders || {});

  return (
    <section className={`bot-panel risitas-panel ${stale ? "is-stale" : ""}`} aria-label="Operación de Risitas Bot">
      {notice && <div className={`bot-notice ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>{notice.type === "error" ? <AlertIcon /> : <CheckIcon />}<span>{notice.text}</span><button type="button" onClick={() => setNotice(null)} aria-label="Cerrar aviso"><CloseIcon /></button></div>}

      <div className="bot-metrics" aria-label="Estado de Risitas Bot">
        <Metric label="Discord" value={stale ? "Sin conexión" : status.discord_connected ? "Conectado" : "Offline"} detail={stale ? "Último estado no verificado" : status.bot?.name || "Sin identidad"} icon="discord" state={!stale && status.discord_connected ? "good" : "bad"} />
        <Metric label="Latencia" value={stale ? "—" : Number.isFinite(status.latency_ms) ? `${Math.round(status.latency_ms)} ms` : "—"} detail={stale ? "Sin medición actual" : "Gateway de Discord"} icon="latency" />
        <Metric label="Servidores" value={status.guilds ?? 0} detail="Guilds conectadas" icon="server" />
        <Metric label="Comandos" value={`${enabledCount}/${commands.length}`} detail={`Uptime ${formatUptime(status.uptime_seconds)}`} icon="command" />
      </div>

      <div className="risitas-workspace">
        <article className="card risitas-command-card">
          <div className="bot-card-heading bot-card-heading-row">
            <div><h2>Comandos de Discord</h2><p>Control remoto para activar o pausar funciones sin reiniciar el proceso.</p></div>
            <div className="bot-actions"><button className="refresh-btn" type="button" onClick={() => loadOverview()} disabled={refreshing}><RefreshIcon />{refreshing ? "Actualizando" : "Actualizar"}</button><button className="save-btn risitas-sync-button" type="button" onClick={syncCommands} disabled={syncing || stale}><SyncIcon />{syncing ? "Sincronizando…" : "Sincronizar"}</button></div>
          </div>
          <label className="bot-search-field"><SearchIcon /><span className="sr-only">Buscar comandos</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por comando, módulo o descripción" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Limpiar búsqueda"><CloseIcon /></button>}</label>

          {commands.length === 0 ? <div className="bot-empty"><CommandIcon /><strong>No hay comandos registrados</strong><p>Sincroniza el árbol de comandos para publicarlos en Discord.</p></div> : filteredCommands.length === 0 ? <div className="bot-empty compact"><SearchIcon /><strong>Sin resultados</strong><p>Prueba con otro nombre o módulo.</p></div> : <div className="risitas-command-list">
            {filteredCommands.map((command) => {
              const busy = updating.has(command.name);
              return <div className="risitas-command-row" key={command.name}><div className="risitas-command-glyph"><CommandIcon /></div><div className="risitas-command-copy"><div><strong>/{command.name}</strong><span>{command.type || "slash"}</span></div><p>{command.description || "Sin descripción"}</p><small>{command.module || "Módulo principal"}</small></div><button className={`bot-switch ${command.enabled ? "enabled" : ""}`} type="button" role="switch" aria-checked={Boolean(command.enabled)} aria-label={`${command.enabled ? "Desactivar" : "Activar"} comando ${command.name}`} onClick={() => toggleCommand(command)} disabled={busy || stale}><span /></button></div>;
            })}
          </div>}
        </article>

        <aside className="bot-side-stack">
          <article className="card risitas-identity-card"><span className={`bot-connection-dot ${!stale && status.discord_connected ? "online" : ""}`} />{status.bot?.avatar_url ? <img src={status.bot.avatar_url} alt={`Avatar de ${status.bot.name || "Risitas Bot"}`} /> : <div className="risitas-avatar-fallback"><BotIcon /></div>}<h2>{status.bot?.name || "Risitas Bot"}</h2><p>{stale ? "Sesión no verificada" : status.discord_connected ? "Sesión de Discord operativa" : "Sesión de Discord desconectada"}</p><dl className="bot-detail-list"><div><dt>ID</dt><dd className="mono">{status.bot?.id || "—"}</dd></div><div><dt>Comandos API</dt><dd>{status.commands_total ?? commands.length}</dd></div><div><dt>Activos</dt><dd>{status.commands_enabled ?? enabledCount}</dd></div></dl></article>
          <article className="card birthday-preview-card">
            <div className="bot-card-heading"><h2>Embed de cumpleaños</h2><p>Vista previa generada por la API.</p></div>
            {birthday.content && <p className="birthday-content">{readableDiscordText(birthday.content)}</p>}
            <div className="discord-embed-preview" style={{ "--embed-color": embed.color ? `#${Number(embed.color).toString(16).padStart(6, "0")}` : "var(--text2)" }}>
              {thumbnailUrl && <img className="discord-embed-thumb" src={thumbnailUrl} alt="Miniatura del embed" />}<strong>{readableDiscordText(embed.title) || "Cumpleaños de la comunidad"}</strong><p>{readableDiscordText(embed.description) || "El mensaje configurado aparecerá aquí."}</p>{imageUrl && <img className="discord-embed-image" src={imageUrl} alt="Imagen del embed de cumpleaños" />}
            </div>
            {placeholders.length > 0 && <div className="birthday-placeholders"><span>Variables</span>{placeholders.map((item) => <code key={item}>{`{${item}}`}</code>)}</div>}
          </article>
        </aside>
      </div>
    </section>
  );
}

function Metric({ label, value, detail, icon, state = "" }) { return <article className={`bot-metric ${state}`}><div className="bot-metric-icon"><MetricIcon name={icon} /></div><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
function MetricIcon({ name }) {
  if (name === "latency") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 17a8 8 0 1 1 16 0"/><path d="m12 13 4-4"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/></svg>;
  if (name === "server") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 7h.01M7 17h.01"/></svg>;
  if (name === "command") return <CommandIcon />;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8.5 8.5a5 5 0 0 1 7 0M6 6a8.5 8.5 0 0 1 12 0M11 12h2v8h-2z"/></svg>;
}
function CommandIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 9a3 3 0 1 1-3-3M16 9a3 3 0 1 0 3-3M8 15a3 3 0 1 0-3 3M16 15a3 3 0 1 1 3 3M8 6v12M16 6v12M5 9h14M5 15h14"/></svg>; }
function BotIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="7" width="16" height="12" rx="4"/><path d="M12 3v4M8 12h.01M16 12h.01M8 16h8"/></svg>; }
function SearchIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>; }
function RefreshIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5"/></svg>; }
function SyncIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 7h11l-3-3M16 17H5l3 3M19 7a7 7 0 0 1 1 9M5 17a7 7 0 0 1-1-9"/></svg>; }
function AlertIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/></svg>; }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>; }
function CloseIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18"/></svg>; }
