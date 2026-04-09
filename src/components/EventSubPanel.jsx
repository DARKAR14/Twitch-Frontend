// src/components/EventSubPanel.jsx
import { useState, useEffect } from "react";
import { api } from "../lib/api";

const STATUS_COLORS = {
  enabled: { color: "var(--green)", bg: "rgba(46,204,113,0.1)", border: "rgba(46,204,113,0.3)", label: "Activo" },
  webhook_callback_verification_pending: { color: "#FF8C00", bg: "rgba(255,140,0,0.1)", border: "rgba(255,140,0,0.3)", label: "Pendiente" },
  authorization_revoked: { color: "var(--red)", bg: "rgba(255,71,87,0.1)", border: "rgba(255,71,87,0.3)", label: "Revocado" },
  moderator_removed: { color: "var(--red)", bg: "rgba(255,71,87,0.1)", border: "rgba(255,71,87,0.3)", label: "Moderador removido" },
  created: { color: "var(--green)", bg: "rgba(46,204,113,0.1)", border: "rgba(46,204,113,0.3)", label: "Creado" },
  already_exists: { color: "var(--cyan)", bg: "rgba(0,229,255,0.1)", border: "rgba(0,229,255,0.3)", label: "Ya existe" },
  error: { color: "var(--red)", bg: "rgba(255,71,87,0.1)", border: "rgba(255,71,87,0.3)", label: "Error" },
};

const EVENT_LABELS = {
  "channel.follow": "Nuevos seguidores",
  "channel.ban": "Bans y timeouts",
  "channel.update": "Cambios de canal",
  "stream.online": "Stream iniciado",
  "stream.offline": "Stream terminado",
};

export default function EventSubPanel() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [results, setResults] = useState(null);
  const [hasPublicUrl, setHasPublicUrl] = useState(true);

  const loadSubs = () => {
    setLoading(true);
    api.get("/eventsub/status")
      .then(({ data }) => setSubs(data.subscriptions || []))
      .catch((err) => {
        if (err.response?.status === 500) setHasPublicUrl(false);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSubs(); }, []);

  const handleSubscribe = async () => {
    setSubscribing(true);
    setResults(null);
    try {
      const { data } = await api.post("/eventsub/subscribe");
      setResults(data.results);
      await loadSubs();
    } catch (err) {
      setResults([{ type: "error", status: "error", error: err.response?.data?.error || err.message }]);
    } finally {
      setSubscribing(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/eventsub/unsubscribe/${id}`);
      setSubs((prev) => prev.filter((s) => s.id !== id));
    } catch {}
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Banner de estado */}
      {!hasPublicUrl && (
        <div style={{
          padding: "14px 16px", background: "rgba(255,140,0,0.08)",
          border: "1px solid rgba(255,140,0,0.3)", borderRadius: "var(--radius-sm)",
          fontSize: "13px", lineHeight: 1.6
        }}>
          <div style={{ fontWeight: 700, color: "#FF8C00", marginBottom: "6px" }}>
            ⚠ PUBLIC_URL no configurado
          </div>
          <div style={{ color: "var(--text2)" }}>
            Para usar EventSub necesitas una URL pública. En desarrollo usa{" "}
            <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 6px", borderRadius: "4px" }}>ngrok</code>:
          </div>
          <div style={{ marginTop: "8px", background: "rgba(0,0,0,0.3)", padding: "8px 12px", borderRadius: "6px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--cyan)" }}>
            ngrok http 3000<br/>
            # Copia la URL y ponla en .env como PUBLIC_URL=https://xxxx.ngrok.io
          </div>
          <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--text3)" }}>
            Sin EventSub, el sistema usa polling cada 30s como respaldo automático.
          </div>
        </div>
      )}

      {/* Suscripciones activas */}
      <div className="card">
        <div className="card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          Suscripciones EventSub activas
          <button className="refresh-btn" onClick={loadSubs}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Recargar
          </button>
        </div>

        {loading ? <div className="spinner" /> : (
          <>
            {subs.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <p>No hay suscripciones activas</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {subs.map((sub) => {
                  const s = STATUS_COLORS[sub.status] || STATUS_COLORS.error;
                  return (
                    <div key={sub.id} style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "10px 14px",
                      background: "var(--surface)", border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>
                          {EVENT_LABELS[sub.type] || sub.type}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text3)", fontFamily: "var(--font-mono)" }}>
                          {sub.type}
                        </div>
                      </div>
                      <span style={{
                        fontSize: "11px", fontWeight: 700, padding: "3px 10px",
                        borderRadius: "100px", background: s.bg, border: `1px solid ${s.border}`, color: s.color
                      }}>{s.label}</span>
                      <button onClick={() => handleDelete(sub.id)} style={{
                        background: "none", border: "1px solid rgba(255,71,87,0.3)",
                        color: "var(--red)", borderRadius: "6px", padding: "4px 8px",
                        fontSize: "11px", cursor: "pointer",
                      }}>Eliminar</button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Crear suscripciones */}
      <div className="card">
        <div className="card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          Suscribir a todos los eventos
        </div>
        <p style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "14px", lineHeight: 1.6 }}>
          Crea las 5 suscripciones necesarias para recibir eventos en tiempo real: seguidores, bans, cambios de canal, y estado del stream.
        </p>

        <button
          className="save-btn"
          onClick={handleSubscribe}
          disabled={subscribing || !hasPublicUrl}
          style={{ background: hasPublicUrl ? "var(--purple)" : "var(--surface)" }}
        >
          {subscribing ? "Suscribiendo..." : "Crear suscripciones EventSub"}
        </button>

        {results && (
          <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {results.map((r, i) => {
              const s = STATUS_COLORS[r.status] || STATUS_COLORS.error;
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px", borderRadius: "var(--radius-sm)",
                  background: s.bg, border: `1px solid ${s.border}`, fontSize: "12px"
                }}>
                  <span style={{ color: "var(--text2)" }}>{EVENT_LABELS[r.type] || r.type}</span>
                  <span style={{ color: s.color, fontWeight: 700 }}>
                    {s.label}
                    {r.error && ` — ${r.error}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
