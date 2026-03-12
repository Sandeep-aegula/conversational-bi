"use client";
import React from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter,
  ResponsiveContainer, Tooltip,
} from "recharts";

const tooltipStyle = {
  background: "rgba(5,5,7,0.97)",
  border: "1px solid rgba(124,58,237,0.6)",
  borderRadius: 8,
  fontFamily: "var(--font-share-tech-mono)",
  fontSize: 12,
  color: "#CBD5E1",
};

// Static KPI data
const temporalData = [
  { name: "A", v: 55 },
  { name: "B", v: 90 },
  { name: "C", v: 60 },
  { name: "D", v: 80 },
];
const TEMPORAL_COLORS = ["#7C3AED", "#00E5FF", "#E11D91", "#A3E635"];

const assetData = [
  { name: "CRITICAL", value: 75 },
  { name: "STABLE",   value: 25 },
];
const ASSET_COLORS = ["#FF6B2B", "var(--border-card)"];

const scatterData = [
  { x: 20, y: 80, r: 7, color: "#00E5FF" },
  { x: 75, y: 70, r: 5, color: "#64748B" },
  { x: 30, y: 50, r: 6, color: "#A3E635" },
  { x: 50, y: 45, r: 8, color: "#FF6B2B" },
  { x: 70, y: 42, r: 7, color: "#E11D91" },
  { x: 18, y: 25, r: 5, color: "#7C3AED" },
  { x: 50, y: 18, r: 9, color: "#E11D91" },
  { x: 80, y: 20, r: 6, color: "#A3E635" },
];

const miniBarData = [40, 60, 100, 70, 85];
const regionalData = [
  { city: "TOKYO",  pct: 92, grad: "linear-gradient(90deg, #E11D91, #FF4D6D)" },
  { city: "LONDON", pct: 45, grad: "linear-gradient(90deg, #00E5FF, #00CED1)" },
  { city: "NYC",    pct: 78, grad: "linear-gradient(90deg, #A3E635, #00FFA3)" },
];

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-card)",
      borderRadius: 14,
      padding: "18px 20px",
      ...style,
    }}>{children}</div>
  );
}

function MonoLabel({ children, color = "var(--text-muted)", size = 11, style }: {
  children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      fontFamily: "var(--font-share-tech-mono)",
      fontSize: size,
      color,
      textTransform: "uppercase",
      letterSpacing: "1.5px",
      ...style,
    }}>{children}</div>
  );
}

function KpiValue({ children, color = "var(--text-primary)", size = 28 }: { children: React.ReactNode; color?: string; size?: number }) {
  return (
    <div style={{
      fontFamily: "var(--font-orbitron)",
      fontWeight: 700,
      fontSize: size,
      color,
      margin: "10px 0 12px",
    }}>{children}</div>
  );
}

// KPI Cards
function CoreVolatility() {
  return (
    <Card style={{ background: "#1A1025", borderTop: "2px solid #7C3AED", flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <MonoLabel color="#7C3AED" size={9}>CORE<br />VOLATILITY</MonoLabel>
        <span style={{ color: "#fff", fontSize: 14 }}>△</span>
      </div>
      <KpiValue>84.2%</KpiValue>
      <div style={{ height: 3, background: "var(--border-main)", borderRadius: 2 }}>
        <div style={{ height: "100%", width: "65%", background: "linear-gradient(90deg, #7C3AED, #9333EA)", borderRadius: 2 }} />
      </div>
    </Card>
  );
}

function SegmentIndex() {
  return (
    <Card style={{ background: "#1A0E1A", borderTop: "2px solid #E11D91", flex: 1 }}>
      <MonoLabel color="#E11D91" size={9}>SEGMENT INDEX</MonoLabel>
      <KpiValue>1,204</KpiValue>
      <div style={{ display: "flex", gap: 4 }}>
        {["#E11D91", "#FF4D6D", "var(--border-main)", "var(--border-main)", "var(--border-main)"].map((c, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
        ))}
      </div>
    </Card>
  );
}

function LatencyBuffer() {
  return (
    <Card style={{ background: "#0A1520", borderTop: "2px solid #00E5FF", flex: 1 }}>
      <MonoLabel color="#00E5FF" size={9}>LATENCY BUFFER</MonoLabel>
      <KpiValue>12ms</KpiValue>
      <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 28 }}>
        {miniBarData.map((h, i) => (
          <div key={i} style={{
            width: 8,
            height: `${h}%`,
            background: "#00E5FF",
            borderRadius: "2px 2px 0 0",
          }} />
        ))}
      </div>
    </Card>
  );
}

