import { useCallback, useEffect, useState } from "react";
import { api, getSocket } from "../lib/api";

function PermissionSwitch({ enabled, onChange, loading, label }) {
  return (
    <button
      className={`permission-switch ${enabled ? "enabled" : ""}`}
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onChange}
      disabled={loading}
    >
      <span />
    </button>
  );
}

export default function ModPermissionsPanel() {
  const [mods, setMods] = useState([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [tabs, setTabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState({});
  const [notice, setNotice] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const { data } = await api.get("/modpermissions/all");
      setMods(data.mods || []);
      setCanEdit(data.can_edit === true);
      setTabs(data.tabs || []);
      setNotice(null);
    } catch (error) {
      setLoadError(true);
      setCanEdit(false);
      setNotice({ type: "error", text: error?.response?.data?.error || "No se pudo cargar la matriz de permisos." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const socket = getSocket();
    const handler = (data) => {
      setMods((current) => current.map((mod) => mod.user_id === data.mod_id ? { ...mod, permissions: data.permissions } : mod));
      setNotice({ type: "success", text: `Permiso ${data.tab} ${data.enabled ? "activado" : "desactivado"}.` });
    };
    socket.on("modpermissions:changed", handler);
    return () => socket.off("modpermissions:changed", handler);
  }, []);

  async function handleToggle(mod, tab, currentValue) {
    if (!canEdit) return;
    const key = `${mod.user_id}:${tab.id}`;
    setToggling((current) => ({ ...current, [key]: true }));
    setMods((current) => current.map((item) => item.user_id === mod.user_id
      ? { ...item, permissions: { ...item.permissions, [tab.id]: !currentValue } }
      : item));

    try {
      await api.patch(`/modpermissions/${mod.user_id}`, { tab: tab.id, enabled: !currentValue });
      setNotice({ type: "success", text: `${tab.label} ${!currentValue ? "activado" : "desactivado"} para @${mod.user_name}.` });
    } catch (error) {
      setMods((current) => current.map((item) => item.user_id === mod.user_id
        ? { ...item, permissions: { ...item.permissions, [tab.id]: currentValue } }
        : item));
      setNotice({ type: "error", text: error?.response?.data?.error || `No se pudo actualizar ${tab.label}.` });
    } finally {
      setToggling((current) => { const next = { ...current }; delete next[key]; return next; });
    }
  }

  async function handleReset(mod) {
    if (!canEdit) return;
    try {
      const { data } = await api.put(`/modpermissions/${mod.user_id}/reset`);
      setMods((current) => current.map((item) => item.user_id === mod.user_id ? { ...item, permissions: data.permissions } : item));
      setNotice({ type: "success", text: `Permisos de @${mod.user_name} restablecidos.` });
    } catch (error) {
      setNotice({ type: "error", text: error?.response?.data?.error || "No se pudieron restablecer los permisos." });
    }
  }

  const matrixStyle = {
    "--permission-columns": `220px repeat(${tabs.length}, minmax(118px, 1fr)) 96px`,
    "--permission-min-width": `${316 + tabs.length * 118}px`,
  };

  return (
    <section className="permissions-panel" aria-label="Permisos de moderadores">
      <div className="permissions-live-banner">
        <BoltIcon />
        <div><strong>Cambios en tiempo real</strong><span>Los permisos se aplican al panel del moderador sin recargar la página.</span></div>
      </div>

      {notice && (
        <div className={`bot-notice ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>
          {notice.type === "error" ? <AlertIcon /> : <CheckIcon />}
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Cerrar aviso"><CloseIcon /></button>
        </div>
      )}

      {!loading && !loadError && !canEdit && <p>Solo lectura. El administrador puede modificar los permisos.</p>}

      <div className="card permissions-card">
        {loading ? (
          <div className="bot-loading" role="status"><span className="spinner" /><p>Cargando permisos…</p></div>
        ) : loadError ? (
          <div className="bot-empty"><AlertIcon /><strong>No se pudieron cargar los permisos</strong><p>Vuelve a consultar la lista. No se han borrado los permisos guardados.</p></div>
        ) : mods.length === 0 ? (
          <div className="bot-empty"><UsersIcon /><strong>No hay moderadores</strong><p>Cuando Twitch devuelva el equipo, aparecerá en esta matriz.</p></div>
        ) : (
          <div className="permissions-matrix-scroll" role="region" aria-label="Matriz de permisos; desplázate horizontalmente para ver todas las columnas" tabIndex={0}>
            <div role="grid" aria-label="Permisos por moderador" aria-rowcount={mods.length + 1}>
              <div className="permissions-grid permissions-grid-header" style={matrixStyle} role="row">
                <div role="columnheader">Moderador</div>
                {tabs.map((tab) => <div key={tab.id} role="columnheader">{tab.label}</div>)}
                <div role="columnheader">Reset</div>
              </div>

              {mods.map((mod) => (
                <div className="permissions-grid permissions-grid-row" style={matrixStyle} role="row" key={mod.user_id}>
                  <div className="permission-mod" role="rowheader"><span /><div><strong>@{mod.user_name}</strong><small>{mod.user_id}</small></div></div>
                  {tabs.map((tab) => {
                    const key = `${mod.user_id}:${tab.id}`;
                    const enabled = mod.permissions?.[tab.id] === true;
                    return (
                      <div className="permission-cell" role="gridcell" key={tab.id}>
                        <PermissionSwitch
                          enabled={enabled}
                          loading={!canEdit || Boolean(toggling[key])}
                          label={`${enabled ? "Desactivar" : "Activar"} ${tab.label} para ${mod.user_name}`}
                          onChange={() => handleToggle(mod, tab, enabled)}
                        />
                        <span className={enabled ? "enabled" : ""}>{enabled ? "ON" : "OFF"}</span>
                      </div>
                    );
                  })}
                  <div className="permission-reset-cell" role="gridcell"><button type="button" disabled={!canEdit} onClick={() => handleReset(mod)} aria-label={`Restablecer permisos de ${mod.user_name}`}><ResetIcon />Reset</button></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button className="refresh-btn permissions-refresh" type="button" onClick={fetchData} disabled={loading}><RefreshIcon />Refrescar lista</button>
    </section>
  );
}

function BoltIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m13 2-9 12h8l-1 8 9-12h-8z"/></svg>; }
function UsersIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function RefreshIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5"/></svg>; }
function ResetIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>; }
function AlertIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/></svg>; }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>; }
function CloseIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18"/></svg>; }
