// src/components/ChannelEditor.jsx
import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import { getSocket } from "../lib/api";

export default function ChannelEditor() {
  const [info, setInfo] = useState(null);
  const [title, setTitle] = useState("");
  const [gameQuery, setGameQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showCats, setShowCats] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [realtimeUpdate, setRealtimeUpdate] = useState(null);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Cargar info del canal al montar
  useEffect(() => {
    api.get("/channel/info").then(({ data }) => {
      if (data.success) {
        setInfo(data);
        setTitle(data.channel.title || "");
        setGameQuery(data.channel.game_name || "");
        setSelectedGame({ id: data.channel.game_id, name: data.channel.game_name });
      }
    }).catch(() => {});
  }, []);

  // Escuchar actualizaciones en tiempo real
  useEffect(() => {
    const socket = getSocket();
    const handler = (data) => {
      setRealtimeUpdate(data);
      setTitle(data.title);
      setGameQuery(data.game_name || "");
      setSelectedGame({ id: data.game_id, name: data.game_name });
      setTimeout(() => setRealtimeUpdate(null), 4000);
    };
    socket.on("channel:updated", handler);
    return () => socket.off("channel:updated", handler);
  }, []);

  // Buscar categorías con debounce
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (gameQuery.length < 2) { setCategories([]); setShowCats(false); return; }
    // No buscar si coincide con el seleccionado
    if (selectedGame?.name === gameQuery) return;

    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/channel/search-categories?q=${encodeURIComponent(gameQuery)}`);
        setCategories(data.categories || []);
        setShowCats(true);
      } catch {}
    }, 350);
  }, [gameQuery]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (!searchRef.current?.contains(e.target)) setShowCats(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setToast(null);
    try {
      const body = { title: title.trim() };
      if (selectedGame?.id) body.game_id = selectedGame.id;

      await api.patch("/channel/update", body);
      setToast({ type: "success", msg: "✓ Canal actualizado correctamente" });
    } catch (err) {
      setToast({ type: "error", msg: err.response?.data?.error || "Error al actualizar" });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div className="channel-editor">
      {/* Banner de actualización en tiempo real */}
      {realtimeUpdate && (
        <div className="realtime-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Actualizado por <strong>{realtimeUpdate.updated_by?.name}</strong> en tiempo real
        </div>
      )}

      {/* Estado del stream */}
      {info?.stream && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "rgba(255,71,87,0.06)", border: "1px solid rgba(255,71,87,0.2)", borderRadius: "var(--radius-sm)", fontSize: "13px" }}>
          {info.stream.live ? (
            <>
              <span className="live-dot" />
              <span style={{ color: "var(--red)", fontWeight: 600 }}>EN VIVO</span>
              <span style={{ color: "var(--text3)" }}>·</span>
              <span style={{ color: "var(--text2)" }}>{info.stream.viewer_count?.toLocaleString()} espectadores</span>
            </>
          ) : (
            <span style={{ color: "var(--text3)" }}>Canal offline</span>
          )}
        </div>
      )}

      {/* Título */}
      <div>
        <div className="field-label">Título del stream</div>
        <input
          className="field-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Escribe el título del stream..."
          maxLength={140}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
        />
        <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "4px", textAlign: "right" }}>
          {title.length}/140
        </div>
      </div>

      {/* Categoría */}
      <div>
        <div className="field-label">Categoría / Juego</div>
        <div className="category-search" ref={searchRef}>
          <input
            className="field-input"
            value={gameQuery}
            onChange={(e) => { setGameQuery(e.target.value); setSelectedGame(null); }}
            placeholder="Buscar categoría..."
            onFocus={() => { if (categories.length > 0) setShowCats(true); }}
          />
          {showCats && categories.length > 0 && (
            <div className="category-results">
              {categories.map((cat) => (
                <button key={cat.id} className="cat-item" onClick={() => {
                  setSelectedGame({ id: cat.id, name: cat.name });
                  setGameQuery(cat.name);
                  setShowCats(false);
                }}>
                  {cat.box_art_url && (
                    <img
                      src={cat.box_art_url.replace("{width}", "48").replace("{height}", "64")}
                      alt={cat.name}
                    />
                  )}
                  <span className="cat-item-name">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedGame?.name && (
          <div style={{ fontSize: "12px", color: "var(--purple)", marginTop: "5px" }}>
            ✓ Seleccionado: {selectedGame.name}
          </div>
        )}
      </div>

      {/* Botón guardar */}
      <button className="save-btn" onClick={handleSave} disabled={saving || !title.trim()}>
        {saving ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 0.7s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Actualizando...
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Actualizar canal en vivo
          </>
        )}
      </button>

      {/* Toast */}
      {toast && (
        <div className={`update-toast ${toast.type === "error" ? "error" : ""}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
