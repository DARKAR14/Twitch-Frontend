// src/pages/VIPManager.jsx
import { useState, useEffect, useRef } from "react";
import { api, getSocket } from "../lib/api";

function VIPCard({ vip, onRemove, removing }) {
  const [confirm, setConfirm] = useState(false);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: "12px 14px",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderLeft: "3px solid #FFD700",
      borderRadius: "var(--radius-sm)",
      transition: "all 0.15s",
    }}>
      {/* Avatar placeholder */}
      <div style={{
        width: "36px", height: "36px", borderRadius: "50%",
        background: "rgba(255,215,0,0.15)",
        border: "1px solid rgba(255,215,0,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "14px", flexShrink: 0,
      }}>⭐</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "14px", fontWeight: 600 }}>
          @{vip.user_name}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text3)", fontFamily: "var(--font-mono)" }}>
          {vip.user_id}
        </div>
      </div>

      {/* Badge VIP */}
      <span style={{
        fontSize: "10px", fontWeight: 700, padding: "2px 8px",
        borderRadius: "100px", letterSpacing: "0.08em",
        background: "rgba(255,215,0,0.12)",
        color: "#FFD700",
        border: "1px solid rgba(255,215,0,0.3)",
        flexShrink: 0,
      }}>VIP</span>

      {/* Botón quitar */}
      {confirm ? (
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <button
            onClick={() => { onRemove(vip.user_id); setConfirm(false); }}
            disabled={removing}
            style={{
              padding: "4px 10px", background: "var(--red)", border: "none",
              borderRadius: "6px", color: "white", cursor: "pointer",
              fontSize: "12px", fontWeight: 600,
            }}
          >
            {removing ? "..." : "Sí"}
          </button>
          <button
            onClick={() => setConfirm(false)}
            style={{
              padding: "4px 10px", background: "var(--surface)",
              border: "1px solid var(--border)", borderRadius: "6px",
              color: "var(--text2)", cursor: "pointer", fontSize: "12px",
            }}
          >No</button>
        </div>
      ) : (
        <button
          onClick={() => setConfirm(true)}
          style={{
            background: "none", border: "1px solid rgba(255,71,87,0.3)",
            borderRadius: "6px", color: "var(--red)", padding: "4px 10px",
            fontSize: "12px", cursor: "pointer", flexShrink: 0,
            transition: "all 0.15s",
          }}
        >Quitar VIP</button>
      )}
    </div>
  );
}

