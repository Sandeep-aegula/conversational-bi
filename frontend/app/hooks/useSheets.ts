"use client";
import { useState, useCallback } from 'react';

export interface Sheet {
  id: string;
  name: string;
  charts: any[];
  filters: any[];
  highlighted: string | null;
  chartTypes: Record<string, string>;
  createdAt: string;
}

const generateId = () => `sheet_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export default function useSheets(initialCharts: any[] = []) {
  const [sheets, setSheets] = useState<Sheet[]>([
    {
      id: 'sheet_1',
      name: 'Overview',
      charts: initialCharts,
      filters: [],
      highlighted: null,
      chartTypes: {},
      createdAt: new Date().toISOString(),
    }
  ]);

  const [activeSheetId, setActiveSheetId] = useState('sheet_1');

  // ── GET ACTIVE SHEET ──────────────────────────────
  const activeSheet = sheets.find(s => s.id === activeSheetId) || sheets[0];

  // ── SWITCH SHEET ──────────────────────────────────
  const switchSheet = useCallback((id: string) => {
    setActiveSheetId(id);
  }, []);

  // ── ADD BLANK SHEET ───────────────────────────────
  const addSheet = useCallback(() => {
    const newId = generateId();
    const newNumber = sheets.length + 1;

    setSheets(prev => [...prev, {
      id: newId,
      name: `Sheet ${newNumber}`,
      charts: [],
      filters: [],
      highlighted: null,
      chartTypes: {},
      createdAt: new Date().toISOString(),
    }]);

    setActiveSheetId(newId);
    return newId;
  }, [sheets.length]);

  // ── ADD SHEET WITH CHARTS (from chat) ─────────────
  const addSheetWithCharts = useCallback((name: string, charts: any[] = []) => {
    const newId = generateId();

    setSheets(prev => [...prev, {
      id: newId,
      name: name || `Sheet ${prev.length + 1}`,
      charts,
      filters: [],
      highlighted: null,
      chartTypes: {},
      createdAt: new Date().toISOString(),
    }]);

    setActiveSheetId(newId);
    return newId;
  }, []);

  // ── RENAME SHEET ──────────────────────────────────
  const renameSheet = useCallback((id: string, newName: string) => {
    if (!newName.trim()) return;
    setSheets(prev => prev.map(s =>
      s.id === id ? { ...s, name: newName.trim() } : s
    ));
  }, []);

  // ── DELETE SHEET ──────────────────────────────────
  const deleteSheet = useCallback((id: string) => {
    setSheets(prev => {
      if (prev.length <= 1) return prev; // never delete last sheet
      const remaining = prev.filter(s => s.id !== id);
      if (activeSheetId === id) {
        setActiveSheetId(remaining[0].id);
      }
      return remaining;
    });
  }, [activeSheetId]);

  // ── DUPLICATE SHEET ───────────────────────────────
  const duplicateSheet = useCallback((id: string) => {
    const source = sheets.find(s => s.id === id);
    if (!source) return;

    const newId = generateId();
    setSheets(prev => {
      const index = prev.findIndex(s => s.id === id);
      const copy = {
        ...source,
        id: newId,
        name: `${source.name} (copy)`,
        createdAt: new Date().toISOString(),
      };
      const updated = [...prev];
      updated.splice(index + 1, 0, copy);
      return updated;
    });
    setActiveSheetId(newId);
  }, [sheets]);

  // ── UPDATE CHARTS ON A SHEET ──────────────────────
  const updateSheetCharts = useCallback((sheetId: string, updater: (prev: any[]) => any[]) => {
    setSheets(prev => prev.map(s =>
      s.id === sheetId ? { ...s, charts: updater(s.charts) } : s
    ));
  }, []);

  // ── UPDATE FILTERS ON A SHEET ─────────────────────
  const updateSheetFilters = useCallback((sheetId: string, filters: any[]) => {
    setSheets(prev => prev.map(s =>
      s.id === sheetId ? { ...s, filters } : s
    ));
  }, []);

  // ── UPDATE HIGHLIGHTED VALUE ON A SHEET ───────────
  const updateSheetHighlight = useCallback((sheetId: string, highlighted: string | null) => {
    setSheets(prev => prev.map(s =>
      s.id === sheetId ? { ...s, highlighted } : s
    ));
  }, []);

  // ── UPDATE CHART TYPE OVERRIDE ON A SHEET ─────────
  const updateChartType = useCallback((sheetId: string, chartId: string, newType: string) => {
    setSheets(prev => prev.map(s =>
      s.id === sheetId
        ? { ...s, chartTypes: { ...s.chartTypes, [chartId]: newType } }
        : s
    ));
  }, []);

  // ── RESET A SHEET TO CLEAN STATE ──────────────────
  const resetSheet = useCallback((sheetId: string) => {
    setSheets(prev => prev.map(s =>
      s.id === sheetId
        ? { ...s, filters: [], highlighted: null, chartTypes: {} }
        : s
    ));
  }, []);

  // ── LOAD INITIAL CHARTS (called after CSV upload) ─
  const loadInitialCharts = useCallback((charts: any[]) => {
    setSheets([
      {
        id: 'sheet_1',
        name: 'Overview',
        charts,
        filters: [],
        highlighted: null,
        chartTypes: {},
        createdAt: new Date().toISOString(),
      }
    ]);
    setActiveSheetId('sheet_1');
  }, []);

  return {
    sheets,
    activeSheet,
    activeSheetId,
    switchSheet,
    addSheet,
    addSheetWithCharts,
    renameSheet,
    deleteSheet,
    duplicateSheet,
    updateSheetCharts,
    updateSheetFilters,
    updateSheetHighlight,
    updateChartType,
    resetSheet,
    loadInitialCharts,
    setSheets,
  };
}
