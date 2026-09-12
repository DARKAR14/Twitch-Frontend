// src/components/ModStatsWidget.jsx
import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";

const STAT_ICONS = {
  bans: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m14.5 4.5 5 5"/><path d="m12 7 5 5-8.5 8.5a2.12 2.12 0 0 1-3-3Z"/><path d="M4 4h6v6H4z"/></svg>,
  clips: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="5" width="15" height="14" rx="2"/><path d="m17 10 5-3v10l-5-3Z"/></svg>,
  followers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6m-3-3h6"/></svg>,
};

export default function ModStatsWidget() {
  const [stats, setStats] = useState(null);
  const pingRef = useRef(null);

  const fetchStats = () => {
    api.get("/stats/me").then(({ data }) => setStats(data)).catch(() => {});
  };

  useEffect(() => {
    fetchStats();
    // Ping de sesión cada 5 minutos
    pingRef.current = setInterval(() => {
      api.post("/stats/session/ping").catch(() => {});
      fetchStats();
    }, 5 * 60 * 1000);
    return () => clearInterval(pingRef.current);
  }, []);

  if (!stats) return null;

  const { today, week } = stats;
  const maxBans = Math.max(...week.history.map((d) => d.bans), 1);

  return (
    <div className="mod-stats-widget" style={{
      margin: "8px 0",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.14)",
      borderRadius: "10px",
      padding: "12px",
      fontSize: "12px",
    }}>
      <div style={{
        fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em",
        color: "var(--text3)", textTransform: "uppercase", marginBottom: "10px",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <span>Tu día</span>
        <button onClick={fetchStats} style={{
          background: "none", border: "none", color: "var(--text3)",
          cursor: "pointer", fontSize: "11px", padding: 0,
        }}>↻</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <StatRow icon={STAT_ICONS.bans} label="Bans" value={today.bans} color="#FF7C88" />
        <StatRow icon={STAT_ICONS.clips} label="Clips" value={today.clips} color="var(--purple)" />
        <StatRow icon={STAT_ICONS.followers} label="Followers" value={today.followers} color="#91D6AD" />
      </div>

      {/* Mini gráfico de bans semanal */}
      <div style={{ marginTop: "10px", borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
        <div style={{ fontSize: "10px", color: "var(--text3)", marginBottom: "6px" }}>
          Bans esta semana · {week.bans} total
        </div>
        <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", height: "28px" }}>
          {week.history.map((day) => (
            <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
              <div style={{
                width: "100%",
                height: `${Math.max((day.bans / maxBans) * 20, day.bans > 0 ? 4 : 2)}px`,
                background: day.bans > 0 ? "#FF4757" : "rgba(255,255,255,0.08)",
                borderRadius: "2px",
                transition: "height 0.3s ease",
              }} title={`${day.label}: ${day.bans} bans`} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
          {week.history.map((day) => (
            <div key={day.date} style={{ flex: 1, textAlign: "center", fontSize: "9px", color: "var(--text3)" }}>
              {day.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatRow({ icon, label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span className="mod-stat-label" style={{ color: "var(--text3)" }}>{icon} {label}</span>
      <span style={{ fontWeight: 700, color, fontFamily: "var(--font-mono)", fontSize: "13px" }}>
        {value}
      </span>
    </div>
  );
}
