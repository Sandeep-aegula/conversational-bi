"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  ComposedChart, Line,
} from "recharts";
import PrismHeader from "./PrismHeader";
import LeftPanel from "./LeftPanel";
import MiddlePanel from "./MiddlePanel";
import RightPanel from "./RightPanel";
import SheetTabBar from "./SheetTabBar";
import useSheets from "../hooks/useSheets";
import { CoreVolatility, SegmentIndex, LatencyBuffer, YieldFactor } from "./MiddlePanel";

// Direct backend URL — avoids proxy issues with multipart uploads
const BACKEND = "http://localhost:8000";
const CHART_COLORS = [
  "#7C3AED", "#00E5FF", "#E11D91", "#A3E635",
  "#FF6B2B", "#FF4D6D", "#00CED1", "#9333EA",
  "#3B82F6", "#10B981",
];

type ColType = "NUM" | "CAT" | "DATE" | "TEXT";
type FileInfo = {
  filename: string;
  rows: number;
  columns: number;
  headers: string[];
  numeric_cols: string[];
  cat_cols: string[];
};
type ChatMsg = { type: "user" | "ai"; text: string; charts?: any[] };

function guessType(col: string, numericCols: string[], catCols: string[]): ColType {
  const lower = col.toLowerCase();
  if (lower.includes("date") || lower.includes("time") || lower.includes("year") || lower.includes("month")) return "DATE";
  if (lower.includes("id") || lower.includes("name") || lower.includes("desc")) return "TEXT";
  if (numericCols.includes(col)) return "NUM";
  if (catCols.includes(col)) return "CAT";
  return "TEXT";
}

const tooltipStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--violet)",
  borderRadius: 8,
  fontFamily: "var(--font-share-tech-mono)",
  fontSize: 12,
  color: "var(--text-secondary)",
};

