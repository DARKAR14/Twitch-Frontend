// src/pages/Birthdays.jsx
import { useState, useEffect } from "react";
import { api } from "../lib/api";

const MONTH_COLORS = {
  1:  { color: "#64B5F6", bg: "rgba(100,181,246,0.08)",  border: "rgba(100,181,246,0.2)"  },
  2:  { color: "#F48FB1", bg: "rgba(244,143,177,0.08)",  border: "rgba(244,143,177,0.2)"  },
  3:  { color: "#81C784", bg: "rgba(129,199,132,0.08)",  border: "rgba(129,199,132,0.2)"  },
  4:  { color: "#FFB74D", bg: "rgba(255,183,77,0.08)",   border: "rgba(255,183,77,0.2)"   },
  5:  { color: "#FF8A65", bg: "rgba(255,138,101,0.08)",  border: "rgba(255,138,101,0.2)"  },
  6:  { color: "#FFD54F", bg: "rgba(255,213,79,0.08)",   border: "rgba(255,213,79,0.2)"   },
  7:  { color: "#4FC3F7", bg: "rgba(79,195,247,0.08)",   border: "rgba(79,195,247,0.2)"   },
  8:  { color: "#AED581", bg: "rgba(174,213,129,0.08)",  border: "rgba(174,213,129,0.2)"  },
  9:  { color: "#CE93D8", bg: "rgba(206,147,216,0.08)",  border: "rgba(206,147,216,0.2)"  },
  10: { color: "#FF8A65", bg: "rgba(255,138,101,0.08)",  border: "rgba(255,138,101,0.2)"  },
  11: { color: "#90A4AE", bg: "rgba(144,164,174,0.08)",  border: "rgba(144,164,174,0.2)"  },
  12: { color: "#F06292", bg: "rgba(240,98,146,0.08)",   border: "rgba(240,98,146,0.2)"   },
};

function Avatar({ displayName }) {
  const initials = displayName?.slice(0, 2).toUpperCase() || "??";
  const colors = ["#9146FF", "#FF4757", "#2ECC71", "#00E5FF", "#FFD700", "#FF8C00"];
  const color = colors[displayName?.charCodeAt(0) % colors.length] || "#9146FF";

  return (
    <div style={{
      width: "42px", height: "42px", borderRadius: "50%",
      background: `${color}22`, border: `2px solid ${color}44`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "13px", fontWeight: 700, color, flexShrink: 0,
      fontFamily: "var(--font-display)",
    }}>
      {initials}
    </div>
  );
}

function BirthdayCard({ birthday, isToday }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "10px 12px",
      background: isToday ? "rgba(255,215,0,0.06)" : "var(--surface)",
      border: `1px solid ${isToday ? "rgba(255,215,0,0.3)" : "var(--border)"}`,
      borderRadius: "var(--radius-sm)",
      transition: "all 0.15s",
      position: "relative",
    }}>
      <Avatar displayName={birthday.display_name} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "13px", fontWeight: 600,
          color: isToday ? "#FFD700" : "var(--text)",
        }}>
          {birthday.display_name}
          {isToday && <span style={{ marginLeft: "6px", fontSize: "14px" }}>🎂</span>}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text3)", fontFamily: "var(--font-mono)" }}>
          @{birthday.username}
        </div>
      </div>
      <div style={{
        fontSize: "13px", fontWeight: 700,
        color: isToday ? "#FFD700" : "var(--text2)",
        fontFamily: "var(--font-display)",
        flexShrink: 0,
      }}>
        Día {birthday.day}
      </div>
    </div>
  );
}

