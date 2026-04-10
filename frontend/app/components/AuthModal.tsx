"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

type Mode = "signin" | "signup";

export default function AuthModal() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setTimeout(() => firstInputRef.current?.focus(), 300);
  }, []);

  useEffect(() => {
    setError("");
    setName("");
    setEmail("");
    setPassword("");
    setTimeout(() => firstInputRef.current?.focus(), 100);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err =
      mode === "signin"
        ? await login(email, password)
        : await signup(name, email, password);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at 30% 20%, rgba(124,58,237,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(225,29,145,0.1) 0%, transparent 60%), #0A0A0F",
        zIndex: 9999,
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
    >
      {/* Animated grid background */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
        pointerEvents: "none",
      }} />

      {/* Floating orbs */}
      <div style={{
        position: "absolute",
        top: "15%",
        left: "10%",
        width: 300,
        height: 300,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
        filter: "blur(40px)",
        animation: "orbFloat 6s ease-in-out infinite",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: "15%",
        right: "10%",
        width: 250,
        height: 250,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(225,29,145,0.1) 0%, transparent 70%)",
        filter: "blur(40px)",
        animation: "orbFloat 8s ease-in-out infinite reverse",
        pointerEvents: "none",
      }} />

      {/* Card */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 460,
          margin: "0 20px",
          background: "rgba(13,11,20,0.92)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(124,58,237,0.25)",
          borderRadius: 20,
          padding: "40px 40px 36px",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(124,58,237,0.1)",
          transform: mounted ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
          transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Logo / Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(225,29,145,0.2))",
            border: "1px solid rgba(124,58,237,0.4)",
            marginBottom: 16,
            boxShadow: "0 0 24px rgba(124,58,237,0.2)",
          }}>
            <span style={{ fontSize: 24 }}>◈</span>
          </div>
          <div style={{
            fontFamily: "var(--font-orbitron)",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 3,
            background: "linear-gradient(135deg, #7C3AED, #E11D91)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            PRISM
          </div>
          <div style={{
            fontFamily: "var(--font-share-tech-mono)",
            fontSize: 10,
            color: "var(--text-muted)",
            letterSpacing: 2,
            marginTop: 4,
          }}>
            CONVERSATIONAL DATA INTELLIGENCE
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: "flex",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: 4,
          marginBottom: 28,
          position: "relative",
        }}>
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: "10px 0",
                border: "none",
                borderRadius: 9,
                background: mode === m
                  ? "linear-gradient(135deg, rgba(124,58,237,0.4), rgba(225,29,145,0.25))"
                  : "transparent",
                color: mode === m ? "#fff" : "var(--text-muted)",
                fontFamily: "var(--font-share-tech-mono)",
                fontSize: 11,
                letterSpacing: 1.5,
                cursor: "pointer",
                transition: "all 0.25s ease",
                boxShadow: mode === m ? "0 0 16px rgba(124,58,237,0.2)" : "none",
                outline: "none",
              }}
            >
              {m === "signin" ? "SIGN_IN" : "SIGN_UP"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mode === "signup" && (
            <Field
              label="FULL_NAME"
              type="text"
              value={name}
              onChange={setName}
              placeholder="John Doe"
              inputRef={mode === "signup" ? firstInputRef : undefined}
            />
          )}
          <Field
            label="EMAIL_ADDRESS"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="user@domain.com"
            inputRef={mode === "signin" ? firstInputRef : undefined}
          />
          <div>
            <label style={labelStyle}>PASSWORD</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Min. 6 characters" : "Enter password"}
                required
                style={{ ...inputStyle, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 16,
                  padding: 0,
                  lineHeight: 1,
                }}
                tabIndex={-1}
                title={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,77,109,0.08)",
              border: "1px solid rgba(255,77,109,0.3)",
              borderRadius: 8,
              padding: "10px 14px",
            }}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <span style={{ fontFamily: "var(--font-share-tech-mono)", fontSize: 11, color: "#FF4D6D", letterSpacing: 0.5 }}>
                {error}
              </span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: "14px 0",
              borderRadius: 12,
              border: "none",
              background: loading
                ? "rgba(124,58,237,0.3)"
                : "linear-gradient(135deg, #7C3AED 0%, #E11D91 100%)",
              color: "#fff",
              fontFamily: "var(--font-share-tech-mono)",
              fontSize: 13,
              letterSpacing: 2,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.25s ease",
              boxShadow: loading ? "none" : "0 0 24px rgba(124,58,237,0.35)",
              opacity: loading ? 0.7 : 1,
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.boxShadow = "0 0 36px rgba(124,58,237,0.5)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 0 24px rgba(124,58,237,0.35)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ display: "inline-block", width: 10, height: 10, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                AUTHENTICATING...
              </span>
            ) : (
              mode === "signin" ? "INITIALIZE_SESSION →" : "CREATE_ACCOUNT →"
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: 24,
          textAlign: "center",
          fontFamily: "var(--font-share-tech-mono)",
          fontSize: 10,
          color: "var(--text-muted)",
          letterSpacing: 1,
        }}>
          {mode === "signin" ? "NEW_USER?" : "EXISTING_USER?"}{" "}
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            style={{
              background: "none",
              border: "none",
              color: "#7C3AED",
              cursor: "pointer",
              fontFamily: "var(--font-share-tech-mono)",
              fontSize: 10,
              letterSpacing: 1,
              textDecoration: "underline",
              padding: 0,
            }}
          >
            {mode === "signin" ? "REGISTER_HERE" : "SIGN_IN_HERE"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-share-tech-mono)",
  fontSize: 10,
  color: "var(--text-muted)",
  letterSpacing: 1.5,
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  color: "var(--text-primary)",
  fontFamily: "var(--font-share-tech-mono)",
  fontSize: 13,
  outline: "none",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  boxSizing: "border-box",
};

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  inputRef,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputStyle,
          borderColor: focused ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.08)",
          boxShadow: focused ? "0 0 0 3px rgba(124,58,237,0.1)" : "none",
        }}
      />
    </div>
  );
}
