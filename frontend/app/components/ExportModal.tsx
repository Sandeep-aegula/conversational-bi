// components/ExportModal.tsx
"use client";

import React, { useState } from 'react'
import {
  exportSheetAsPDF,
  exportSheetAsPNG,
  exportSheetAsCSV,
  exportMultipleSheetsPDF,
  exportMultipleSheetsPNG,
  exportMultipleSheetsCSV,
} from '../utils/exportSheet'

// ── CONSTANTS ──────────────────────────────────────────
const SHEET_COLORS = [
  '#7C3AED','#E11D91','#00E5FF',
  '#A3E635','#FF6B2B','#FF4D6D',
]

const FORMATS = [
  {
    id: 'pdf',
    label: 'PDF',
    icon: '📄',
    color: '#FF4D6D',
    rgb: '255,77,109',
    desc: 'Multi-page document',
    multiDesc: 'All sheets in one file',
  },
  {
    id: 'png',
    label: 'PNG',
    icon: '🖼',
    color: '#00E5FF',
    rgb: '0,229,255',
    desc: 'High-res image',
    multiDesc: 'One image per sheet',
  },
  {
    id: 'csv',
    label: 'CSV',
    icon: '📊',
    color: '#A3E635',
    rgb: '163,230,53',
    desc: 'Raw data only',
    multiDesc: 'One file per sheet',
  },
]

interface ExportModalProps {
  sheets: any[];
  activeSheetId: string;
  rawData?: any[];
  onClose: () => void;
}

