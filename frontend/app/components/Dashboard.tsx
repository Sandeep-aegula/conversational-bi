"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useRef, useMemo, useEffect } from "react";
import Papa from "papaparse";
import {
  ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, FunnelChart, Funnel, AreaChart,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, LabelList
} from "recharts";
import { UploadCloud, MessageSquare, Send, X, RefreshCw, FileText, ArrowRight } from "lucide-react";

// COLORS
const COLORS = ["#6366F1", "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"];

// CUSTOM TOOLTIP
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(15,17,23,0.95)", border: "1px solid rgba(99,102,241,0.4)",
      borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#E2E8F0",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
    }}>
      {label && <p style={{ color: "#94A3B8", marginBottom: 6, fontWeight: 600 }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || COLORS[i % COLORS.length], margin: "2px 0" }}>
          <span style={{ opacity: 0.7 }}>{p.name}: </span>
          <strong>{typeof p.value === "number" && p.value > 999 ? p.value.toLocaleString() : (typeof p.value === "number" ? Math.round(p.value * 100) / 100 : p.value)}</strong>
        </p>
      ))}
    </div>
  );
};

// CHART CARD COMPONENT
const ChartCard = ({ title, subtitle, children, span = 1 }: any) => (
  <div style={{
    gridColumn: `span ${span}`,
  }}
    className="bg-[rgba(26,29,46,0.9)] border border-[rgba(99,102,241,0.2)] rounded-2xl p-5 md:p-6 transition-all duration-200 hover:border-[rgba(99,102,241,0.5)] hover:shadow-[0_8px_40px_rgba(99,102,241,0.15)] flex flex-col"
  >
    <div className="mb-4">
      <h3 className="m-0 text-[#F1F5F9] text-sm md:text-base font-semibold">{title}</h3>
      {subtitle && <p className="m-0 mt-1 text-[#64748B] text-xs md:text-sm">{subtitle}</p>}
    </div>
    <div className="flex-1 min-h-[250px] w-full">
      {children}
    </div>
  </div>
);