function MonthSection({ monthData, currentMonth, todayDay }) {
  const isCurrentMonth = monthData.month === currentMonth;
  const c = MONTH_COLORS[monthData.month] || MONTH_COLORS[1];

  return (
    <div style={{
      background: "var(--surface)",
      border: `1px solid ${isCurrentMonth ? c.border : "var(--border)"}`,
      borderRadius: "var(--radius)",
      overflow: "hidden",
    }}>
      {/* Header del mes */}
      <div style={{
        padding: "12px 16px",
        background: isCurrentMonth ? c.bg : "rgba(255,255,255,0.02)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>
            {["❄️","💝","🌸","🌷","🌻","☀️","🏖️","🍂","🍁","🎃","🍂","🎄"][monthData.month - 1]}
          </span>
          <span style={{
            fontSize: "14px", fontWeight: 700,
            fontFamily: "var(--font-display)",
            color: isCurrentMonth ? c.color : "var(--text)",
          }}>
            {monthData.month_name}
            {isCurrentMonth && (
              <span style={{
                marginLeft: "8px", fontSize: "10px", fontWeight: 700,
                padding: "2px 8px", borderRadius: "100px",
                background: c.bg, color: c.color, border: `1px solid ${c.border}`,
              }}>MES ACTUAL</span>
            )}
          </span>
        </div>
        <span style={{
          fontSize: "12px", color: "var(--text3)",
          fontFamily: "var(--font-mono)",
        }}>
          {monthData.birthdays.length} {monthData.birthdays.length === 1 ? "cumpleaños" : "cumpleaños"}
        </span>
      </div>

      {/* Cards del mes */}
      <div style={{
        padding: "12px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "8px",
      }}>
        {monthData.birthdays.map((b) => (
          <BirthdayCard
            key={b.user_id || b.username}
            birthday={b}
            isToday={isCurrentMonth && b.day === todayDay}
          />
        ))}
      </div>
    </div>
  );
}

export default function Birthdays() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState(null);

  const today = new Date();
  const todayDay = today.getDate();
  const currentMonth = today.getMonth() + 1;

  useEffect(() => {
    api.get("/birthdays")
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  if (!data?.months?.length) return (
    <div className="empty-state">
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎂</div>
      <p>No hay cumpleaños registrados</p>
    </div>
  );

  // Filtrar por búsqueda
  let months = data.months;
  if (search) {
    months = months.map((m) => ({
      ...m,
      birthdays: m.birthdays.filter(
        (b) =>
          b.display_name.toLowerCase().includes(search.toLowerCase()) ||
          b.username.toLowerCase().includes(search.toLowerCase())
      ),
    })).filter((m) => m.birthdays.length > 0);
  }
  if (filterMonth) {
    months = months.filter((m) => m.month === filterMonth);
  }

  // Cumpleaños de hoy
  const todayBirthdays = data.months
    .find((m) => m.month === currentMonth)
    ?.birthdays.filter((b) => b.day === todayDay) || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Cumpleaños de hoy */}
      {todayBirthdays.length > 0 && (
        <div style={{
          padding: "16px", borderRadius: "var(--radius)",
          background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.3)",
          display: "flex", alignItems: "center", gap: "12px",
        }}>
          <span style={{ fontSize: "32px" }}>🎂</span>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFD700", marginBottom: "4px" }}>
              ¡Hoy es el cumpleaños de!
            </div>
            <div style={{ fontSize: "13px", color: "var(--text2)" }}>
              {todayBirthdays.map((b) => b.display_name).join(", ")}
            </div>
          </div>
        </div>
      )}

      {/* Resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        <div className="card" style={{ textAlign: "center", padding: "16px" }}>
          <div style={{ fontSize: "32px", fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--purple)", lineHeight: 1 }}>
            {data.total}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            Total registrados
          </div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "16px" }}>
          <div style={{ fontSize: "32px", fontWeight: 800, fontFamily: "var(--font-display)", color: "#FFD700", lineHeight: 1 }}>
            {data.months.find((m) => m.month === currentMonth)?.birthdays.length || 0}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            Este mes
          </div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "16px" }}>
          <div style={{ fontSize: "32px", fontWeight: 800, fontFamily: "var(--font-display)", color: "#2ECC71", lineHeight: 1 }}>
            {todayBirthdays.length}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            Hoy
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="field-input"
          style={{ flex: 1, minWidth: "200px", maxWidth: "300px" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar usuario..."
        />
        <div className="tabs">
          <button className={`tab ${!filterMonth ? "active" : ""}`} onClick={() => setFilterMonth(null)}>
            Todos
          </button>
          <button className={`tab ${filterMonth === currentMonth ? "active" : ""}`} onClick={() => setFilterMonth(filterMonth === currentMonth ? null : currentMonth)}>
            Este mes
          </button>
        </div>
        <button className="refresh-btn" onClick={() => {
          setLoading(true);
          api.get("/birthdays").then(({ data }) => setData(data)).catch(() => {}).finally(() => setLoading(false));
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          Actualizar
        </button>
      </div>

      {/* Meses */}
      {months.length === 0 ? (
        <div className="empty-state"><p>No se encontraron resultados</p></div>
      ) : (
        months.map((month) => (
          <MonthSection
            key={month.month}
            monthData={month}
            currentMonth={currentMonth}
            todayDay={todayDay}
          />
        ))
      )}
    </div>
  );
}