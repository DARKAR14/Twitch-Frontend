// src/pages/ModManager.jsx
import { useState, useEffect } from "react";
import { api } from "../lib/api";

function OnlineDot({ online }) {
  return (
    <span style={{
      width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
      background: online ? "var(--green)" : "rgba(255,255,255,0.15)",
      boxShadow: online ? "0 0 6px var(--green)" : "none",
      display: "inline-block",
    }} />
  );
}

export default function ModManager() {
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newMod, setNewMod] = useState("");
  const [result, setResult] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const fetchMods = () => {
    setLoading(true);
    api.get("/modmanager/list")
      .then(({ data }) => setMods(data.mods || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMods(); }, []);

  const handleAdd = async () => {
    if (!newMod.trim()) return;
    setAdding(true);
    setResult(null);
    try {
      const { data } = await api.post("/modmanager/add", { user_login: newMod.trim().replace("@", "") });
      setResult({ type: "success", msg: data.message });
      setNewMod("");
      fetchMods();
    } catch (err) {
      setResult({ type: "error", msg: err.response?.data?.error || "Error al añadir moderador" });
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (mod) => {
    setRemoving(mod.user_id);
    setResult(null);
    try {
      await api.delete(`/modmanager/remove/${mod.user_id}`);
      setResult({ type: "success", msg: `@${mod.user_name} removido como moderador` });
      setMods((prev) => prev.filter((m) => m.user_id !== mod.user_id));
    } catch (err) {
      setResult({ type: "error", msg: err.response?.data?.error || "Error al remover moderador" });
    } finally {
      setRemoving(null);
      setConfirmRemove(null);
    }
  };

  const onlineCount = mods.filter((m) => m.online).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        {[
          { label: "Total mods", value: mods.length, color: "var(--purple)" },
          { label: "Bans esta semana", value: mods.reduce((a, m) => a + m.bans_week, 0), color: "var(--red)" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ textAlign: "center", padding: "16px" }}>
            <div style={{ fontSize: "28px", fontWeight: 800, fontFamily: "var(--font-display)", color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Añadir mod */}
      <div className="card">
        <div className="card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          Añadir moderador
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }}>@</span>
            <input
              className="field-input"
              style={{ paddingLeft: "26px" }}
              value={newMod}
              onChange={(e) => setNewMod(e.target.value.replace("@", ""))}
              placeholder="nombre_de_usuario"
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            />
          </div>
          <button className="save-btn" style={{ width: "auto", padding: "0 20px" }}
            onClick={handleAdd} disabled={adding || !newMod.trim()}>
            {adding ? "Añadiendo..." : "Añadir"}
          </button>
        </div>
        {result && (
          <div style={{
            marginTop: "10px", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: "13px",
            background: result.type === "success" ? "rgba(46,204,113,0.1)" : "rgba(255,71,87,0.1)",
            border: `1px solid ${result.type === "success" ? "rgba(46,204,113,0.3)" : "rgba(255,71,87,0.3)"}`,
            color: result.type === "success" ? "var(--green)" : "var(--red)",
          }}>{result.msg}</div>
        )}
      </div>

      {/* Lista de mods */}
      <div className="card">
        <div className="card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Equipo de moderación
          <button className="refresh-btn" onClick={fetchMods}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Actualizar
          </button>
        </div>

        {loading ? <div className="spinner" /> : mods.length === 0 ? (
          <div className="empty-state"><p>No hay moderadores en este canal</p></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {mods.map((mod) => (
              <div key={mod.user_id}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px 14px", background: "var(--surface)",
                  border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                  transition: "border-color 0.15s",
                }}>
                  <OnlineDot online={mod.online} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "3px" }}>
                      @{mod.user_name}
                      {mod.online && (
                        <span style={{ marginLeft: "8px", fontSize: "10px", color: "var(--green)", fontWeight: 700 }}>EN LÍNEA</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "14px", fontSize: "11px", color: "var(--text3)" }}>
                      <span>🔨 <span style={{ color: "var(--red)", fontWeight: 600 }}>{mod.bans_week}</span> bans / semana</span>
                      <span>⏱ <span style={{ color: "var(--cyan)", fontWeight: 600 }}>{mod.active_formatted}</span> activo</span>
                      {mod.last_seen && (
                        <span>Visto: {new Date(mod.last_seen).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}</span>
                      )}
                    </div>
                  </div>

                  {/* Barra de actividad */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "18px", fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--purple)", lineHeight: 1 }}>
                      {mod.bans_total}
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--text3)" }}>bans total</div>
                  </div>

                  {/* Botón remover */}
                  {confirmRemove === mod.user_id ? (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => handleRemove(mod)} disabled={removing === mod.user_id}
                        style={{ padding: "5px 10px", background: "var(--red)", border: "none", borderRadius: "6px", color: "white", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
                        {removing === mod.user_id ? "..." : "Sí"}
                      </button>
                      <button onClick={() => setConfirmRemove(null)}
                        style={{ padding: "5px 10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text2)", cursor: "pointer", fontSize: "12px" }}>
                        No
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmRemove(mod.user_id)}
                      style={{ padding: "5px 12px", background: "none", border: "1px solid rgba(255,71,87,0.3)", borderRadius: "6px", color: "var(--red)", cursor: "pointer", fontSize: "12px", flexShrink: 0 }}>
                      Remover
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}