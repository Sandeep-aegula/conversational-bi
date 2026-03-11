"use client";
import React from "react";

export default function PrismHeader() {
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
          // { label: "DATA_STREAM", active: false },
          // { label: "ARCHIVE", active: false },
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

      {/* Avatar */}
      {/* <div style={{ marginLeft: "auto" }}>
        <div style={{
          width: 36, height: 36,
          borderRadius: "50%",
          background: "#E11D91",
          border: "2px solid #FF4D6D",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-rajdhani)",
          fontWeight: 700,
          fontSize: 13,
          color: "#fff",
          cursor: "pointer",
        }}>JP</div>
      </div> */}
    </header>
  );
}
