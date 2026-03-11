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

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
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
  background: "rgba(5,5,7,0.97)",
  border: "1px solid rgba(124,58,237,0.6)",
  borderRadius: 8,
  fontFamily: "var(--font-share-tech-mono)",
  fontSize: 12,
  color: "#CBD5E1",
};

function renderChart(chart: any) {
  const { type, data, xAxisKey, yAxisKeys = [], nameKey, valueKey } = chart;
  if (!data || data.length === 0) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#334155", gap: 8 }}>
      <span style={{ fontSize: 28 }}>📭</span>
      <span style={{ fontFamily: "var(--font-share-tech-mono)", fontSize: 11 }}>NO_DATA_RETURNED</span>
    </div>
  );

  const fmt = (v: number) => v > 1000000 ? `${(v / 1000000).toFixed(1)}M` : v > 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v * 100) / 100);
  const allKeys = Object.keys(data[0] || {});
  const xKey = xAxisKey || allKeys[0] || "label";
  const yKeys: string[] = yAxisKeys.length > 0 ? yAxisKeys : allKeys.filter((k: string) => k !== xKey && typeof data[0][k] === "number");
  const needsRotation = data.length > 6 || data.some((d: any) => String(d[xKey]).length > 8);
  const axisStyle = { stroke: "#334155", fontSize: 10, tickLine: false as const, axisLine: false as const };

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
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey={xKey} {...axisStyle} angle={needsRotation ? -35 : 0} textAnchor={needsRotation ? "end" : "middle"} interval={0} tick={{ fontSize: 10, fill: "#475569" }} />
          <YAxis {...axisStyle} tickFormatter={fmt} tick={{ fontSize: 10, fill: "#475569" }} />
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
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey={xKey} {...axisStyle} angle={needsRotation ? -35 : 0} textAnchor={needsRotation ? "end" : "middle"} interval={0} tick={{ fontSize: 10, fill: "#475569" }} />
          <YAxis {...axisStyle} tickFormatter={fmt} tick={{ fontSize: 10, fill: "#475569" }} />
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
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey={xKey} {...axisStyle} angle={needsRotation ? -35 : 0} textAnchor={needsRotation ? "end" : "middle"} interval={0} tick={{ fontSize: 10, fill: "#475569" }} tickFormatter={(v: string) => String(v).slice(0, 14)} />
        <YAxis {...axisStyle} tickFormatter={fmt} tick={{ fontSize: 10, fill: "#475569" }} />
        <RechartsTooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
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
  const [charts, setCharts] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedCol, setSelectedCol] = useState<string | null>(null);
  const [showDataView, setShowDataView] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
        setCharts(prev => [...newCharts, ...prev]);
        setChatHistory(prev => [...prev, { type: "ai", text: result.summary || "Charts generated.", charts: newCharts }]);
      } else {
        setChatHistory(prev => [...prev, { type: "ai", text: result.summary || "Analysis complete." }]);
      }
    } catch {
      setChatHistory(prev => [...prev, { type: "ai", text: "⚠️ Backend unreachable. Ensure Python server is running on port 8000." }]);
    } finally {
      setIsQuerying(false);
    }
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv")) { setUploadError("Only .csv files accepted."); return; }
    setUploadError("");
    setUploadState("uploading");
    setCharts([]); setChatHistory([]); setFileInfo(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${BACKEND}/api/upload`, { method: "POST", body: formData });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Upload failed"); }
      const info: FileInfo = await res.json();
      setFileInfo(info);
      setUploadState("done");
      setShowDataView(true);

      const numCols = info.numeric_cols || [];
      const catCols = info.cat_cols || [];
      const allCols = info.headers || [];
      const c0 = catCols[0] || allCols[0] || "col";
      const n0 = numCols[0] || allCols[1] || allCols[0] || "col";

      const chartQuery = numCols.length > 0 && catCols.length > 0
        ? `Show a bar chart of the top 15 "${c0}" values ordered by total "${n0}"`
        : `Show a bar chart of record count grouped by "${allCols[0]}", top 15`;

      setChatHistory([{ type: "ai", text: `✓ Data source loaded: ${file.name} — ${info.rows.toLocaleString()} rows × ${info.columns} columns. Running initial analysis...` }]);
      await runQuery(`Give me a 2-sentence summary of this dataset.`, []);
      await runQuery(chartQuery, []);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed.");
      setUploadState("idle");
    }
  }, [runQuery]);

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
      background: "#0A0A0F",
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
          selectedCol={selectedCol}
          onSelectCol={setSelectedCol}
        />

        {/* Middle: static PRISM charts OR dynamic data view */}
        {showDataView && fileInfo ? (
          <div style={{
            flex: 1,
            background: "#0A0A0F",
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
                <div style={{ fontFamily: "var(--font-share-tech-mono)", fontSize: 14, color: "#fff", letterSpacing: 1 }}>
                  VISUALIZATION_BOARD
                </div>
                <div style={{ fontFamily: "var(--font-share-tech-mono)", fontSize: 10, color: "#64748B", letterSpacing: 1, marginTop: 4 }}>
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
                <button
                  onClick={() => setShowDataView(false)}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: "6px 14px",
                    fontFamily: "var(--font-share-tech-mono)",
                    fontSize: 11,
                    color: "#64748B",
                    cursor: "pointer",
                  }}>← PRISM_VIEW</button>
              </div>
            </div>

            {/* Dynamic charts grid */}
            {charts.length === 0 && !isQuerying ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 12 }}>
                <div style={{ fontSize: 40, color: "#7C3AED" }}>◈</div>
                <div style={{ fontFamily: "var(--font-share-tech-mono)", fontSize: 12, color: "#334155", letterSpacing: 2 }}>GENERATING_VISUALIZATIONS...</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 16 }}>
                {isQuerying && (
                  <div style={{
                    background: "#111118",
                    border: "1px solid rgba(124,58,237,0.15)",
                    borderRadius: 14, padding: "18px 20px",
                    minHeight: 300,
                    animation: "pulse 2s ease-in-out infinite",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontFamily: "var(--font-share-tech-mono)", fontSize: 11, color: "#334155", letterSpacing: 2 }}>PROCESSING_QUERY...</span>
                  </div>
                )}
                {charts.map(chart => (
                  <div key={chart.id} style={{
                    background: "#111118",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 14, padding: "18px 20px",
                    minHeight: 300,
                    display: "flex", flexDirection: "column",
                  }}>
                    <div style={{ marginBottom: 12, flexShrink: 0 }}>
                      <div style={{ fontFamily: "var(--font-share-tech-mono)", fontSize: 12, color: "#fff", letterSpacing: 1 }}>
                        {(chart.title || "CHART").toUpperCase()}
                      </div>
                      <div style={{ fontFamily: "var(--font-share-tech-mono)", fontSize: 10, color: "#64748B", marginTop: 4, letterSpacing: 1 }}>
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