function renderChart(chart: any) {
  const { type, data, xAxisKey, yAxisKeys = [], nameKey, valueKey } = chart;
  if (!data || data.length === 0) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", gap: 8 }}>
      <span style={{ fontSize: 28 }}>📭</span>
      <span style={{ fontFamily: "var(--font-share-tech-mono)", fontSize: 11 }}>NO_DATA_RETURNED</span>
    </div>
  );

  const fmt = (v: number) => v > 1000000 ? `${(v / 1000000).toFixed(1)}M` : v > 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v * 100) / 100);
  const allKeys = Object.keys(data[0] || {});
  const xKey = xAxisKey || allKeys[0] || "label";
  const yKeys: string[] = yAxisKeys.length > 0 ? yAxisKeys : allKeys.filter((k: string) => k !== xKey && typeof data[0][k] === "number");
  const needsRotation = data.length > 6 || data.some((d: any) => String(d[xKey]).length > 8);
  const axisStyle = { stroke: "var(--border-card)", fontSize: 10, tickLine: false as const, axisLine: false as const };

  if (type === "pie") {
    const pieKey = valueKey || yAxisKeys[0] || Object.keys(data[0]).find((k: string) => typeof data[0][k] === "number") || Object.keys(data[0])[1];
    const labelKey = nameKey || xAxisKey || Object.keys(data[0])[0];
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <RechartsTooltip contentStyle={tooltipStyle} />
          <Pie data={data} dataKey={pieKey} nameKey={labelKey} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} strokeWidth={0}>
            {data.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} opacity={0.9} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === "area") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: needsRotation ? 50 : 10 }}>
          <defs>
            {yKeys.map((key: string, i: number) => (
              <linearGradient key={key} id={`ag-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.4} />
                <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
          <XAxis dataKey={xKey} {...axisStyle} angle={needsRotation ? -35 : 0} textAnchor={needsRotation ? "end" : "middle"} interval={0} tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
          <YAxis {...axisStyle} tickFormatter={fmt} tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
          <RechartsTooltip contentStyle={tooltipStyle} />
          {yKeys.map((key: string, i: number) => (
            <Area key={key} type="monotone" dataKey={key} stroke={CHART_COLORS[i % CHART_COLORS.length]} fill={`url(#ag-${i})`} strokeWidth={2} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: needsRotation ? 50 : 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
          <XAxis dataKey={xKey} {...axisStyle} angle={needsRotation ? -35 : 0} textAnchor={needsRotation ? "end" : "middle"} interval={0} tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
          <YAxis {...axisStyle} tickFormatter={fmt} tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
          <RechartsTooltip contentStyle={tooltipStyle} />
          {yKeys.map((key: string, i: number) => (
            <Line key={key} type="monotone" dataKey={key} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={data.length < 20} />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  // Default: bar
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: needsRotation ? 55 : 10 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
        <XAxis dataKey={xKey} {...axisStyle} angle={needsRotation ? -35 : 0} textAnchor={needsRotation ? "end" : "middle"} interval={0} tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickFormatter={(v: string) => String(v).slice(0, 14)} />
        <YAxis {...axisStyle} tickFormatter={fmt} tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
        <RechartsTooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--input-bg)" }} />
        {yKeys.map((key: string, i: number) => (
          <Bar key={key} dataKey={key} radius={[4, 4, 0, 0]}>
            {data.map((_: any, idx: number) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} fillOpacity={0.85} />)}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function Dashboard() {
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done">("idle");
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const {
    sheets,
    activeSheet,
    activeSheetId,
    switchSheet,
    addSheet,
    renameSheet,
    deleteSheet,
    duplicateSheet,
    updateSheetCharts,
    loadInitialCharts,
  } = useSheets([]);
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedCol, setSelectedCol] = useState<string | null>(null);
  const [showDataView, setShowDataView] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chartsContainerRef = useRef<HTMLDivElement>(null);

  const removeChart = (id: number) => {
    updateSheetCharts(activeSheetId, (prev: any[]) => prev.filter(c => c.id !== id));
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  const runQuery = useCallback(async (query: string, history: any[]) => {
    setIsQuerying(true);
    try {
      const res = await fetch(`${BACKEND}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, history }),
      });
      const result = await res.json();
      if (result.type === "dashboard" && result.charts?.length) {
        const newCharts = result.charts.map((c: any, i: number) => ({ ...c, id: Date.now() + i + Math.random() }));
        updateSheetCharts(activeSheetId, prev => [...newCharts, ...prev]);
        setChatHistory(prev => [...prev, { type: "ai", text: result.summary || "Charts generated.", charts: newCharts }]);
      } else if (Array.isArray(result) && result.length > 0 && result[0].sql) {
        // Handle case where result is directly a list of chart objects
        const newCharts = result.map((c: any, i: number) => ({ ...c, id: Date.now() + i + Math.random() }));
        updateSheetCharts(activeSheetId, prev => [...newCharts, ...prev]);
        setChatHistory(prev => [...prev, { type: "ai", text: "Multiple charts generated.", charts: newCharts }]);
      } else {
        setChatHistory(prev => [...prev, { type: "ai", text: result.summary || "Analysis complete." }]);
      }
    } catch {
      setChatHistory(prev => [...prev, { type: "ai", text: "⚠️ Backend unreachable. Ensure Python server is running on port 8000." }]);
    } finally {
      setIsQuerying(false);
    }
  }, [activeSheetId, updateSheetCharts]);

  const handleFile = useCallback(async (file: File) => {
    const filename = file.name.toLowerCase();
    const isSupported = filename.endsWith(".csv") || 
                        filename.endsWith(".txt") || 
                        filename.endsWith(".tsv") || 
                        filename.endsWith(".xlsx") || 
                        filename.endsWith(".xls");
                        
    if (!isSupported) { 
      setUploadError("Only .csv, .txt, or Excel files accepted."); 
      return; 
    }
    setUploadError("");
    setUploadState("uploading");
    loadInitialCharts([]); setChatHistory([]); setFileInfo(null);

    const formData = new FormData();
    formData.append("UPLOAD_SOURCE", file);

    try {
      const res = await fetch(`${BACKEND}/api/upload`, { method: "POST", body: formData });
      if (!res.ok) {
        let errorMsg = "Upload failed";
        try {
          const e = await res.json();
          if (typeof e.detail === "string") {
            errorMsg = e.detail;
          } else if (typeof e.detail === "object" && e.detail !== null) {
            errorMsg = JSON.stringify(e.detail);
          } else {
            errorMsg = e.message || errorMsg;
          }
        } catch {
          errorMsg = `Upload failed (HTTP ${res.status})`;
        }
        throw new Error(errorMsg);
      }
      const info: FileInfo = await res.json();
      setFileInfo(info);
      setUploadState("done");
      setShowDataView(true);

      const numCols = info.numeric_cols || [];
      const catCols = info.cat_cols || [];
      const allCols = info.headers || [];
      const c0 = catCols[0] || allCols[0] || "col";
      const n0 = numCols[0] || allCols[1] || allCols[0] || "col";

      // Multi-chart initial analysis with explicit type variety
      const initialQuery = `Generate 8 diverse and high-impact visualizations for this data using different chart types (bar, pie, line, area).
The goal is a comprehensive data report. Include:
1. Executive Summary: Top categories by volume (Bar)
2. Market Segmentation: Key distributions (Pie)
3. Longitudinal Trends: Period-over-period patterns (Area/Line)
4. Numerical Correlations: Relationship between key metrics (Scatter/Line)
5. Outlier Detection: Ranking of exceptions (Bar)
6. Cumulative Impact: Total contributions (Area)
7. Focused Insight: Specific high-relevance ranking (Bar/Pie)
8. Diversity Check: Another relevant perspective.
Return them as a JSON object with a 'charts' array. Each chart must have a unique insight focus.`;

      setChatHistory([{ type: "ai", text: `✓ Data source loaded: ${file.name} — ${info.rows.toLocaleString()} rows × ${info.columns} columns. Initializing comprehensive analysis...` }]);
      await runQuery(initialQuery, []);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed.");
      setUploadState("idle");
    }
  }, [runQuery]);

  // Reset everything for re-upload
  const handleReset = useCallback(() => {
    setUploadState("idle");
    setFileInfo(null);
    loadInitialCharts([]);
    setChatHistory([]);
    setInput("");
    setUploadError("");
    setSelectedCol(null);
    setShowDataView(false);
  }, []);

  // Export all charts to PDF
  const handleExportPDF = useCallback(async () => {
    if (!chartsContainerRef.current || activeSheet.charts.length === 0) return;

    setIsExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const pdf = new jsPDF("landscape", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Add title page
      pdf.setFillColor(10, 10, 15);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      pdf.setTextColor(124, 58, 237);
      pdf.setFontSize(32);
      pdf.text("PRISM", pageWidth / 2, pageHeight / 2 - 20, { align: "center" });
      pdf.setTextColor(203, 213, 225);
      pdf.setFontSize(14);
      pdf.text("Conversational Data Intelligence Report", pageWidth / 2, pageHeight / 2, { align: "center" });
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(10);
      pdf.text(`${fileInfo?.filename || "dataset"} · ${fileInfo?.rows?.toLocaleString() || "—"} records · ${fileInfo?.columns || "—"} columns`, pageWidth / 2, pageHeight / 2 + 15, { align: "center" });
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight / 2 + 25, { align: "center" });

      // Capture each chart individually
      const chartElements = chartsContainerRef.current.querySelectorAll("[data-chart-card]");
      for (let i = 0; i < chartElements.length; i++) {
        const el = chartElements[i] as HTMLElement;
        pdf.addPage();
        pdf.setFillColor(10, 10, 15);
        pdf.rect(0, 0, pageWidth, pageHeight, "F");

        const canvas = await html2canvas(el, {
          backgroundColor: "#111118",
          scale: 2,
          useCORS: true,
          logging: false,
        });

        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const yOffset = Math.max(10, (pageHeight - imgHeight) / 2);

        pdf.addImage(imgData, "PNG", 10, yOffset, imgWidth, Math.min(imgHeight, pageHeight - 20));
      }

      pdf.save(`PRISM_Report_${fileInfo?.filename?.replace(".csv", "") || "data"}_${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF Export error:", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [activeSheet.charts, fileInfo]);

  const handleChat = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isQuerying || !fileInfo) return;
    const userText = input.trim();
    const historyForApi = chatHistory.map(m => ({ role: m.type === "user" ? "user" : "model", parts: m.text }));
    setChatHistory(prev => [...prev, { type: "user", text: userText }]);
    setInput("");
    await runQuery(userText, historyForApi);
  }, [input, isQuerying, fileInfo, chatHistory, runQuery]);

  const columns = useMemo(() => {
    if (!fileInfo) return [];
    return fileInfo.headers.map(h => ({ name: h, type: guessType(h, fileInfo.numeric_cols, fileInfo.cat_cols) }));
  }, [fileInfo]);

  const chips = useMemo(() => {
    if (!fileInfo?.headers) return [];
    const h = fileInfo.headers;
    const n = fileInfo.numeric_cols;
    const c = fileInfo.cat_cols;
    return [
      n.length > 0 && c.length > 0 ? `Top 10 "${c[0]}" by "${n[0]}"` : `Count by "${h[0]}"`,
      c.length > 1 ? `Pie chart of "${c[1]}"` : `Show me insights`,
    ];
  }, [fileInfo]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "var(--bg-app)",
      overflow: "hidden",
    }}>
      <PrismHeader />

      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* Left Panel */}
        <LeftPanel
          columns={columns}
          uploadState={uploadState}
          uploadError={uploadError}
          onFile={handleFile}
          onReset={handleReset}
          selectedCol={selectedCol}
          onSelectCol={setSelectedCol}
          filename={fileInfo?.filename}
          rowCount={fileInfo?.rows}
          colCount={fileInfo?.columns}
        />

        {/* Middle: static PRISM charts OR dynamic data view */}
        {showDataView && fileInfo ? (
          <div style={{
            flex: 1,
            background: "var(--bg-app)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            padding: 16,
            gap: 16,
            minWidth: 0,
          }}>
            {/* Data header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div>
                <div style={{ fontFamily: "var(--font-share-tech-mono)", fontSize: 14, color: "var(--text-primary)", letterSpacing: 1 }}>
                  VISUALIZATION_BOARD
                </div>
                <div style={{ fontFamily: "var(--font-share-tech-mono)", fontSize: 10, color: "var(--text-muted)", letterSpacing: 1, marginTop: 4 }}>
                  {fileInfo.filename} · {fileInfo.rows.toLocaleString()} RECORDS · {fileInfo.columns} COLUMNS
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {isQuerying && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "rgba(124,58,237,0.1)",
                    border: "1px solid rgba(124,58,237,0.4)",
                    borderRadius: 20, padding: "6px 14px",
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7C3AED", animation: "ping 1s ease-in-out infinite" }} />
                    <span style={{ fontFamily: "var(--font-share-tech-mono)", fontSize: 11, color: "#9333EA" }}>ANALYZING...</span>
                  </div>
                )}
                {/* Export PDF Button */}
                {activeSheet.charts.length > 0 && (
                  <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: isExporting
                        ? "rgba(124,58,237,0.15)"
                        : "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(225,29,145,0.15))",
                      border: "1px solid rgba(124,58,237,0.4)",
                      borderRadius: 8,
                      padding: "6px 16px",
                      fontFamily: "var(--font-share-tech-mono)",
                      fontSize: 11,
                      color: isExporting ? "#64748B" : "#E11D91",
                      cursor: isExporting ? "wait" : "pointer",
                      letterSpacing: 1,
                      transition: "all 0.2s",
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{isExporting ? "⏳" : "📄"}</span>
                    {isExporting ? "EXPORTING..." : "EXPORT_PDF"}
                  </button>
                )}
              </div>
            </div>

            {/* KPI Row */}
            <div style={{ display: "flex", gap: 12, flexShrink: 0, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
              <CoreVolatility />
              <SegmentIndex />
              <LatencyBuffer />
              <YieldFactor />
            </div>

            {/* Main Content Area */}
            <div ref={chartsContainerRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", position: "relative" }}>
              {(activeSheet.charts.length === 0 && !isQuerying) ? (
                <div style={{
                  height: "100%", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", color: "var(--text-muted)", gap: 16
                }}>
                  <div style={{ fontSize: 48, opacity: 0.2 }}>◈</div>
                  <div style={{ fontFamily: "var(--font-share-tech-mono)", fontSize: 12, letterSpacing: 2 }}>
                    {activeSheet.name.toUpperCase()} IS EMPTY
                  </div>
                </div>
              ) : (
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
                  gap: 16, padding: 16,
                }}>
                  {isQuerying && (
                    <div style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-card)",
                      borderRadius: 14, padding: "18px 20px",
                      minHeight: 300,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      animation: "pulse 2s ease-in-out infinite",
                    }}>
                      <span style={{ fontFamily: "var(--font-share-tech-mono)", fontSize: 11, color: "var(--text-muted)", letterSpacing: 2 }}>PROCESSING_QUERY...</span>
                    </div>
                  )}
                  {activeSheet.charts.map(chart => (
                    <div
                      key={chart.id}
                      data-chart-card
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.3), 0 0 20px rgba(124,58,237,0.1)";
                        e.currentTarget.style.borderColor = "var(--violet)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.borderColor = "var(--border-card)";
                      }}
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-card)",
                        borderRadius: 14,
                        padding: "18px 20px",
                        minHeight: 300,
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        cursor: "default",
                      }}>
                      {/* Delete button */}
                      <button
                        onClick={() => removeChart(chart.id)}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = "var(--coral)";
                          e.currentTarget.style.color = "#fff";
                          e.currentTarget.style.borderColor = "var(--coral)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = "var(--input-bg)";
                          e.currentTarget.style.color = "var(--text-muted)";
                          e.currentTarget.style.borderColor = "var(--border-card)";
                        }}
                        style={{
                          position: "absolute",
                          top: 14,
                          right: 14,
                          background: "var(--input-bg)",
                          border: "1px solid var(--border-card)",
                          borderRadius: 6,
                          width: 28,
                          height: 28,
                          color: "var(--text-muted)",
                          fontSize: 16,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          zIndex: 10,
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                        title="Remove Chart"
                      >
                        <span style={{ transform: "translateY(-1px)" }}>🗑️</span>
                      </button>

                      <div style={{ marginBottom: 12, flexShrink: 0 }}>
                        <div style={{ fontFamily: "var(--font-share-tech-mono)", fontSize: 12, color: "var(--text-primary)", letterSpacing: 1 }}>
                          {(chart.title || "CHART").toUpperCase()}
                        </div>
                        <div style={{ fontFamily: "var(--font-share-tech-mono)", fontSize: 10, color: "var(--text-muted)", marginTop: 4, letterSpacing: 1 }}>
                          {chart.type?.toUpperCase()} · {chart.data?.length ?? 0} DATA_POINTS
                        </div>
                      </div>
                      <div style={{ flex: 1, minHeight: 0, height: 260 }}>
                        {renderChart(chart)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sheet Tab Bar */}
            <SheetTabBar
              sheets={sheets}
              activeSheetId={activeSheetId}
              onSwitch={switchSheet}
              onAdd={addSheet}
              onRename={renameSheet}
              onDelete={deleteSheet}
              onDuplicate={duplicateSheet}
              onExportClick={() => handleExportPDF()}
            />
          </div>
        ) : (
          <MiddlePanel />
        )}

        {/* Right Panel */}
        <RightPanel
          chatHistory={chatHistory}
          isQuerying={isQuerying}
          fileInfo={fileInfo}
          input={input}
          setInput={setInput}
          onSend={handleChat}
          chips={chips}
        />
      </div>

      <style>{`
        @keyframes ping {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        input::placeholder { color: #334155 !important; }
        input:focus { border-color: rgba(124,58,237,0.6) !important; outline: none !important; }
      `}</style>
    </div>
  );
}
