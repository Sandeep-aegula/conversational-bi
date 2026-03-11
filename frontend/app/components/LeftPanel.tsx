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
  selectedCol: string | null;
  onSelectCol: (name: string) => void;
}

export default function LeftPanel({
  columns, uploadState, uploadError, onFile, selectedCol, onSelectCol
}: LeftPanelProps) {
  const [hoverUpload, setHoverUpload] = React.useState(false);

  return (
    <div style={{
      width: "22%",
      minWidth: 200,
      background: "#0D0B14",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      borderRight: "1px solid rgba(255,255,255,0.05)",
      flexShrink: 0,
    }}>
      {/* Upload Zone */}
      <div style={{ margin: 16, flexShrink: 0, position: "relative" }}>
        <label
          onMouseEnter={() => setHoverUpload(true)}
          onMouseLeave={() => setHoverUpload(false)}
          style={{
            display: "block",
            background: "rgba(124,58,237,0.08)",
            border: `1.5px dashed ${hoverUpload ? "rgba(225,29,145,0.7)" : "rgba(124,58,237,0.65)"}`,
            borderRadius: 12,
            padding: "32px 20px",
            textAlign: "center",
            cursor: "pointer",
            boxShadow: hoverUpload ? "0 0 20px rgba(124,58,237,0.3)" : "none",
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
      </div>

      {/* Active Columns Label */}
      <div style={{
        fontFamily: "var(--font-share-tech-mono)",
        fontSize: 10,
        color: "#64748B",
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
            color: "#334155",
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
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  background: isSelected
                    ? "linear-gradient(90deg, rgba(124,58,237,0.2), transparent)"
                    : "rgba(255,255,255,0.02)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <span style={{
                  fontFamily: "var(--font-share-tech-mono)",
                  fontSize: 13,
                  color: "#FFFFFF",
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
