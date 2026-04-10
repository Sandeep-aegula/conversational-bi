"use client";
import React, { useState, useRef, useEffect } from "react";

type ChatMsg = { type: "user" | "ai"; text: string };

interface RightPanelProps {
  chatHistory: ChatMsg[];
  isQuerying: boolean;
  fileInfo: { filename: string } | null;
  input: string;
  setInput: (v: string) => void;
  onSend: (e: React.FormEvent) => void;
  chips: string[];
}

export default function RightPanel({
  chatHistory, isQuerying, fileInfo, input, setInput, onSend, chips,
}: RightPanelProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [hoverChip, setHoverChip] = useState<number | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  return (
    <div style={{
      width: "26%",
      minWidth: 240,
      background: "var(--bg-panel)",
      display: "flex",
      flexDirection: "column",
      borderLeft: "1px solid var(--border-main)",
      flexShrink: 0,
      overflow: "hidden",
    }}>
      {/* Panel Header */}
      <div style={{ padding: "20px 20px 12px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, background: "#00E5FF", transform: "rotate(45deg)", flexShrink: 0 }} />
          <span style={{
            fontFamily: "var(--font-orbitron)",
            fontWeight: 700,
            fontSize: 14,
            color: "var(--text-primary)",
            letterSpacing: 2,
          }}>NEURAL_CORE</span>
          {isQuerying && (
            <div style={{
              marginLeft: "auto",
              width: 8, height: 8,
              borderRadius: "50%",
              background: "#00E5FF",
              animation: "ping 1s ease-in-out infinite",
            }} />
          )}
        </div>
        <div style={{
          fontFamily: "var(--font-share-tech-mono)",
          fontSize: 10,
          color: "var(--text-muted)",
          letterSpacing: "1.5px",
          marginTop: 4,
        }}>
          {fileInfo ? `ACTIVE • ${fileInfo.filename.slice(0, 20)}` : "READY FOR QUERIES..."}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "0 0 8px",
        background: "var(--bg-panel)",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        minHeight: 0,
      }}>
        {chatHistory.length === 0 ? (
          <div style={{
            margin: "auto",
            textAlign: "center",
            padding: "32px 20px",
          }}>
            <div style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: 10,
              padding: "14px 16px",
              margin: "0 16px",
            }}>
              <div style={{
                fontFamily: "var(--font-share-tech-mono)",
                fontSize: 10,
                color: "#00E5FF",
                letterSpacing: 2,
                marginBottom: 8,
              }}>• SYSTEM</div>
              <div style={{
                fontFamily: "var(--font-rajdhani)",
                fontSize: 14,
                color: "var(--text-primary)",
                lineHeight: 1.6,
                fontStyle: "italic",
              }}>
                {fileInfo ? "Initializing neural trajectory..." : "Upload a data source to begin analysis."}
              </div>
            </div>
          </div>
        ) : (
          chatHistory.map((msg, idx) => {
            if (msg.type === "ai") {
              const isOffTopic = msg.text.startsWith("⛔");
              // Highlight anomaly text
              const parts = msg.text.split(/(anomal\w*|Anomal\w*)/g);
              return (
                <div key={idx} style={{ margin: "0 16px 12px" }}>
                  <div style={{
                    background: isOffTopic ? "rgba(255,107,43,0.06)" : "var(--bg-card)",
                    border: `1px solid ${isOffTopic ? "rgba(255,107,43,0.35)" : "var(--border-card)"}`,
                    borderRadius: 10,
                    padding: "14px 16px",
                  }}>
                    <div style={{
                      fontFamily: "var(--font-share-tech-mono)",
                      fontSize: 10,
                      color: isOffTopic ? "#FF6B2B" : "#00E5FF",
                      letterSpacing: 2,
                      marginBottom: 8,
                    }}>{isOffTopic ? "⚠ SCOPE_VIOLATION" : "• SYSTEM"}</div>
                    <div style={{
                      fontFamily: "var(--font-rajdhani)",
                      fontSize: 14,
                      color: isOffTopic ? "#FCA97A" : "var(--text-secondary)",
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}>
                      {parts.map((part, i) =>
                        /anomal/i.test(part)
                          ? <span key={i} style={{ color: "#FF6B2B" }}>{part}</span>
                          : part
                      )}
                    </div>
                  </div>
                </div>
              );

            } else {
              return (
                <div key={idx} style={{ margin: "0 16px 12px", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <div style={{
                    fontFamily: "var(--font-share-tech-mono)",
                    fontSize: 9,
                    color: "#9333EA",
                    letterSpacing: "1.5px",
                    marginBottom: 6,
                    textTransform: "uppercase",
                  }}>USER_ADMIN</div>
                  <div style={{
                    background: "var(--violet)",
                    borderRadius: "12px 12px 2px 12px",
                    padding: "12px 16px",
                    maxWidth: "85%",
                    boxShadow: "0 4px 12px var(--accent-glow)",
                  }}>
                    <div style={{
                      fontFamily: "var(--font-rajdhani)",
                      fontSize: 13,
                      color: "#FFFFFF",
                      lineHeight: 1.5,
                      wordBreak: "break-word",
                    }}>{msg.text}</div>
                  </div>
                </div>
              );
            }
          })
        )}
        {isQuerying && (
          <div style={{ margin: "0 16px 12px" }}>
            <div style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: 10,
              padding: "14px 16px",
            }}>
              <div style={{ fontFamily: "var(--font-share-tech-mono)", fontSize: 10, color: "#00E5FF", letterSpacing: 2, marginBottom: 8 }}>• SYSTEM</div>
              <div style={{
                fontFamily: "var(--font-rajdhani)",
                fontSize: 13,
                color: "var(--text-muted)",
                fontStyle: "italic",
              }}>Initializing neural trajectory...</div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div style={{ padding: "12px 16px 8px", flexShrink: 0, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {chips.slice(0, 2).map((chip, i) => (
          <button
            key={i}
            onClick={() => setInput(chip)}
            onMouseEnter={() => setHoverChip(i)}
            onMouseLeave={() => setHoverChip(null)}
            style={{
              background: "var(--input-bg)",
              border: `1px solid ${hoverChip === i ? "rgba(0,229,255,0.4)" : "var(--border-card)"}`,
              borderRadius: 20,
              padding: "6px 14px",
              fontFamily: "var(--font-share-tech-mono)",
              fontSize: 11,
              color: hoverChip === i ? "#00E5FF" : "var(--text-muted)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}>
            # {chip.slice(0, 16)}
          </button>
        ))}
        {fileInfo && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setInput("SCAN_ANOMALY")}
              onMouseEnter={() => setHoverChip(10)}
              onMouseLeave={() => setHoverChip(null)}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${hoverChip === 10 ? "rgba(0,229,255,0.4)" : "rgba(255,255,255,0.12)"}`,
                borderRadius: 20,
                padding: "6px 14px",
                fontFamily: "var(--font-share-tech-mono)",
                fontSize: 11,
                color: hoverChip === 10 ? "#00E5FF" : "#94A3B8",
                cursor: "pointer",
                transition: "all 0.15s",
              }}>
              # SCAN_ANOMALY
            </button>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form onSubmit={onSend} style={{ margin: "0 12px 16px", position: "relative", flexShrink: 0 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="ASK_PRISM..."
          disabled={!fileInfo || isQuerying}
          style={{
            width: "100%",
            background: "var(--input-bg)",
            border: "1px solid var(--border-card)",
            borderBottom: "2px solid var(--violet)",
            borderRadius: 10,
            padding: "12px 56px 12px 16px",
            fontFamily: "var(--font-share-tech-mono)",
            fontSize: 13,
            color: "var(--text-primary)",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <button
          type="submit"
          disabled={!fileInfo || isQuerying || !input.trim()}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "linear-gradient(135deg, #7C3AED, #E11D91)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(124,58,237,0.45)",
            fontSize: 14,
            color: "#fff",
            opacity: (!fileInfo || isQuerying || !input.trim()) ? 0.4 : 1,
            transition: "opacity 0.2s",
          }}>➤</button>
      </form>

      <style>{`
        @keyframes ping {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
