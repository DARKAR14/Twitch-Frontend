// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { connectSocket, getSocket } from "../lib/api";
import ChannelEditor from "../components/ChannelEditor";
import ChannelHistory from "../components/ChannelHistory";
import ClipsViewer from "../components/ClipsViewer";
import ModerationLog from "../components/ModerationLog";
import NotificationBell from "../components/NotificationBell";
import EventSubPanel from "../components/EventSubPanel";
import ChatControls from "./ChatControls";
import ModManager from "./ModManager";
import ModStatsWidget from "../components/ModStatsWidget";
import { usePermissions } from "../context/PermissionsContext";
import ModPermissionsPanel from "./ModPermissionsPanel";
import SpotifyPanel from "./SpotifyPanel";
import VIPManager from "./VIPManager";
import Birthdays from "./Birthdays";
import TTSPanel from "./TTSPanel";
import "../styles/dashboard.css";

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState("channel");
  const [socketStatus, setSocketStatus] = useState("disconnected");
  const [liveInfo, setLiveInfo] = useState(null);
  const [streamNotif, setStreamNotif] = useState(null);
  const { canSee } = usePermissions();

  useEffect(() => { if (!loading && !user) navigate("/"); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const socket = connectSocket();
    socket.on("connect",      () => setSocketStatus("connected"));
    socket.on("disconnect",   () => setSocketStatus("disconnected"));
    socket.on("connected",    () => socket.emit("channel:request"));
    socket.on("channel:info", (data) => setLiveInfo(data.stream));
    socket.on("stream:online", (data) => {
      setLiveInfo(data);
      setStreamNotif({ type: "online", msg: "🟢 ¡Stream en vivo!" });
      setTimeout(() => setStreamNotif(null), 5000);
    });
    socket.on("stream:offline", () => {
      setLiveInfo({ live: false });
      setStreamNotif({ type: "offline", msg: "🔴 Stream terminado" });
      setTimeout(() => setStreamNotif(null), 5000);
    });
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connected");
      socket.off("channel:info");
      socket.off("stream:online");
      socket.off("stream:offline");
    };
  }, [user]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div className="spinner" />
    </div>
  );
  if (!user) return null;

  const isAdmin = user.role === "admin";
  const isMod   = user.role === "moderator" || user.role === "admin";

  const navSections = [
    {
      label: "Stream",
      items: [
        ...(isMod                           ? [{ id: "channel",     label: "Canal en vivo", icon: "broadcast" }] : []),
        ...(isMod && canSee("clips")        ? [{ id: "clips-today", label: "Clips",         icon: "clips"     }] : []),
      ],
    },
    {
      label: "Moderación",
      items: [
        ...(isMod && canSee("moderation") ? [{ id: "moderation", label: "Log de actividad", icon: "shield" }] : []),
        ...(isMod && canSee("chat")       ? [{ id: "chat",       label: "Chat controls",    icon: "chat"   }] : []),
        ...(isMod && canSee("spotify")    ? [{ id: "spotify",    label: "Spotify",          icon: "music"  }] : []),
        ...(isMod && canSee("birthdays")                         ? [{ id: "birthdays",  label: "Cumpleaños",       icon: "cake"   }] : []),
        ...(isMod && canSee("tts")        ? [{ id: "tts",        label: "TTS Bot",          icon: "tts"    }] : []),
      ],
    },
    {
      label: "Admin",
      items: [
        ...(canSee("modperms") ? [{ id: "modperms", label: "Panel permisos", icon: "key" }] : []),
        ...(canSee("modteam") ? [{ id: "modteam", label: "Equipo mod", icon: "team" }] : []),
        ...(canSee("eventsub") ? [{ id: "eventsub", label: "EventSub", icon: "bolt" }] : []),
        ...(canSee("chan-history") ? [{ id: "chan-history", label: "Historial cambios", icon: "clock" }] : []),
        ...(canSee("vip")         ? [{ id: "vip",          label: "VIP Manager",       icon: "star"  }] : []),
      ],
    },
  ];

  const SVG = {
    broadcast: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>,
    clips:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
    history:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>,
    shield:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    bolt:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    clock:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    chat:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    team:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    key:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
    stats:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    music:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
    star:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    cake:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v2"/><path d="M12 8v2"/><path d="M17 8v2"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/></svg>,
    tts:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  };

  const PAGE_TITLES = {
    channel:        ["Canal en vivo",        "Cambios instantáneos vía Twitch API"],
    "clips-today":  ["Clips de hoy",         "Todos los clips del stream actual"],
    moderation:     ["Actividad del canal",  "Seguidores, bans y timeouts en tiempo real"],
    chat:           ["Chat controls",        "Ban · Timeout · Unban directo"],
    stats:          ["Mis estadísticas",     "Tu actividad como moderador"],
    modperms:       ["Panel mod permisos",   "Controla qué ve cada moderador en tiempo real"],
    modteam:        ["Equipo de moderación", "Gestiona tus mods"],
    eventsub:       ["EventSub",             "Gestión de webhooks en tiempo real de Twitch"],
    "chan-history":  ["Historial de cambios", "Registro de todos los cambios del canal"],
    spotify:        ["Spotify",              "Cola de música y solicitudes de viewers"],
    vip:            ["VIP Manager",          "Gestiona los VIPs del canal"],
    birthdays:      ["Cumpleaños",           "Cumpleaños de la comunidad"],
    tts:            ["TTS Bot",              "Cola de texto a voz en tiempo real"],
  };

  return (
    <div className="dash-layout">

      {/* ── Topbar ── */}
      <header className="topbar">
        <div className="topbar-brand">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--purple)" }}>
            <path d="M2.149 0L.537 4.119v16.836h5.731V24l4.119-3.045h3.582L21.463 12V0H2.149zm17.314 11.104l-3.582 3.582h-3.582l-3.119 3.119v-3.119H5.373V2h14.09v9.104z" />
          </svg>
          DARK<span>Ops</span>
        </div>

        <div className="topbar-right">
          {streamNotif && (
            <div style={{
              fontSize: "12px", fontWeight: 600, padding: "5px 12px",
              background: streamNotif.type === "online" ? "rgba(46,204,113,0.15)" : "rgba(255,71,87,0.1)",
              border: `1px solid ${streamNotif.type === "online" ? "rgba(46,204,113,0.3)" : "rgba(255,71,87,0.3)"}`,
              color: streamNotif.type === "online" ? "var(--green)" : "var(--red)",
              borderRadius: "100px", animation: "fadeIn 0.3s ease",
            }}>{streamNotif.msg}</div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: socketStatus === "connected" ? "var(--green)" : "var(--text3)" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: socketStatus === "connected" ? "var(--green)" : "var(--text3)", display: "inline-block" }} />
            {socketStatus === "connected" ? "En línea" : "Desconectado"}
          </div>

          {liveInfo?.live && (
            <div className="live-badge">
              <span className="live-dot" />
              EN VIVO · {liveInfo.viewer_count?.toLocaleString() || "—"}
            </div>
          )}

          {isMod && <NotificationBell />}

          <div className="user-pill">
            {user.profile_image_url && <img src={user.profile_image_url} alt={user.display_name} />}
            <span>{user.display_name}</span>
            <span className={`user-role ${user.role}`}>{user.role === "admin" ? "ADMIN" : "MOD"}</span>
          </div>

          <button className="logout-btn" onClick={logout}>Salir</button>
        </div>
      </header>

      {/* ── Sidebar ── */}
      <nav className="sidebar">
        {navSections.map((section) => section.items.length > 0 && (
          <div key={section.label}>
            <div className="sidebar-section">{section.label}</div>
            {section.items.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${page === item.id ? "active" : ""}`}
                onClick={() => setPage(item.id)}
              >
                {SVG[item.icon]}
                {item.label}
              </button>
            ))}
          </div>
        ))}

        {isMod && <ModStatsWidget />}

        <div style={{ marginTop: "auto", padding: "14px 10px 4px", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: "11px", color: "var(--text3)", lineHeight: 1.8 }}>
            <div>Canal</div>
            <div style={{ color: "var(--purple)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
              {import.meta.env.VITE_CHANNEL_NAME || "—"}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="main-content">
        {PAGE_TITLES[page] && (
          <div className="page-header">
            <h1 className="page-title">{PAGE_TITLES[page][0]}</h1>
            <span className="page-sub">{PAGE_TITLES[page][1]}</span>
          </div>
        )}

        {page === "channel" && isMod && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
            <div className="card">
              <div className="card-title">{SVG.broadcast} Editar canal</div>
              <ChannelEditor />
            </div>
            <div className="card">
              <div className="card-title">{SVG.clock} Cambios recientes</div>
              <ChannelHistory />
            </div>
          </div>
        )}

        {page === "clips-today" && isMod && canSee("clips") && <ClipsViewer initialTab="today" />}
        {page === "moderation" && isMod && canSee("moderation") && <ModerationLog />}
        {page === "chat" && isMod && canSee("chat") && <ChatControls />}
        {page === "modperms" && canSee("modperms") && <ModPermissionsPanel />}
        {page === "modteam" && canSee("modteam") && <ModManager />}
        {page === "eventsub" && canSee("eventsub") && <EventSubPanel />}
        {page === "chan-history" && canSee("chan-history") && (
          <div className="card">
            <div className="card-title">{SVG.clock} Historial completo de cambios</div>
            <ChannelHistory />
          </div>
        )}
        {page === "spotify"      && canSee("spotify")               && <SpotifyPanel />}
        {page === "vip"          && canSee("vip")                   && <VIPManager />}
        {page === "birthdays"    && isMod                           && <Birthdays />}
        {page === "tts"          && isMod && canSee("tts")          && <TTSPanel />}
      </main>
    </div>
  );
}
