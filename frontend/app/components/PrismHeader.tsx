import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function PrismHeader() {
  const { theme, toggleTheme } = useTheme();

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
          color: "#fff",
          letterSpacing: 3,
        }}>ConversationBI</span>
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

      {/* Theme Toggle */}
      <div style={{ marginLeft: "auto" }}>
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
      </div>
    </header>
  );
}
