// src/pages/Login.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LiquidBackdrop from "../components/LiquidBackdrop";
import "../styles/login.css";

function TwitchMark({ decorative = true }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden={decorative ? "true" : undefined}>
      <path d="M2.149 0 .537 4.119v16.836h5.731V24l4.119-3.045h3.582L21.463 12V0H2.149Zm17.314 11.104-3.582 3.582h-3.582L9.18 17.805v-3.119H5.373V2h14.09v9.104Zm-1.881-5.731h-2v5.731h2V5.373Zm-4.836 0h-2v5.731h2V5.373Z" />
    </svg>
  );
}

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/auth/twitch`;
  };

  return (
    <div className="login-root">
      <LiquidBackdrop />

      <div className="login-brand" aria-label="DarkOps">
        <TwitchMark />
        <span>DARK<strong>Ops</strong></span>
      </div>

      <div className="login-card">
        <div className="login-logo">
          <TwitchMark />
        </div>

        <div className="login-badge">PANEL DE CONTROL</div>
        <h1 className="login-title">DARK<span>Ops</span></h1>
        <p className="login-sub">
          Gestiona tu canal, clips y moderación desde un solo lugar. Acceso por roles desde Twitch.
        </p>

        <button className="login-btn" onClick={handleLogin}>
          <TwitchMark />
          Iniciar sesión con Twitch
        </button>

        <div className="login-roles">
          <div className="role-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m4 8 3.5 3L12 4l4.5 7L20 8l-2 10H6L4 8Z"/><path d="M7 21h10"/></svg>
            Administrador
          </div>
          <div className="role-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9.5 12 1.7 1.7 3.7-4"/></svg>
            Moderador
          </div>
        </div>

        <p className="login-footer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
          Solo el broadcaster y sus moderadores pueden acceder al panel.
        </p>
      </div>
    </div>
  );
}
