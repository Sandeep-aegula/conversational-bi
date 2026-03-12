"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Sheet } from '../hooks/useSheets';

const SHEET_COLORS = [
  '#7C3AED', '#E11D91', '#00E5FF',
  '#A3E635', '#FF6B2B', '#FF4D6D',
];

interface SheetTabBarProps {
  sheets: Sheet[];
  activeSheetId: string;
  onSwitch: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onExportClick: (sheetId: string) => void;
}

export default function SheetTabBar({
  sheets,
  activeSheetId,
  onSwitch,
  onAdd,
  onRename,
  onDelete,
  onDuplicate,
  onExportClick,
}: SheetTabBarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, sheet: Sheet } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const startRename = (e: React.MouseEvent | { stopPropagation: () => void }, sheet: Sheet) => {
    e.stopPropagation();
    setEditingId(sheet.id);
    setEditName(sheet.name);
  };

  const confirmRename = () => {
    if (editName.trim()) {
      onRename(editingId!, editName.trim());
    }
    setEditingId(null);
  };

  const openContextMenu = (e: React.MouseEvent, sheet: Sheet) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      sheet,
    });
  };

  function hexToRgb(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  }

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: '44px',
        background: 'var(--bg-panel)',
        borderTop: '1px solid var(--border-main)',
        padding: '0 16px',
        gap: '4px',
        overflowX: 'auto',
        flexShrink: 0,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {sheets.map((sheet, index) => {
          const isActive = sheet.id === activeSheetId;
          const dotColor = SHEET_COLORS[index % SHEET_COLORS.length];

          return (
            <div
              key={sheet.id}
              onClick={() => onSwitch(sheet.id)}
              onDoubleClick={(e) => startRename(e, sheet)}
              onContextMenu={(e) => openContextMenu(e, sheet)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '0 12px',
                height: '32px',
                minWidth: '90px',
                maxWidth: '160px',
                background: isActive
                  ? 'rgba(124,58,237,0.15)'
                  : 'var(--input-bg)',
                border: `1px solid ${isActive
                  ? 'rgba(124,58,237,0.4)'
                  : 'var(--border-main)'}`,
                borderBottom: isActive
                  ? '2px solid var(--violet)'
                  : '1px solid var(--border-main)',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0,
                position: 'relative',
                userSelect: 'none',
              }}
            >
              <div style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: dotColor,
                boxShadow: isActive ? `0 0 6px ${dotColor}` : 'none',
                flexShrink: 0,
              }} />

              {editingId === sheet.id ? (
                <input
                  ref={inputRef}
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onBlur={confirmRename}
                  onKeyDown={e => {
                    if (e.key === 'Enter') confirmRename();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onClick={e => e.stopPropagation()}
                  style={{
                    background: 'var(--bg-app)',
                    border: '1px solid var(--violet)',
                    borderRadius: '4px',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-share-tech-mono)',
                    fontSize: '11px',
                    padding: '2px 6px',
                    width: '80px',
                  }}
                />
              ) : (
                <span style={{
                  fontFamily: 'var(--font-share-tech-mono)',
                  fontSize: '11px',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}>
                  {sheet.name}
                </span>
              )}

              {sheet.charts?.length > 0 && (
                <span style={{
                  fontFamily: 'var(--font-share-tech-mono)',
                  fontSize: '9px',
                  color: dotColor,
                  background: `rgba(${hexToRgb(dotColor)},0.1)`,
                  border: `1px solid rgba(${hexToRgb(dotColor)},0.2)`,
                  borderRadius: '4px',
                  padding: '1px 4px',
                  flexShrink: 0,
                }}>
                  {sheet.charts.length}
                </span>
              )}

              {sheets.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(sheet.id);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    opacity: 0.4,
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '0 4px',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={onAdd}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            background: 'var(--input-bg)',
            border: '1px solid var(--border-main)',
            borderRadius: '6px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '18px',
            marginLeft: '4px',
          }}
        >
          +
        </button>

        <div style={{ flex: 1 }} />
        
        <span style={{
          fontFamily: 'var(--font-share-tech-mono)',
          fontSize: '10px',
          color: 'var(--text-muted)',
          letterSpacing: '1px',
        }}>
          {sheets.length} SHEETS
        </span>
      </div>

      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'var(--bg-panel)',
            border: '1px solid var(--violet)',
            borderRadius: '10px',
            padding: '6px',
            zIndex: 9999,
            minWidth: '160px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {[
            {
              label: 'Rename',
              icon: '✎',
              color: 'var(--text-primary)',
              action: () => {
                startRename({ stopPropagation: () => {} }, contextMenu.sheet);
                setContextMenu(null);
              }
            },
            {
              label: 'Duplicate',
              icon: '⧉',
              color: 'var(--cyan)',
              action: () => {
                onDuplicate(contextMenu.sheet.id);
                setContextMenu(null);
              }
            },
            {
              label: 'Export Sheet',
              icon: '⬇',
              color: 'var(--lime)',
              action: () => {
                onExportClick(contextMenu.sheet.id);
                setContextMenu(null);
              }
            },
            sheets.length > 1 && {
              label: 'Delete',
              icon: '🗑',
              color: 'var(--coral)',
              action: () => {
                onDelete(contextMenu.sheet.id);
                setContextMenu(null);
              }
            },
          ].filter((item): item is any => !!item).map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: item.color,
                cursor: 'pointer',
                fontFamily: 'var(--font-share-tech-mono)',
                fontSize: '11px',
                textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--input-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
