// components/ExportDropdown.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react'
import {
  exportSheetAsPDF,
  exportMultipleSheetsPDF,
} from '../utils/exportSheet'

interface ExportDropdownProps {
  sheets: any[];
  activeSheetId: string;
  activeSheetName: string;
}

export default function ExportDropdown({
  sheets,
  activeSheetId,
  activeSheetName,
}: ExportDropdownProps) {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState<'current' | 'all' | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ── EXPORT CURRENT SHEET ──────────────────────────
  const handleExportCurrent = async () => {
    setOpen(false)
    setExporting('current')
    showToast(`Exporting ${activeSheetName}...`, 'loading')

    try {
      await exportSheetAsPDF(activeSheetId, activeSheetName)
      showToast(`✓ ${activeSheetName}.pdf downloaded`, 'success')
    } catch (err: any) {
      showToast(`✕ Export failed: ${err.message}`, 'error')
    } finally {
      setExporting(null)
    }
  }

  // ── EXPORT ALL SHEETS ─────────────────────────────
  const handleExportAll = async () => {
    setOpen(false)
    setExporting('all')
    showToast(`Exporting all ${sheets.length} sheets...`, 'loading')

    try {
      await exportMultipleSheetsPDF(sheets, () => {})
      showToast(`✓ All ${sheets.length} sheets exported`, 'success')
    } catch (err: any) {
      showToast(`✕ Export failed: ${err.message}`, 'error')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div
      ref={dropdownRef}
      style={{ position: 'relative' }}
    >

      {/* ── TRIGGER BUTTON ── */}
      <button
        onClick={() => !exporting && setOpen(prev => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0 16px',
          height: '34px',
          background: exporting
            ? 'rgba(163,230,53,0.15)'
            : open
              ? 'rgba(124,58,237,0.25)'
              : 'rgba(124,58,237,0.15)',
          border: `1px solid ${open
            ? 'rgba(124,58,237,0.7)'
            : 'rgba(124,58,237,0.4)'}`,
          borderRadius: '8px',
          color: exporting ? '#A3E635' : '#7C3AED',
          cursor: exporting ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-share-tech-mono)',
          fontSize: '11px',
          letterSpacing: '1px',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Icon */}
        {exporting ? (
          <span style={{
            display: 'inline-block',
            animation: 'spin 0.8s linear infinite',
          }}>◌</span>
        ) : (
          <span>📄</span>
        )}

        {/* Label */}
        {exporting === 'current'
          ? 'EXPORTING...'
          : exporting === 'all'
            ? 'EXPORTING ALL...'
            : 'EXPORT_PDF'
        }

        {/* Chevron */}
        {!exporting && (
          <span style={{
            fontSize: '9px',
            marginLeft: '2px',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            opacity: 0.6,
          }}>
            ▼
          </span>
        )}
      </button>

      {/* ── DROPDOWN ── */}
      {open && !exporting && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '240px',
          background: '#0D0B14',
          border: '1px solid rgba(124,58,237,0.45)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: `
            0 16px 48px rgba(0,0,0,0.6),
            0 4px 16px rgba(124,58,237,0.2)
          `,
          zIndex: 500,
          animation: 'dropdownIn 0.18s cubic-bezier(0.34,1.56,0.64,1)',
        }}>

          <style>{`
            @keyframes dropdownIn {
              from {
                opacity: 0;
                transform: translateY(-6px) scale(0.97);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            @keyframes spin {
              to { transform: rotate(360deg) }
            }
          `}</style>

          {/* ── DROPDOWN HEADER ── */}
          <div style={{
            padding: '10px 14px 8px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.12), transparent)',
          }}>
            <p style={{
              fontFamily: 'var(--font-share-tech-mono)',
              fontSize: '9px',
              color: '#475569',
              letterSpacing: '1.5px',
              margin: 0,
              textTransform: 'uppercase',
            }}>
              EXPORT OPTIONS
            </p>
          </div>

          {/* ── OPTION 1: CURRENT SHEET ── */}
          <button
            onClick={handleExportCurrent}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '14px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e =>
              (e.currentTarget.style.background = 'rgba(124,58,237,0.12)')
            }
            onMouseLeave={e =>
              (e.currentTarget.style.background = 'transparent')
            }
          >
            {/* Icon container */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              flexShrink: 0,
            }}>
              📄
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontFamily: 'var(--font-share-tech-mono)',
                fontSize: '12px',
                color: '#FFFFFF',
                letterSpacing: '0.5px',
                margin: '0 0 3px',
              }}>
                CURRENT SHEET
              </p>
              <p style={{
                fontFamily: 'var(--font-share-tech-mono)',
                fontSize: '10px',
                color: '#475569',
                letterSpacing: '0.3px',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {activeSheetName}
              </p>
            </div>

            {/* Arrow */}
            <span style={{
              marginLeft: 'auto',
              color: '#7C3AED',
              fontSize: '14px',
              flexShrink: 0,
            }}>
              →
            </span>
          </button>

          {/* ── OPTION 2: ALL SHEETS ── */}
          <button
            onClick={handleExportAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '14px 16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e =>
              (e.currentTarget.style.background = 'rgba(225,29,145,0.1)')
            }
            onMouseLeave={e =>
              (e.currentTarget.style.background = 'transparent')
            }
          >
            {/* Icon container */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: 'rgba(225,29,145,0.15)',
              border: '1px solid rgba(225,29,145,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              flexShrink: 0,
            }}>
              🗂
            </div>

            {/* Text */}
            <div>
              <p style={{
                fontFamily: 'var(--font-share-tech-mono)',
                fontSize: '12px',
                color: '#FFFFFF',
                letterSpacing: '0.5px',
                margin: '0 0 3px',
              }}>
                ALL SHEETS
              </p>
              <p style={{
                fontFamily: 'var(--font-share-tech-mono)',
                fontSize: '10px',
                color: '#475569',
                letterSpacing: '0.3px',
                margin: 0,
              }}>
                {sheets.length} sheet{sheets.length !== 1 ? 's' : ''} · combined PDF
              </p>
            </div>

            {/* Arrow */}
            <span style={{
              marginLeft: 'auto',
              color: '#E11D91',
              fontSize: '14px',
              flexShrink: 0,
            }}>
              →
            </span>
          </button>

          {/* ── DROPDOWN FOOTER ── */}
          <div style={{
            padding: '8px 14px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(0,0,0,0.2)',
          }}>
            <p style={{
              fontFamily: 'var(--font-share-tech-mono)',
              fontSize: '9px',
              color: '#334155',
              letterSpacing: '1px',
              margin: 0,
              textAlign: 'center',
            }}>
              EXPORTS AS PDF · DARK THEME
            </p>
          </div>

        </div>
      )}
    </div>
  )
}


// ── TOAST NOTIFICATION ─────────────────────────────────
function showToast(message: string, type: 'loading' | 'success' | 'error' = 'loading') {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('prism-toast')
  if (existing) existing.remove()

  const colors = {
    loading: { bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.5)', text: '#7C3AED' },
    success: { bg: 'rgba(163,230,53,0.15)', border: 'rgba(163,230,53,0.5)', text: '#A3E635' },
    error:   { bg: 'rgba(255,77,109,0.15)', border: 'rgba(255,77,109,0.5)', text: '#FF4D6D' },
  }
  const c = colors[type]

  const toast = document.createElement('div')
  toast.id = 'prism-toast'
  toast.style.cssText = `
    position: fixed;
    bottom: 28px;
    right: 28px;
    padding: 12px 20px;
    background: ${c.bg};
    border: 1px solid ${c.border};
    border-radius: 10px;
    color: ${c.text};
    font-family: var(--font-share-tech-mono), monospace;
    font-size: 12px;
    letter-spacing: 0.5px;
    z-index: 9999;
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    animation: toastIn 0.2s ease;
    max-width: 320px;
  `

  const styleId = 'prism-toast-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId;
    style.textContent = `
      @keyframes toastIn {
        from { opacity:0; transform: translateY(8px) }
        to   { opacity:1; transform: translateY(0) }
      }
    `
    document.head.appendChild(style)
  }
  
  toast.textContent = message
  document.body.appendChild(toast)

  if (type !== 'loading') {
    setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transition = 'opacity 0.3s'
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  }
}
