"use client";
import React from "react";

type ColType = "NUM" | "CAT" | "DATE" | "TEXT";

interface ColumnRow {
  name: string;
  type: ColType;
}

const typeConfig: Record<ColType, { border: string; badgeBg: string; badgeText: string }> = {
  NUM:  { border: "#00E5FF", badgeBg: "#0A2030", badgeText: "#00E5FF" },
  CAT:  { border: "#E11D91", badgeBg: "#2A0A1A", badgeText: "#E11D91" },
  DATE: { border: "#A3E635", badgeBg: "#1A2A0A", badgeText: "#A3E635" },
  TEXT: { border: "#FF6B2B", badgeBg: "#2A1A0A", badgeText: "#FF6B2B" },
};

interface LeftPanelProps {
  columns: ColumnRow[];
  uploadState: "idle" | "uploading" | "done";
  uploadError: string;
  onFile: (file: File) => void;
  onReset: () => void;
  selectedCol: string | null;
  onSelectCol: (name: string) => void;
  filename?: string;
  rowCount?: number;
  colCount?: number;
}

export default function LeftPanel({
  columns, uploadState, uploadError, onFile, onReset, selectedCol, onSelectCol,
  filename, rowCount, colCount,
}: LeftPanelProps) {
  const [hoverUpload, setHoverUpload] = React.useState(false);
  const [hoverReupload, setHoverReupload] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div style={{
      width: "22%",
      minWidth: 200,
      background: "var(--bg-panel)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      borderRight: "1px solid var(--border-main)",
      flexShrink: 0,
    }}>
      {/* Upload Zone */}
      <div style={{ margin: 16, flexShrink: 0, position: "relative" }}>
        {uploadState === "done" ? (
          /* ── File loaded state with re-upload button ── */
          <div style={{
            background: "rgba(163,230,53,0.06)",
            border: "1.5px solid rgba(163,230,53,0.3)",
            borderRadius: 12,
            padding: "16px 16px 12px",
            textAlign: "center",
          }}>
            <div style={{
              fontSize: 24,
              color: "#A3E635",
              lineHeight: 1,
              marginBottom: 8,
            }}>✓</div>
            <div style={{
              fontFamily: "var(--font-share-tech-mono)",
              fontSize: 11,
              color: "#A3E635",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 4,
            }}>SOURCE_LOADED</div>
            <div style={{
              fontFamily: "var(--font-share-tech-mono)",
              fontSize: 10,
              color: "#64748B",
              letterSpacing: 1,
              marginBottom: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>{filename || "file.csv"}</div>
            <div style={{
              fontFamily: "var(--font-share-tech-mono)",
              fontSize: 9,
              color: "var(--text-muted)",
              letterSpacing: 1,
              marginBottom: 12,
            }}>{rowCount?.toLocaleString() ?? "—"} ROWS · {colCount ?? "—"} COLS</div>

            {/* Hidden file input for re-upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={e => {
                if (e.target.files?.[0]) {
                  onReset();
                  onFile(e.target.files[0]);
                }
                // Reset so same file can be selected again
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={() => setHoverReupload(true)}
              onMouseLeave={() => setHoverReupload(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                width: "100%",
                padding: "10px 0",
                background: hoverReupload
                  ? "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(225,29,145,0.15))"
                  : "rgba(124,58,237,0.1)",
                border: `1px solid ${hoverReupload ? "rgba(124,58,237,0.6)" : "rgba(124,58,237,0.3)"}`,
                borderRadius: 8,
                fontFamily: "var(--font-share-tech-mono)",
                fontSize: 11,
                color: hoverReupload ? "#E11D91" : "#7C3AED",
                letterSpacing: 2,
                cursor: "pointer",
                transition: "all 0.2s",
                textTransform: "uppercase",
              }}
            >
              <span style={{ fontSize: 14 }}>↻</span>
              RE-UPLOAD
            </button>
          </div>
        ) : (
          /* ── Initial upload zone ── */
          <label
            onMouseEnter={() => setHoverUpload(true)}
            onMouseLeave={() => setHoverUpload(false)}
            style={{
              display: "block",
              background: "var(--input-bg)",
              border: `1.5px dashed ${hoverUpload ? "rgba(225,29,145,0.7)" : "rgba(124,58,237,0.65)"}`,
              borderRadius: 12,
              padding: "32px 20px",
              textAlign: "center",
              cursor: "pointer",
              boxShadow: hoverUpload ? "0 0 20px var(--accent-glow)" : "none",
              transition: "all 0.2s",
            }}
          >
            <input
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]); }}
            />
            <div style={{
              fontSize: 40,
              color: hoverUpload ? "#E11D91" : "#7C3AED",
              lineHeight: 1,
              transition: "color 0.2s",
            }}>△</div>
            <div style={{
              fontFamily: "var(--font-share-tech-mono)",
              fontSize: 13,
              color: hoverUpload ? "#E11D91" : "#7C3AED",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginTop: 14,
              transition: "color 0.2s",
            }}>
              {uploadState === "uploading" ? "PROCESSING..." : "UPLOAD_SOURCE"}
            </div>
            {uploadError && (
              <div style={{
                marginTop: 10,
                fontFamily: "var(--font-share-tech-mono)",
                fontSize: 10,
                color: "#FF6B2B",
                letterSpacing: 1,
              }}>{uploadError}</div>
            )}
          </label>
        )}
      </div>

      {/* Active Columns Label */}
      <div style={{
        fontFamily: "var(--font-share-tech-mono)",
        fontSize: 10,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: 2,
        margin: "20px 16px 8px",
        flexShrink: 0,
      }}>ACTIVE_COLUMNS</div>

      {/* Column Rows */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {columns.length === 0 ? (
          <div style={{
            padding: "24px 16px",
            fontFamily: "var(--font-share-tech-mono)",
            fontSize: 11,
            color: "var(--text-muted)",
            letterSpacing: 1,
            textAlign: "center",
          }}>AWAITING_DATA...</div>
        ) : (
          columns.map((col) => {
            const cfg = typeConfig[col.type] || typeConfig.TEXT;
            const isSelected = selectedCol === col.name;
            return (
              <div
                key={col.name}
                onClick={() => onSelectCol(col.name)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 16px",
                  height: 46,
                  borderLeft: `3px solid ${isSelected ? "#7C3AED" : cfg.border}`,
                  borderBottom: "1px solid var(--border-main)",
                  background: isSelected
                    ? "linear-gradient(90deg, rgba(124,58,237,0.2), transparent)"
                    : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <span style={{
                  fontFamily: "var(--font-share-tech-mono)",
                  fontSize: 13,
                  color: "var(--text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "65%",
                }}>{col.name}</span>
                <span style={{
                  fontFamily: "var(--font-share-tech-mono)",
                  fontWeight: 700,
                  fontSize: 11,
                  color: cfg.badgeText,
                  background: cfg.badgeBg,
                  borderRadius: 4,
                  padding: "2px 6px",
                  flexShrink: 0,
                }}>{col.type}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