function YieldFactor() {
  return (
    <Card style={{ background: "#141A0E", borderTop: "2px solid #A3E635", flex: 1 }}>
      <MonoLabel color="#A3E635" size={9}>YIELD FACTOR</MonoLabel>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "10px 0 8px" }}>
        <span style={{ fontFamily: "var(--font-share-tech-mono)", fontSize: 16, color: "#A3E635" }}>Φ</span>
        <span style={{ fontFamily: "var(--font-orbitron)", fontWeight: 700, fontSize: 32, color: "#A3E635" }}>2.1</span>
      </div>
      <MonoLabel color="#A3E635" size={9} style={{ opacity: 0.6 }}>LIVE_OPTIMIZATION</MonoLabel>
    </Card>
  );
}

// Custom scatter dot
function CustomScatterDot(props: any) {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  return (
    <circle
      cx={cx} cy={cy} r={payload.r}
      fill={payload.color}
      opacity={0.9}
      style={{ filter: `drop-shadow(0 0 6px ${payload.color})` }}
    />
  );
}

export default function MiddlePanel() {
  return (
    <div style={{
      flex: 1,
      background: "var(--bg-app)",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      padding: 16,
      overflowY: "auto",
      minWidth: 0,
    }}>
      {/* KPI Row */}
      <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
        <CoreVolatility />
        <SegmentIndex />
        <LatencyBuffer />
        <YieldFactor />
      </div>

      {/* Chart Row 1 */}
      <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 240 }}>
        {/* Temporal Flux */}
        <Card style={{ flex: "0 0 60%", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexShrink: 0 }}>
            <MonoLabel color="var(--text-primary)" size={13} style={{ letterSpacing: 1 }}>TEMPORAL_FLUX_ANALYSIS</MonoLabel>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#7C3AED" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00E5FF" }} />
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={temporalData} barCategoryGap="30%">
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                  {temporalData.map((_, i) => (
                    <Cell key={i} fill={TEMPORAL_COLORS[i % TEMPORAL_COLORS.length]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Asset Distribution */}
        <Card style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <MonoLabel style={{ marginBottom: 8 }}>ASSET<br />DISTRIBUTION</MonoLabel>
          <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetData}
                  cx="50%" cy="45%"
                  innerRadius={60} outerRadius={84}
                  dataKey="value"
                  strokeWidth={0}
                  startAngle={90} endAngle={-270}
                >
                  {assetData.map((_, i) => <Cell key={i} fill={ASSET_COLORS[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Donut center */}
            <div style={{
              position: "absolute",
              top: "44%",
              left: "50%",
              transform: "translate(-50%, -55%)",
              textAlign: "center",
            }}>
              <div style={{ fontFamily: "var(--font-orbitron)", fontWeight: 900, fontSize: 30, color: "var(--text-primary)" }}>64</div>
              <MonoLabel color="var(--text-muted)" size={10} style={{ letterSpacing: 2 }}>NODES</MonoLabel>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8, flexShrink: 0 }}>
            {[{ label: "CRITICAL", color: "#FF6B2B" }, { label: "STABLE", color: "var(--text-muted)" }].map(({ label, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, background: color, borderRadius: 1 }} />
                <MonoLabel color={color} size={10}>{label}</MonoLabel>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Chart Row 2 */}
      <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 200 }}>
        {/* Regional Drift */}
        <Card style={{ flex: "0 0 38%", display: "flex", flexDirection: "column", gap: 16 }}>
          <MonoLabel style={{ flexShrink: 0 }}>REGIONAL<br />DRIFT</MonoLabel>
          {regionalData.map(({ city, pct, grad }) => (
            <div key={city} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-share-tech-mono)", fontSize: 12, color: "var(--text-primary)" }}>{city}</span>
                <span style={{ fontFamily: "var(--font-share-tech-mono)", fontSize: 12, color: "var(--text-primary)" }}>{pct}%</span>
              </div>
              <div style={{ height: 4, background: "var(--border-main)", borderRadius: 2 }}>
                <div style={{ width: `${pct}%`, height: "100%", background: grad, borderRadius: 2, transition: "width 1s ease" }} />
              </div>
            </div>
          ))}
        </Card>

        {/* Entropy Scatter */}
        <Card style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <MonoLabel style={{ marginBottom: 12, flexShrink: 0 }}>ENTROPY SCATTER</MonoLabel>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <Scatter data={scatterData} shape={<CustomScatterDot />} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
