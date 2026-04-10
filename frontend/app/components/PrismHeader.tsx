import React from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function PrismHeader() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header style={{
      height: 56,
      background: "linear-gradient(90deg, #7C3AED 0%, #C026D3 40%, #E11D91 70%, #FF4D6D 100%)",
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      flexShrink: 0,
      position: "relative",
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 16, color: "#fff", lineHeight: 1 }}>△</span>
        <span style={{
          fontFamily: "var(--font-orbitron)",
          fontWeight: 900,
          fontSize: 20,
        }}>PRISM Analytics</span>
      </div>

      {/* Nav */}
      <nav style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 60,
        alignItems: "center",
      }}>
        {[
          { label: "ANALYTICS", active: true }
        ].map(({ label, active }) => (
          <span key={label} style={{
            fontFamily: "var(--font-rajdhani)",
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: active ? "#fff" : "rgba(255,255,255,0.75)",
            borderBottom: active ? "2px solid #fff" : "2px solid transparent",
            paddingBottom: 2,
            cursor: "pointer",
          }}>{label}</span>
        ))}
      </nav>

      {/* Right: Theme Toggle + User */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 20,
            padding: "4px 12px",
            color: "#fff",
            fontFamily: "var(--font-share-tech-mono)",
            fontSize: 11,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.2s",
          }}
        >
          <span style={{ fontSize: 13 }}>{theme === "dark" ? "🌙" : "☀️"}</span>
          {theme === "dark" ? "DARK_MODE" : "LIGHT_MODE"}
        </button>

        {/* User chip */}
        {user && (
          <>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 20,
              padding: "4px 12px 4px 6px",
            }}>
              {/* Avatar circle */}
              <div style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-orbitron)",
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span style={{
                fontFamily: "var(--font-share-tech-mono)",
                fontSize: 11,
                color: "#fff",
                letterSpacing: 0.5,
                maxWidth: 100,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {user.name.toUpperCase()}
              </span>
            </div>

            <button
              onClick={logout}
              title="Sign out"
              style={{
                background: "rgba(255,77,109,0.2)",
                border: "1px solid rgba(255,77,109,0.5)",
                borderRadius: 20,
                padding: "4px 12px",
                color: "#fff",
                fontFamily: "var(--font-share-tech-mono)",
                fontSize: 11,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,77,109,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,77,109,0.2)";
              }}
            >
              ⏻ LOGOUT
            </button>
          </>
        )}
      </div>
    </header>
  );
}