export default function VIPManager() {
  const [vips, setVips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState("");
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [result, setResult] = useState(null);
  const [search, setSearch] = useState("");
  const debounceRef = useRef(null);

  const fetchVips = () => {
    setLoading(true);
    api.get("/vip/list")
      .then(({ data }) => setVips(data.vips || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchVips(); }, []);

  // Socket: VIP añadido/quitado en tiempo real
  useEffect(() => {
    const socket = getSocket();
    socket.on("vip:added", (data) => {
      setVips((prev) => {
        if (prev.find((v) => v.user_id === data.user_id)) return prev;
        return [{ user_id: data.user_id, user_login: data.user_login, user_name: data.user_name }, ...prev];
      });
    });
    socket.on("vip:removed", (data) => {
      setVips((prev) => prev.filter((v) => v.user_id !== data.user_id));
    });
    return () => { socket.off("vip:added"); socket.off("vip:removed"); };
  }, []);

  // Preview del usuario con debounce
  useEffect(() => {
    clearTimeout(debounceRef.current);
    setPreview(null);
    if (newUser.length < 2) return;
    debounceRef.current = setTimeout(async () => {
      setLoadingPreview(true);
      try {
        const { data } = await api.get(`/vip/check/${newUser.replace("@", "")}`);
        if (data.success) setPreview(data.user);
      } catch {
        setPreview({ not_found: true });
      } finally {
        setLoadingPreview(false);
      }
    }, 500);
  }, [newUser]);

  const handleAdd = async () => {
    if (!newUser.trim()) return;
    setAdding(true);
    setResult(null);
    try {
      const { data } = await api.post("/vip/add", { user_login: newUser.trim().replace("@", "") });
      setResult({ type: "success", msg: data.message });
      if (data.vip) {
        setVips((prev) => [data.vip, ...prev]);
      }
      setNewUser("");
      setPreview(null);
    } catch (err) {
      setResult({ type: "error", msg: err.response?.data?.error || "Error al añadir VIP" });
    } finally {
      setAdding(false);
      setTimeout(() => setResult(null), 4000);
    }
  };

  const handleRemove = async (userId) => {
    setRemoving(userId);
    try {
      await api.delete(`/vip/remove/${userId}`);
      setVips((prev) => prev.filter((v) => v.user_id !== userId));
      setResult({ type: "success", msg: "VIP eliminado correctamente" });
      setTimeout(() => setResult(null), 3000);
    } catch (err) {
      setResult({ type: "error", msg: err.response?.data?.error || "Error al quitar VIP" });
      setTimeout(() => setResult(null), 4000);
    } finally {
      setRemoving(null);
    }
  };

  const filtered = vips.filter(
    (v) =>
      !search ||
      v.user_name.toLowerCase().includes(search.toLowerCase()) ||
      v.user_login.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Resumen */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px",
      }}>
        <div className="card" style={{ textAlign: "center", padding: "16px" }}>
          <div style={{
            fontSize: "36px", fontWeight: 800,
            fontFamily: "var(--font-display)", color: "#FFD700", lineHeight: 1,
          }}>
            {vips.length}
          </div>
          <div style={{
            fontSize: "11px", color: "var(--text3)", marginTop: "4px",
            textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600,
          }}>
            VIPs activos
          </div>
        </div>
        <div className="card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontSize: "24px" }}>⭐</div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text2)" }}>
              Los VIPs pueden hablar en modo lento, emotes y más
            </div>
            <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "2px" }}>
              Privilegios especiales de Twitch
            </div>
          </div>
        </div>
      </div>

      {/* Añadir VIP */}
      <div className="card">
        <div className="card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          Añadir VIP
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{
              position: "absolute", left: "12px", top: "50%",
              transform: "translateY(-50%)", color: "var(--text3)",
            }}>@</span>
            <input
              className="field-input"
              style={{ paddingLeft: "26px" }}
              value={newUser}
              onChange={(e) => setNewUser(e.target.value.replace("@", ""))}
              placeholder="nombre_de_usuario"
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            />
          </div>
          <button
            className="save-btn"
            style={{ width: "auto", padding: "0 20px", background: "#C9A227" }}
            onClick={handleAdd}
            disabled={adding || !newUser.trim() || preview?.not_found}
          >
            {adding ? "Añadiendo..." : "⭐ Dar VIP"}
          </button>
        </div>

        {/* Preview */}
        {loadingPreview && (
          <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text3)" }}>
            Buscando usuario...
          </div>
        )}
        {preview && !preview.not_found && (
          <div style={{
            marginTop: "8px", display: "flex", alignItems: "center", gap: "10px",
            padding: "8px 12px", background: "var(--surface)",
            border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
          }}>
            {preview.profile_image_url && (
              <img src={preview.profile_image_url} alt=""
                style={{ width: "28px", height: "28px", borderRadius: "50%" }} />
            )}
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>{preview.display_name}</span>
              {preview.is_vip && (
                <span style={{
                  marginLeft: "8px", fontSize: "10px", color: "#FFD700",
                  fontWeight: 700,
                }}>⭐ Ya es VIP</span>
              )}
            </div>
          </div>
        )}
        {preview?.not_found && (
          <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--red)" }}>
            Usuario no encontrado en Twitch
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div style={{
            marginTop: "10px", padding: "8px 12px", borderRadius: "var(--radius-sm)",
            fontSize: "13px",
            background: result.type === "success" ? "rgba(46,204,113,0.1)" : "rgba(255,71,87,0.1)",
            border: `1px solid ${result.type === "success" ? "rgba(46,204,113,0.3)" : "rgba(255,71,87,0.3)"}`,
            color: result.type === "success" ? "var(--green)" : "var(--red)",
          }}>{result.msg}</div>
        )}
      </div>

      {/* Lista de VIPs */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: "12px" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Lista de VIPs
          <button className="refresh-btn" onClick={fetchVips} style={{ marginLeft: "auto" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Actualizar
          </button>
        </div>

        {/* Buscador */}
        {vips.length > 5 && (
          <input
            className="field-input"
            style={{ marginBottom: "12px" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar VIP..."
          />
        )}

        {loading ? (
          <div className="spinner" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <p>{search ? "No se encontraron VIPs" : "No hay VIPs en este canal todavía"}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filtered.map((vip) => (
              <VIPCard
                key={vip.user_id}
                vip={vip}
                onRemove={handleRemove}
                removing={removing === vip.user_id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}