// KPI CARD
const KPICard = ({ label, value, change, up, icon }: any) => (
  <div className="bg-gradient-to-br from-[rgba(99,102,241,0.12)] to-[rgba(26,29,46,0.9)] border border-[rgba(99,102,241,0.25)] rounded-2xl p-4 md:p-5 flex items-center gap-4 shadow-[0_2px_16px_rgba(0,0,0,0.25)]">
    <div className="text-xl md:text-2xl w-10 md:w-12 h-10 md:h-12 rounded-xl bg-[rgba(99,102,241,0.15)] flex items-center justify-center text-indigo-400 shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="m-0 text-[#64748B] text-[10px] md:text-xs font-semibold uppercase truncate">{label}</p>
      <p className="m-0 mt-0.5 text-[#F1F5F9] text-lg md:text-2xl font-bold truncate">{value}</p>
      {change && (
        <span className={`inline-block mt-1 text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full ${up ? "text-[#10B981] bg-[rgba(16,185,129,0.1)]" : "text-[#EF4444] bg-[rgba(239,68,68,0.1)]"}`}>
          {up ? "▲" : "▼"} {change}
        </span>
      )}
    </div>
  </div>
);

// CORE DETECTION LOGIC
function detectColumnTypes(rows: any[]) {
  if (!rows || !rows.length) return {};
  const columns = Object.keys(rows[0]);
  const types: Record<string, string> = {};

  columns.forEach(col => {
    const values = rows.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== "");
    if (!values.length) { types[col] = "text"; return; }
    
    let isNumericColumn = true;
    for(let i=0; i<Math.min(values.length, 100); i++) {
        const v = values[i];
        if (typeof v !== 'number' && isNaN(parseFloat(String(v)))) {
            isNumericColumn = false;
            break;
        }
    }

    if (isNumericColumn) {
      types[col] = "numeric";
    } else {
      const dateCount = values.filter(v =>
        /^\d{4}$/.test(String(v)) ||         // year
        /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(String(v)) || // date format
        /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(String(v)) || // month
        /^Q[1-4]/i.test(String(v))            // quarters
      ).length;

      if (dateCount / values.length > 0.7) {
        types[col] = "date";
      } else {
        const uniqueCount = new Set(values.map(v => String(v).trim())).size;
        types[col] = uniqueCount <= 20 ? "categorical" : "text";
      }
    }
  });

  return types;
}

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [originalData, setOriginalData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [types, setTypes] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [filters, setFilters] = useState<{ id: number; label: string; fn: (rows: any[]) => any[] }[]>([]);
  const [highlightedValue, setHighlightedValue] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLoading("Analyzing your data structure...");

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rawRows = results.data as any[];
        if (rawRows.length === 0) {
          alert("Empty CSV file.");
          setLoading("");
          return;
        }
        
        const cols = Object.keys(rawRows[0] || {});
        const dtb = detectColumnTypes(rawRows);
        setColumns(cols);
        setTypes(dtb);
        setOriginalData(rawRows);
        setData(rawRows);
        setLoading("");
        
        setTimeout(() => {
          setChatHistory([{ type: 'ai', text: `✦ Successfully loaded ${file.name}. What would you like to know?` }]);
        }, 500);
      },
      error: () => {
        alert("Error parsing CSV");
        setLoading("");
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length) {
      const eMock = { target: { files: [files[0]] } } as any;
      handleFileUpload(eMock);
    }
  };

  const activeData = useMemo(() => {
    let d = [...originalData];
    filters.forEach(f => {
      d = f.fn(d);
    });
    return d;
  }, [originalData, filters]);

  // DERIVE ROLES
  const numericCols = columns.filter(c => types[c] === 'numeric');
  const dateCols = columns.filter(c => types[c] === 'date');
  const categoryCols = columns.filter(c => types[c] === 'categorical');
  const textCols = columns.filter(c => types[c] === 'text');

  const primaryMetric = numericCols[0] || null;
  const secondaryMetric = numericCols[1] || null;
  const tertiaryMetric = numericCols[2] || null;
  const timeColumn = dateCols[0] || null;
  const categoryColumn = categoryCols[0] || null;
  const subCategory = categoryCols[1] || null;

  // AUTO-GENERATED CHIPS
  const tips = [];
  if (categoryColumn) {
    const topCat = [...new Set(originalData.map(r => r[categoryColumn]))].slice(0, 1)[0] || "";
    if (topCat) tips.push(`Show only ${topCat}`);
  }
  if (primaryMetric) tips.push(`Top 10 by ${primaryMetric}`);
  if (primaryMetric && categoryColumn && subCategory) tips.push(`Compare ${categoryColumn}`);
  
  if (tips.length === 0) tips.push("Show top 5 items", "Reset filters");

  // Upload shifted to Left Sidebar

  // INTENT PARSER
  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userText = input.trim();
    const lcText = userText.toLowerCase();
    
    setChatHistory(prev => [...prev, { type: 'user', text: userText }]);
    setInput('');
    
    let handled = false;
    let aiResponse = "";
    
    // 11. RESET
    if (lcText.includes("reset") || lcText.includes("clear") || lcText.includes("show all")) {
      setFilters([]);
      setHighlightedValue(null);
      aiResponse = `✦ Reset complete. Showing all ${originalData.length} records.`;
      handled = true;
    }
    
    // 1. FILTER BY CATEGORY VALUE
    if (!handled && categoryCols.length > 0) {
      for (const col of categoryCols) {
        const uniqueVals = [...new Set(originalData.map(r => String(r[col])))];
        for (const val of uniqueVals) {
          if (lcText.includes(val.toLowerCase())) {
            setFilters(prev => [...prev, {
              id: Date.now(),
              label: `${col}: ${val}`,
              fn: (rows) => rows.filter(r => String(r[col]).toLowerCase() === val.toLowerCase())
            }]);
            const count = originalData.filter(r => String(r[col]).toLowerCase() === val.toLowerCase()).length;
            aiResponse = `✦ Filtered to ${val}. Showing ${count} records.`;
            handled = true;
            break;
          }
        }
        if (handled) break;
      }
    }
    
    // 4. TOP N
    if (!handled && (lcText.includes("top") || lcText.includes("bottom")) && primaryMetric) {
      const match = lcText.match(/(top|bottom)s+(\d+)/i);
      const isTop = lcText.includes("top");
      const n = match ? parseInt(match[2]) : 10;
      
      setFilters(prev => [...prev, {
        id: Date.now(),
        label: `${isTop ? 'Top' : 'Bottom'} ${n}`,
        fn: (rows) => {
          const s = [...rows].sort((a,b) => (Number(b[primaryMetric]) || 0) - (Number(a[primaryMetric]) || 0));
          return isTop ? s.slice(0, n) : s.slice(-n);
        }
      }]);
      aiResponse = `✦ Showing ${isTop ? 'top' : 'bottom'} ${n} records by ${primaryMetric}.`;
      handled = true;
    }

    if (!handled) {
      aiResponse = `✦ I applied a general search. For better results, try asking for 'Top 10', 'Reset', or mention specific categories.`;
    }

    setTimeout(() => {
      setChatHistory(prev => [...prev, { type: 'ai', text: aiResponse }]);
    }, 400);
  };

  const removeFilter = (id: number) => {
    setFilters(prev => prev.filter(f => f.id !== id));
  };


  // DATA PREPARATION FOR CHARTS
  // -- Chart 1: Composed Chart (Trend)
  const composedData = useMemo(() => {
    if (!activeData.length || !primaryMetric) return [];
    if (timeColumn) {
      const grouped = activeData.reduce((acc, row) => {
        const k = row[timeColumn];
        if(!acc[k]) acc[k] = { name: k, count: 0, [primaryMetric]: 0 };
        acc[k][primaryMetric] += Number(row[primaryMetric]) || 0;
        if(secondaryMetric) {
           acc[k][secondaryMetric] = (acc[k][secondaryMetric] || 0) + (Number(row[secondaryMetric]) || 0);
        }
        acc[k].count += 1;
        return acc;
      }, {});
      return Object.values(grouped).slice(0, 50); // limit to 50 points
    } else {
      // no time column, use row batches
      const batchSize = Math.max(1, Math.floor(activeData.length / 10));
      return Array.from({length: 10}).map((_, i) => {
        const slice = activeData.slice(i * batchSize, (i+1) * batchSize);
        let pmSum = 0; let smSum = 0;
        slice.forEach(r => { 
          pmSum += Number(r[primaryMetric]) || 0; 
          if(secondaryMetric) smSum += Number(r[secondaryMetric]) || 0; 
        });
        return {
          name: `Group ${i+1}`,
          [primaryMetric]: pmSum / (slice.length || 1),
          ...(secondaryMetric ? {[secondaryMetric]: smSum / (slice.length || 1)} : {}),
          count: slice.length
        };
      });
    }
  }, [activeData, timeColumn, primaryMetric, secondaryMetric]);

  // -- Chart 2: Donut Category Breakdown
  const pieData = useMemo(() => {
    if (!activeData.length) return [];
    if (categoryColumn) {
      const counts: Record<string, number> = {};
      activeData.forEach(r => {
        const k = String(r[categoryColumn]);
        counts[k] = (counts[k] || 0) + (primaryMetric ? (Number(r[primaryMetric])||0) : 1);
      });
      return Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 6).map(([name, value]) => ({name, value}));
    } else if (primaryMetric) {
      // Bucket primaryMetric
      return [{name: 'Data', value: activeData.length}];
    }
    return [];
  }, [activeData, categoryColumn, primaryMetric]);

  // -- Chart 3: Horizontal Bar
  const horizontalBarData = useMemo(() => {
    if (!activeData.length || !categoryColumn || !primaryMetric) return [];
    const grouped: Record<string, number> = {};
    activeData.forEach(r => {
      const k = String(r[categoryColumn]);
      grouped[k] = (grouped[k] || 0) + (Number(r[primaryMetric])||0);
    });
    return Object.entries(grouped)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 10)
      .map(([name, value]) => ({name, [primaryMetric]: value}));
  }, [activeData, categoryColumn, primaryMetric]);

  // -- Chart 4: Grouped Bar
  const groupedBarData = useMemo(() => {
    if (!activeData.length) return [];
    if (categoryColumn && subCategory && primaryMetric) {
      const g: any = {};
      const topCats = [...new Set(activeData.map(r=>String(r[categoryColumn])))].slice(0, 4);
      activeData.forEach(r => {
        const sub = String(r[subCategory]);
        const cat = String(r[categoryColumn]);
        if (!topCats.includes(cat)) return;
        if (!g[sub]) g[sub] = { name: sub };
        g[sub][cat] = (g[sub][cat] || 0) + (Number(r[primaryMetric])||0);
      });
      return Object.values(g).slice(0, 8);
    }
    return [];
  }, [activeData, categoryColumn, subCategory, primaryMetric]);

  // -- Chart 5: Scatter
  const scatterData = useMemo(() => {
    if (!activeData.length || !primaryMetric || !secondaryMetric) return [];
    return activeData.slice(0, 200).map((r, i) => ({
      x: Number(r[primaryMetric])||0,
      y: Number(r[secondaryMetric])||0,
      z: categoryColumn ? String(r[categoryColumn]) : `Point ${i}`,
      ...r
    }));
  }, [activeData, primaryMetric, secondaryMetric, categoryColumn]);

  // -- Chart 6: Funnel
  const funnelData = useMemo(() => {
    if (!activeData.length || !primaryMetric) return [];
    const sorted = [...activeData].sort((a,b) => (Number(a[primaryMetric])||0) - (Number(b[primaryMetric])||0));
    const tiers = 5;
    const tierSize = Math.ceil(sorted.length / tiers);
    const result = [];
    for(let i=0; i<tiers; i++) {
        const slice = sorted.slice(i*tierSize, (i+1)*tierSize);
        if(!slice.length) continue;
        const min = Number(slice[0][primaryMetric])||0;
        const max = Number(slice[slice.length-1][primaryMetric])||0;
        result.push({
            name: `Tier ${i+1} (${Math.round(min)} - ${Math.round(max)})`,
            value: slice.length,
            fill: COLORS[i % COLORS.length]
        });
    }
    return result.sort((a,b) => b.value - a.value);
  }, [activeData, primaryMetric]);

  // KPIS
  const sumPM = activeData.reduce((acc, r) => acc + (primaryMetric ? (Number(r[primaryMetric])||0) : 0), 0);
  const avgSM = secondaryMetric ? activeData.reduce((acc, r) => acc + (Number(r[secondaryMetric])||0), 0) / (activeData.length||1) : 0;
  
  let topCategory = "N/A";
  if (categoryColumn && primaryMetric) {
    const counts: Record<string, number> = {};
    activeData.forEach(r => {
        const k = String(r[categoryColumn]);
        counts[k] = (counts[k] || 0) + (Number(r[primaryMetric])||0);
    });
    const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);
    if (sorted.length) topCategory = sorted[0][0];
  }

  // Render Charts safely
  const renderComposedChart = () => {
    if(!composedData.length) return <p className="text-gray-500">Not enough data</p>;
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={composedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v > 1000 ? v.toLocaleString() : v} />
          <RechartsTooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey={primaryMetric!} fill="url(#colorPm)" stroke="#6366F1" strokeWidth={2} />
          {secondaryMetric && <Line type="monotone" dataKey={secondaryMetric} stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" dot={false} />}
          <Bar dataKey="count" fill="#10B981" fillOpacity={0.6} barSize={20} radius={[4,4,0,0]} />
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="flex flex-row h-screen w-full bg-[#0F1117] text-white text-sm overflow-hidden">
      
      {/* 1. LEFT COLUMN: UPLOAD & METADATA */}
      <div className="w-[320px] lg:w-[380px] flex-shrink-0 bg-[rgba(15,17,23,0.95)] border-r border-[rgba(255,255,255,0.05)] flex flex-col items-center p-6 overflow-y-auto custom-scrollbar z-20">
        <div className="flex items-center gap-3 w-full mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-lg text-lg">✦</div>
          <div>
            <h1 className="font-bold text-lg m-0 tracking-wide text-white">ConversationalBI</h1>
            <p className="text-xs text-indigo-300 m-0 font-medium">{fileName ? `LIVE • ${fileName}` : 'Ready for Data'}</p>
          </div>
        </div>

        {/* Upload Zone */}
        <div 
          className="w-full border-2 border-dashed border-indigo-500/30 rounded-2xl p-6 text-center bg-[#0F1117] relative hover:bg-[rgba(26,29,46,0.6)] transition-all cursor-pointer group mb-6 flex-shrink-0"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input type="file" accept=".csv" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileUpload} />
          <div className="bg-indigo-500/10 w-14 h-14 rounded-xl mx-auto flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-sm font-bold mb-2 text-white">Upload CSV File</h2>
          <p className="text-slate-400 text-xs mb-4">Drag & drop or click to browse</p>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors">
            Browse files <ArrowRight className="w-3 h-3" />
          </button>
          
          {loading && (
            <div className="mt-4 text-indigo-300 text-xs animate-pulse bg-indigo-900/20 py-1.5 px-3 rounded-lg mx-auto inline-block">
              {loading}
            </div>
          )}
        </div>

        {/* File Metadata */}
        {originalData.length > 0 && (
          <div className="w-full text-left space-y-4 flex-1">
            <div className="bg-[#1A1D2E] rounded-xl p-4 border border-[rgba(255,255,255,0.05)]">
              <h3 className="text-xs text-slate-400 font-semibold uppercase mb-3 text-center">Detected Columns</h3>
              <div className="space-y-2 max-h-[30vh] overflow-y-auto custom-scrollbar pr-2">
                {Object.entries(types).map(([col, type]) => (
                  <div key={col} className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 truncate pr-2 max-w-[150px]" title={col}>{col}</span>
                    <span className="text-slate-500 flex-shrink-0 bg-black/20 px-1.5 py-0.5 rounded">{type}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => window.location.reload()}
              className="text-slate-400 w-full text-center hover:text-white text-xs underline decoration-slate-600 underline-offset-4 mt-auto pt-4 flex flex-row items-center justify-center gap-2"
            >
              <RefreshCw className="w-3 h-3" /> Start over with new file
            </button>
          </div>
        )}
      </div>

      {/* 2. MIDDLE COLUMN: VISUALIZATIONS */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0F1117] overflow-auto custom-scrollbar relative">
        {!originalData.length ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8 max-w-sm">
              <div className="w-24 h-24 bg-indigo-500/5 rounded-full flex items-center justify-center mx-auto mb-6">
                 <FileText className="w-10 h-10 text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Awaiting Data</h2>
              <p className="text-slate-400 text-sm">Upload a CSV file on the left to start generating dynamic insights instantly.</p>
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-8 space-y-8 max-w-[1400px] w-full mx-auto">
            
            {/* TAGS */}
            {filters.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pb-4 border-b border-[rgba(255,255,255,0.05)]">
                <span className="text-xs text-slate-400 mr-2 uppercase font-semibold">Active Filters:</span>
                {filters.map(f => (
                  <div key={f.id} className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                    {f.label}
                    <button onClick={() => removeFilter(f.id)} className="hover:text-white"><X className="w-3 h-3"/></button>
                  </div>
                ))}
                <button 
                  onClick={() => setFilters([])} 
                  className="text-xs text-slate-400 hover:text-white hover:underline ml-2"
                >
                  Reset All →
                </button>
              </div>
            )}

          {/* KPIS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <KPICard label={`Total ${primaryMetric || 'Volume'}`} value={sumPM > 1000000 ? (sumPM/1000000).toFixed(2)+'M' : sumPM.toLocaleString()} icon={<ActivityIcon />} up={true} change="12.5%" />
            <KPICard label={`Avg ${secondaryMetric || 'Metric'}`} value={avgSM.toFixed(2)} icon={<LineChartIcon />} up={false} change="2.4%" />
            <KPICard label={`Top ${categoryColumn || 'Category'}`} value={topCategory} icon={<TrendingUpIcon />} />
            <KPICard label="Total Records" value={activeData.length.toLocaleString()} icon={<DatabaseIcon />} />
          </div>

          {/* CHARTS GRID */}
          {activeData.length === 0 ? (
            <div className="py-20 text-center text-slate-500">No records match the current filters.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
              
              <ChartCard title={`${primaryMetric || 'Data'} Over ${timeColumn || 'Time'}`} subtitle={`Based on ${activeData.length} records`} span={8}>
                {renderComposedChart()}
              </ChartCard>

              <ChartCard title={`${categoryColumn || 'Data'} Breakdown`} span={4}>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                        {pieData.map((e, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-gray-500">Not enough data</p>}
              </ChartCard>

              <ChartCard title={`Top ${categoryColumn || 'Categories'} by ${primaryMetric || 'Value'}`} span={6}>
                {horizontalBarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={horizontalBarData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false}/>
                      <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} width={80}/>
                      <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}}/>
                      <Bar dataKey={primaryMetric!} fill="#6366F1" radius={[0,4,4,0]}>
                        {horizontalBarData.map((e, index) => <Cell key={`cell-${index}`} fillOpacity={index === 0 ? 1 : 0.75} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-gray-500">Not enough data</p>}
              </ChartCard>

              <ChartCard title={`${primaryMetric || 'Metric'} by ${subCategory || categoryColumn || 'Category'}`} span={6}>
                 {groupedBarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={groupedBarData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false}/>
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false}/>
                      <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}}/>
                      {Object.keys(groupedBarData[0] || {}).filter(k => k !== 'name').map((key, i) => (
                         <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4,4,0,0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-gray-500">Not enough data</p>}
              </ChartCard>

              {secondaryMetric && (
                <ChartCard title={`${primaryMetric} vs ${secondaryMetric}`} span={6}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis type="number" dataKey="x" name={primaryMetric || undefined} stroke="#64748B" fontSize={11} tickLine={false} axisLine={false}/>
                        <YAxis type="number" dataKey="y" name={secondaryMetric || undefined} stroke="#64748B" fontSize={11} tickLine={false} axisLine={false}/>
                        <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                        <Scatter name="Data" data={scatterData} fill="#06B6D4">
                           {scatterData.map((e, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.7} />)}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                </ChartCard>
              )}

              {primaryMetric && funnelData.length > 0 && (
                <ChartCard title={`${primaryMetric} Distribution Tiers`} span={6}>
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Funnel dataKey="value" data={funnelData} isAnimationActive>
                        <LabelList position="center" fill="#fff" stroke="none" dataKey="name" fontSize={12} />
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

            </div>
          )}

          </div>
        )}
      </div>

      {/* 3. RIGHT COLUMN: CHAT PANEL */}
      <div className="w-[320px] lg:w-[420px] flex-shrink-0 bg-[rgba(15,17,23,0.95)] border-l border-[rgba(255,255,255,0.05)] flex flex-col z-20 shadow-[-8px_0_32px_rgba(0,0,0,0.15)]">
        <div className="px-6 py-5 border-b border-[rgba(255,255,255,0.05)] flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide">AI Assistant</h2>
        </div>
        
        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4">
          {!originalData.length ? (
            <div className="m-auto text-center text-slate-500 text-xs space-y-3">
                <p>Waiting for data upload...</p>
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="m-auto text-center text-slate-500 text-xs space-y-3">
                <p>Interact with your data here.</p>
                <div className="flex flex-col gap-2 mt-4">
                  {tips.slice(0, 3).map((tip, i) => (
                    <button key={i} onClick={() => setInput(tip)} className="text-left px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(26,29,46,0.9)] border border-slate-700/50 hover:border-indigo-500/50 transition-colors text-slate-300">
                      &quot;{tip}&quot;
                    </button>
                  ))}
                </div>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-md ${msg.type === 'user' ? 'bg-indigo-600/30 border border-indigo-500/20 text-white rounded-br-sm' : 'bg-[#1A1D2E] text-slate-300 rounded-bl-sm border border-slate-700/50'}`}>
                  <p className="m-0 text-[13px] leading-relaxed whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {originalData.length > 0 && (
          <div className="p-4 bg-[rgba(8,11,20,0.8)] border-t border-[rgba(255,255,255,0.05)] backdrop-blur-md">
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
              {tips.map((tip, i) => (
                <button key={i} onClick={() => setInput(tip)} className="whitespace-nowrap px-3 py-1.5 rounded-full bg-[#1A1D2E] text-slate-300 text-[11px] font-medium border border-slate-700/50 hover:bg-indigo-600/30 hover:border-indigo-500/50 hover:text-white transition-all shrink-0">
                  {tip}
                </button>
              ))}
            </div>
            <form onSubmit={handleChat} className="flex items-center gap-3">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={input} 
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask anything..." 
                  className="w-full bg-[#1A1D2E] border border-indigo-500/30 text-white text-[13px] rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                />
                <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-transform hover:scale-105 active:scale-95 shadow-md">
                  <Send className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}

const ActivityIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
const LineChartIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="m19 9-5 5-4-4-3 3"></path></svg>
const TrendingUpIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
const DatabaseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
