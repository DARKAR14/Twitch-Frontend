// src/pages/Login.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/login.css";

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
      {/* Animated background grid */}
      <div className="login-grid" aria-hidden="true">
        {Array.from({ length: 64 }).map((_, i) => (
          <div key={i} className="grid-cell" style={{ animationDelay: `${(i * 0.08) % 4}s` }} />
        ))}
      </div>

      {/* Glowing orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="login-card">
        {/* Logo mark */}
        <div className="login-logo">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="12" fill="url(#lg1)" />
            <path d="M12 10H36V28L30 34H24L20 38V34H12V10Z" fill="white" fillOpacity="0.15" />
            <path d="M20 18H22V24H20V18ZM26 18H28V24H26V18Z" fill="white" />
            <defs>
              <linearGradient id="lg1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#9146FF" />
                <stop offset="1" stopColor="#6441A4" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="login-badge">PANEL DE CONTROL</div>
        <h1 className="login-title">DARK<span>Ops</span></h1>
        <p className="login-sub">
          Gestiona tu canal, clips y moderación desde un solo lugar. Acceso por roles desde Twitch.
        </p>

        <button className="login-btn" onClick={handleLogin}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.149 0L.537 4.119v16.836h5.731V24l4.119-3.045h3.582L21.463 12V0H2.149zm17.314 11.104l-3.582 3.582h-3.582l-3.119 3.119v-3.119H5.373V2h14.09v9.104zM17.582 5.373h-2v5.731h2V5.373zm-4.836 0h-2v5.731h2V5.373z"/>
          </svg>
          Iniciar sesión con Twitch
        </button>

        <div className="login-roles">
          <div className="role-chip">
            <span className="role-dot admin" />
            Administrador
          </div>
          <div className="role-chip">
            <span className="role-dot mod" />
            Moderador
          </div>
        </div>

        <p className="login-footer">
          Solo el broadcaster y sus moderadores pueden acceder al panel.
        </p>
      </div>
    </div>
  );
}