// ── MAIN COMPONENT ─────────────────────────────────────
export default function ExportModal({
  sheets,
  activeSheetId,
  rawData = [],
  onClose,
}: ExportModalProps) {
  const [selectedSheets, setSelectedSheets] = useState<string[]>([activeSheetId])
  const [format, setFormat] = useState('pdf')
  const [step, setStep] = useState<'select' | 'exporting' | 'done' | 'error'>('select') // select | exporting | done | error
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  const selectedFormat = FORMATS.find(f => f.id === format)!

  // ── SELECTION HELPERS ────────────────────────────────
  const toggleSheet = (id: string) => {
    setSelectedSheets(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : [...prev, id]
    )
  }

  const selectAll = () => setSelectedSheets(sheets.map(s => s.id))
  const selectNone = () => setSelectedSheets([])
  const selectCurrent = () => setSelectedSheets([activeSheetId])

  // ── EXPORT HANDLER ───────────────────────────────────
  const handleExport = async () => {
    if (selectedSheets.length === 0) return

    setStep('exporting')
    setProgress(0)

    const sheetsToExport = sheets.filter(s =>
      selectedSheets.includes(s.id)
    )

    try {
      const isSingle = sheetsToExport.length === 1
      const progressCb = (p: number) => setProgress(p)

      if (format === 'pdf') {
        if (isSingle) {
          setProgress(30)
          await exportSheetAsPDF(
            sheetsToExport[0].id,
            sheetsToExport[0].name
          )
          setProgress(100)
        } else {
          await exportMultipleSheetsPDF(sheetsToExport, progressCb)
        }

      } else if (format === 'png') {
        if (isSingle) {
          setProgress(30)
          await exportSheetAsPNG(
            sheetsToExport[0].id,
            sheetsToExport[0].name
          )
          setProgress(100)
        } else {
          await exportMultipleSheetsPNG(sheetsToExport, progressCb)
        }

      } else if (format === 'csv') {
        exportMultipleSheetsCSV(sheetsToExport, rawData, progressCb)
      }

      setStep('done')
      // Auto close after 2 seconds
      setTimeout(() => onClose(), 2000)

    } catch (err: any) {
      console.error('Export failed:', err)
      setErrorMsg(err.message || 'Export failed. Please try again.')
      setStep('error')
    }
  }

  // ── RENDER ───────────────────────────────────────────
  return (
    <>
      {/* ── BACKDROP ── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.78)',
          backdropFilter: 'blur(8px)',
          zIndex: 9982,
          animation: 'backdropIn 0.2s ease',
        }}
      />

      {/* ── MODAL ── */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        maxHeight: '88vh',
        overflowY: 'auto',
        background: '#0D0B14',
        border: '1px solid rgba(124,58,237,0.45)',
        borderRadius: '18px',
        zIndex: 9991,
        boxShadow: `
          0 0 0 1px rgba(124,58,237,0.1),
          0 32px 80px rgba(124,58,237,0.3),
          0 8px 32px rgba(0,0,0,0.7)
        `,
        animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        scrollbarWidth: 'none',
      }}>

        <style>{`
          @keyframes backdropIn {
            from { opacity: 0 }
            to   { opacity: 1 }
          }
          @keyframes modalIn {
            from { opacity:0; transform:translate(-50%,-46%) scale(0.96) }
            to   { opacity:1; transform:translate(-50%,-50%) scale(1) }
          }
          @keyframes spin {
            to { transform: rotate(360deg) }
          }
          @keyframes checkPop {
            0%   { transform: scale(0) }
            70%  { transform: scale(1.2) }
            100% { transform: scale(1) }
          }
          @keyframes progressAnim {
            from { width: 0% }
          }
        `}</style>

        {/* ════════════════════════
            HEADER
        ════════════════════════ */}
        <div style={{
          padding: '22px 24px 18px',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(225,29,145,0.1))',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '18px 18px 0 0',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '5px',
            }}>
              <span style={{
                fontSize: '20px',
                filter: 'drop-shadow(0 0 8px rgba(124,58,237,0.6))',
              }}>⬇</span>
              <h2 style={{
                fontFamily: 'var(--font-orbitron)',
                fontSize: '15px',
                fontWeight: '700',
                color: '#FFFFFF',
                letterSpacing: '2.5px',
                margin: 0,
              }}>
                EXPORT_SHEETS
              </h2>
            </div>
            <p style={{
              fontFamily: 'var(--font-share-tech-mono)',
              fontSize: '10px',
              color: '#64748B',
              letterSpacing: '1.5px',
              margin: 0,
            }}>
              SELECT FORMAT · CHOOSE SHEETS · DOWNLOAD
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#64748B',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#FF4D6D'
              e.currentTarget.style.borderColor = 'rgba(255,77,109,0.4)'
              e.currentTarget.style.background = 'rgba(255,77,109,0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#64748B'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
            }}
          >
            ×
          </button>
        </div>


        {/* ════════════════════════
            STEP: SELECT
        ════════════════════════ */}
        {step === 'select' && (
          <div style={{ padding: '0 0 4px' }}>

            {/* ── FORMAT SELECTOR ── */}
            <div style={{ padding: '20px 24px 0' }}>
              <Label>EXPORT FORMAT</Label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '8px',
                marginTop: '10px',
              }}>
                {FORMATS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    style={{
                      padding: '14px 10px',
                      background: format === f.id
                        ? `rgba(${f.rgb},0.14)`
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${format === f.id
                        ? f.color
                        : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      textAlign: 'center',
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      if (format !== f.id) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                        e.currentTarget.style.borderColor = `rgba(${f.rgb},0.4)`
                      }
                    }}
                    onMouseLeave={e => {
                      if (format !== f.id) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                      }
                    }}
                  >
                    {/* Selected checkmark */}
                    {format === f.id && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '16px',
                        height: '16px',
                        background: f.color,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        color: '#FFFFFF',
                        fontWeight: '700',
                      }}>
                        ✓
                      </div>
                    )}

                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                      {f.icon}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-share-tech-mono)',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: format === f.id ? f.color : '#94A3B8',
                      letterSpacing: '1px',
                      marginBottom: '5px',
                    }}>
                      {f.label}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-share-tech-mono)',
                      fontSize: '9px',
                      color: '#475569',
                      letterSpacing: '0.5px',
                      lineHeight: 1.4,
                    }}>
                      {selectedSheets.length > 1 ? f.multiDesc : f.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── SHEET SELECTOR ── */}
            <div style={{ padding: '20px 24px 0' }}>

              {/* Row: label + quick select buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}>
                <Label>
                  SHEETS&nbsp;
                  <span style={{ color: '#7C3AED' }}>
                    {selectedSheets.length}/{sheets.length} SELECTED
                  </span>
                </Label>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { label: 'ALL', fn: selectAll, color: '#7C3AED' },
                    { label: 'NONE', fn: selectNone, color: '#64748B' },
                    { label: 'CURRENT', fn: selectCurrent, color: '#00E5FF' },
                  ].map(btn => (
                    <QuickBtn
                      key={btn.label}
                      color={btn.color}
                      onClick={btn.fn}
                    >
                      {btn.label}
                    </QuickBtn>
                  ))}
                </div>
              </div>

              {/* Sheet list */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                maxHeight: '280px',
                overflowY: 'auto',
                paddingRight: '4px',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(124,58,237,0.3) transparent',
              }}>
                {sheets.map((sheet, idx) => {
                  const isChecked = selectedSheets.includes(sheet.id)
                  const isActive = sheet.id === activeSheetId
                  const dotColor = SHEET_COLORS[idx % SHEET_COLORS.length]
                  const dotRgb = hexToRgb(dotColor)

                  return (
                    <div
                      key={sheet.id}
                      onClick={() => toggleSheet(sheet.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '13px 14px',
                        background: isChecked
                          ? `rgba(${dotRgb},0.1)`
                          : 'rgba(255,255,255,0.025)',
                        border: `1px solid ${isChecked
                          ? `rgba(${dotRgb},0.45)`
                          : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        userSelect: 'none',
                      }}
                      onMouseEnter={e => {
                        if (!isChecked) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                          e.currentTarget.style.borderColor = `rgba(${dotRgb},0.3)`
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isChecked) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                        }
                      }}
                    >
                      {/* Custom checkbox */}
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        border: `2px solid ${isChecked
                          ? dotColor
                          : 'rgba(255,255,255,0.2)'}`,
                        background: isChecked
                          ? `rgba(${dotRgb},0.2)`
                          : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }}>
                        {isChecked && (
                          <span style={{
                            color: dotColor,
                            fontSize: '12px',
                            fontWeight: '700',
                            lineHeight: 1,
                          }}>✓</span>
                        )}
                      </div>

                      {/* Color dot */}
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: dotColor,
                        boxShadow: isChecked
                          ? `0 0 8px ${dotColor}`
                          : 'none',
                        flexShrink: 0,
                        transition: 'box-shadow 0.15s',
                      }} />

                      {/* Sheet info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '3px',
                        }}>
                          <span style={{
                            fontFamily: 'var(--font-share-tech-mono)',
                            fontSize: '13px',
                            color: isChecked ? '#FFFFFF' : '#94A3B8',
                            letterSpacing: '0.5px',
                            transition: 'color 0.15s',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {sheet.name}
                          </span>

                          {/* ACTIVE badge */}
                          {isActive && (
                            <span style={{
                              fontFamily: 'var(--font-share-tech-mono)',
                              fontSize: '9px',
                              color: '#A3E635',
                              background: 'rgba(163,230,53,0.12)',
                              border: '1px solid rgba(163,230,53,0.35)',
                              borderRadius: '4px',
                              padding: '1px 7px',
                              letterSpacing: '1px',
                              flexShrink: 0,
                            }}>
                              ACTIVE
                            </span>
                          )}
                        </div>

                        <div style={{
                          fontFamily: 'var(--font-share-tech-mono)',
                          fontSize: '10px',
                          color: '#475569',
                          letterSpacing: '0.5px',
                        }}>
                          {sheet.charts?.length || 0} CHARTS
                          {sheet.filters?.length > 0 &&
                            `  ·  ${sheet.filters.length} FILTERS`}
                        </div>
                      </div>

                      {/* Sheet index badge */}
                      <div style={{
                        fontFamily: 'var(--font-martian-mono)',
                        fontSize: '11px',
                        color: dotColor,
                        background: `rgba(${dotRgb},0.1)`,
                        border: `1px solid rgba(${dotRgb},0.25)`,
                        borderRadius: '6px',
                        padding: '3px 9px',
                        flexShrink: 0,
                        fontWeight: '700',
                      }}>
                        {idx + 1}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── FOOTER ── */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              marginTop: '20px',
            }}>
              {/* Summary text */}
              <span style={{
                fontFamily: 'var(--font-share-tech-mono)',
                fontSize: '10px',
                color: '#475569',
                letterSpacing: '0.5px',
              }}>
                {selectedSheets.length === 0
                  ? 'No sheets selected'
                  : selectedSheets.length === 1
                    ? `1 sheet as ${format.toUpperCase()}`
                    : `${selectedSheets.length} sheets as ${format.toUpperCase()}`
                }
              </span>

              <div style={{ display: 'flex', gap: '10px' }}>
                {/* Cancel */}
                <button
                  onClick={onClose}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '9px',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-share-tech-mono)',
                    fontSize: '11px',
                    letterSpacing: '1px',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#FFFFFF'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = '#94A3B8'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  }}
                >
                  CANCEL
                </button>

                {/* Export button */}
                <button
                  onClick={handleExport}
                  disabled={selectedSheets.length === 0}
                  style={{
                    padding: '10px 24px',
                    background: selectedSheets.length === 0
                      ? 'rgba(255,255,255,0.04)'
                      : `linear-gradient(135deg, ${selectedFormat.color}, #7C3AED)`,
                    border: 'none',
                    borderRadius: '9px',
                    color: selectedSheets.length === 0 ? '#334155' : '#FFFFFF',
                    cursor: selectedSheets.length === 0
                      ? 'not-allowed'
                      : 'pointer',
                    fontFamily: 'var(--font-share-tech-mono)',
                    fontSize: '11px',
                    letterSpacing: '1px',
                    fontWeight: '700',
                    boxShadow: selectedSheets.length > 0
                      ? `0 4px 20px rgba(${selectedFormat.rgb},0.4)`
                      : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  ⬇ EXPORT{selectedSheets.length > 0
                    ? ` ${selectedSheets.length} SHEET${selectedSheets.length > 1 ? 'S' : ''}`
                    : ''}
                </button>
              </div>
            </div>
          </div>
        )}


        {/* ════════════════════════
            STEP: EXPORTING
        ════════════════════════ */}
        {step === 'exporting' && (
          <div style={{
            padding: '56px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}>
            {/* Spinner */}
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              border: '3px solid rgba(124,58,237,0.15)',
              borderTop: `3px solid ${selectedFormat.color}`,
              animation: 'spin 0.9s linear infinite',
            }} />

            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--font-orbitron)',
                fontSize: '13px',
                color: '#FFFFFF',
                letterSpacing: '2px',
                margin: '0 0 6px',
              }}>
                EXPORTING...
              </p>
              <p style={{
                fontFamily: 'var(--font-share-tech-mono)',
                fontSize: '11px',
                color: '#64748B',
                letterSpacing: '1px',
                margin: 0,
              }}>
                {selectedSheets.length} SHEET{selectedSheets.length > 1 ? 'S' : ''}
                &nbsp;AS {format.toUpperCase()}
              </p>
            </div>

            {/* Progress bar */}
            <div style={{
              width: '100%',
              maxWidth: '280px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}>
                <span style={{
                  fontFamily: 'var(--font-share-tech-mono)',
                  fontSize: '10px',
                  color: '#475569',
                  letterSpacing: '1px',
                }}>
                  PROGRESS
                </span>
                <span style={{
                  fontFamily: 'var(--font-martian-mono)',
                  fontSize: '10px',
                  color: selectedFormat.color,
                }}>
                  {progress}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                background: 'rgba(255,255,255,0.07)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, #7C3AED, ${selectedFormat.color})`,
                  borderRadius: '4px',
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>

            <p style={{
              fontFamily: 'var(--font-share-tech-mono)',
              fontSize: '10px',
              color: '#334155',
              letterSpacing: '0.5px',
              margin: 0,
            }}>
              Please keep this window open...
            </p>
          </div>
        )}


        {/* ════════════════════════
            STEP: DONE
        ════════════════════════ */}
        {step === 'done' && (
          <div style={{
            padding: '56px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '18px',
          }}>
            {/* Success circle */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(163,230,53,0.12)',
              border: '2px solid #A3E635',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              animation: 'checkPop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
              boxShadow: '0 0 24px rgba(163,230,53,0.3)',
            }}>
              ✓
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--font-orbitron)',
                fontSize: '14px',
                color: '#A3E635',
                letterSpacing: '2px',
                margin: '0 0 8px',
              }}>
                EXPORT COMPLETE
              </p>
              <p style={{
                fontFamily: 'var(--font-share-tech-mono)',
                fontSize: '11px',
                color: '#64748B',
                letterSpacing: '1px',
                margin: 0,
              }}>
                {selectedSheets.length} SHEET{selectedSheets.length > 1 ? 'S' : ''}
                &nbsp;SAVED AS {format.toUpperCase()}
              </p>
            </div>

            <p style={{
              fontFamily: 'var(--font-share-tech-mono)',
              fontSize: '10px',
              color: '#334155',
              letterSpacing: '0.5px',
            }}>
              Closing automatically...
            </p>
          </div>
        )}


        {/* ════════════════════════
            STEP: ERROR
        ════════════════════════ */}
        {step === 'error' && (
          <div style={{
            padding: '56px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '18px',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(255,77,109,0.12)',
              border: '2px solid #FF4D6D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: '0 0 24px rgba(255,77,109,0.25)',
            }}>
              ✕
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--font-orbitron)',
                fontSize: '13px',
                color: '#FF4D6D',
                letterSpacing: '2px',
                margin: '0 0 8px',
              }}>
                EXPORT FAILED
              </p>
              <p style={{
                fontFamily: 'var(--font-share-tech-mono)',
                fontSize: '11px',
                color: '#64748B',
                letterSpacing: '0.5px',
                margin: '0 0 20px',
                maxWidth: '300px',
                lineHeight: 1.6,
              }}>
                {errorMsg}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '9px',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-share-tech-mono)',
                  fontSize: '11px',
                  letterSpacing: '1px',
                }}
              >
                CLOSE
              </button>
              <button
                onClick={() => setStep('select')}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #7C3AED, #E11D91)',
                  border: 'none',
                  borderRadius: '9px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-share-tech-mono)',
                  fontSize: '11px',
                  letterSpacing: '1px',
                  boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
                }}
              >
                TRY AGAIN
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  )
}


// ── REUSABLE SUB-COMPONENTS ────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'var(--font-share-tech-mono)',
      fontSize: '10px',
      color: '#64748B',
      letterSpacing: '1.5px',
      margin: 0,
      textTransform: 'uppercase',
    }}>
      {children}
    </p>
  )
}

function QuickBtn({ children, onClick, color }: { children: React.ReactNode, onClick: () => void, color: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '6px',
        color: '#64748B',
        cursor: 'pointer',
        fontFamily: 'var(--font-share-tech-mono)',
        fontSize: '9px',
        letterSpacing: '1px',
        padding: '4px 10px',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = color
        e.currentTarget.style.borderColor = color
        e.currentTarget.style.background = `rgba(${hexToRgb(color)},0.1)`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = '#64748B'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
      }}
    >
      {children}
    </button>
  )
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return `${r},${g},${b}`
}
