"use client";

import Dashboard from "./components/Dashboard";
import AuthModal from "./components/AuthModal";
import { useAuth } from "./context/AuthContext";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0A0A0F",
        flexDirection: "column",
        gap: 16,
      }}>
        <div style={{
          fontFamily: "var(--font-orbitron)",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: 3,
          background: "linear-gradient(135deg, #7C3AED, #E11D91)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>PRISM</div>
        <div style={{ fontSize: 10, fontFamily: "var(--font-share-tech-mono)", color: "#64748B", letterSpacing: 2 }}>
          INITIALIZING...
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
    <main className="min-h-screen bg-[#080B14] text-white">
      <Dashboard />
    </main>
  );
}
