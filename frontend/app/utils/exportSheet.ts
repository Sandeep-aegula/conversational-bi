// utils/exportSheet.ts

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// ── CAPTURE OPTIONS ────────────────────────────────────
const CANVAS_OPTIONS = {
  backgroundColor: '#07080F',
  scale: 2,
  useCORS: true,
  allowTaint: true,
  logging: false,
  imageTimeout: 15000,
}

// ── SINGLE SHEET → PDF ─────────────────────────────────
export async function exportSheetAsPDF(sheetId: string, sheetName: string) {
  const element = document.getElementById(`sheet-content-${sheetId}`)
  if (!element) throw new Error(`Cannot find sheet: ${sheetName}`)

  const canvas = await html2canvas(element, CANVAS_OPTIONS)
  const imgData = canvas.toDataURL('image/png')

  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [canvas.width / 2, canvas.height / 2],
  })

  // Header stripe
  pdf.setFillColor(124, 58, 237)
  pdf.rect(0, 0, canvas.width / 2, 24, 'F')

  // Sheet name in header
  pdf.setFontSize(9)
  pdf.setTextColor(255, 255, 255)
  pdf.text(
    `PRISM  ·  ${sheetName}  ·  ${getTimestamp()}`,
    12, 15
  )

  // Chart image
  pdf.addImage(imgData, 'PNG', 0, 24, canvas.width / 2, canvas.height / 2)

  pdf.save(`PRISM_${sanitizeFilename(sheetName)}_${getTimestamp()}.pdf`)
}


// ── MULTIPLE SHEETS → ONE PDF (multi-page) ─────────────
export async function exportMultipleSheetsPDF(sheetsToExport: any[], onProgress?: (p: number) => void) {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: 'a4',
  })

  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()

  for (let i = 0; i < sheetsToExport.length; i++) {
    const sheet = sheetsToExport[i]
    // Use the ID pattern used in Dashboard.tsx
    const element = document.getElementById(`sheet-content-${sheet.id}`)

    if (!element) {
      console.warn(`Skipping sheet ${sheet.name} — element not found`)
      continue
    }

    if (i > 0) pdf.addPage()

    // Header stripe per page
    pdf.setFillColor(124, 58, 237)
    pdf.rect(0, 0, pageW, 28, 'F')

    pdf.setFontSize(9)
    pdf.setTextColor(255, 255, 255)
    pdf.text(
      `PRISM  ·  ${sheet.name}  ·  Page ${i + 1} of ${sheetsToExport.length}  ·  ${getTimestamp()}`,
      12, 17
    )

    // Capture chart area
    const canvas = await html2canvas(element, {
      ...CANVAS_OPTIONS,
      scale: 1.5,
    })
    const imgData = canvas.toDataURL('image/png')

    // Scale to fit page
    const ratio = Math.min(
      pageW / canvas.width,
      (pageH - 32) / canvas.height
    )
    const imgW = canvas.width * ratio
    const imgH = canvas.height * ratio
    const x = (pageW - imgW) / 2

    pdf.addImage(imgData, 'PNG', x, 32, imgW, imgH)

    // Progress callback
    if (onProgress) {
      onProgress(Math.round(((i + 1) / sheetsToExport.length) * 100))
    }

    // Small delay so browser doesn't freeze
    await delay(300)
  }

  pdf.save(`PRISM_Export_${sheetsToExport.length}sheets_${getTimestamp()}.pdf`)
}


// ── SINGLE SHEET → PNG ─────────────────────────────────
export async function exportSheetAsPNG(sheetId: string, sheetName: string) {
  const element = document.getElementById(`sheet-content-${sheetId}`)
  if (!element) throw new Error(`Cannot find sheet: ${sheetName}`)

  const canvas = await html2canvas(element, CANVAS_OPTIONS)

  const link = document.createElement('a')
  link.download = `PRISM_${sanitizeFilename(sheetName)}_${getTimestamp()}.png`
  link.href = canvas.toDataURL('image/png')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}


// ── MULTIPLE SHEETS → MULTIPLE PNGs ────────────────────
export async function exportMultipleSheetsPNG(sheetsToExport: any[], onProgress?: (p: number) => void) {
  for (let i = 0; i < sheetsToExport.length; i++) {
    await exportSheetAsPNG(sheetsToExport[i].id, sheetsToExport[i].name)
    if (onProgress) {
      onProgress(Math.round(((i + 1) / sheetsToExport.length) * 100))
    }
    await delay(500) // gap between downloads
  }
}


// ── SHEET DATA → CSV ───────────────────────────────────
export function exportSheetAsCSV(sheet: any, rawData: any[]) {
  if (!rawData || rawData.length === 0) {
    throw new Error('No raw data available for CSV export')
  }

  const headers = Object.keys(rawData[0])
  const csvRows = [
    // Header row
    headers.map(h => `"${h}"`).join(','),
    // Data rows
    ...rawData.map(row =>
      headers.map(h => {
        const val = row[h] ?? ''
        const str = String(val)
        // Wrap in quotes if contains special chars
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      }).join(',')
    )
  ]

  const csv = csvRows.join('\n')
  const blob = new Blob(['\uFEFF' + csv], {
    type: 'text/csv;charset=utf-8;'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `PRISM_${sanitizeFilename(sheet.name)}_${getTimestamp()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}


// ── MULTIPLE SHEETS → MULTIPLE CSVs ───────────────────
export function exportMultipleSheetsCSV(sheetsToExport: any[], rawData: any[], onProgress?: (p: number) => void) {
  sheetsToExport.forEach((sheet, i) => {
    exportSheetAsCSV(sheet, rawData)
    if (onProgress) {
      onProgress(Math.round(((i + 1) / sheetsToExport.length) * 100))
    }
  })
}


// ── HELPERS ────────────────────────────────────────────
function getTimestamp() {
  return new Date().toISOString().slice(0, 10)
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9_\-]/g, '_')
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
