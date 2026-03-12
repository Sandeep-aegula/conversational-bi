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
  
  const w = canvas.width / 2;
  const h = canvas.height / 2;

  const pdf = new jsPDF({
    orientation: w > h ? 'landscape' : 'portrait',
    unit: 'px',
    format: [w, h],
  })

  // Full-bleed add image (no header stripe to avoid white gaps)
  pdf.addImage(imgData, 'PNG', 0, 0, w, h)
  pdf.save(`PRISM_${sanitizeFilename(sheetName)}_${getTimestamp()}.pdf`)
}


// ── MULTIPLE SHEETS → ONE PDF (multi-page) ─────────────
export async function exportMultipleSheetsPDF(sheetsToExport: any[], onProgress?: (p: number) => void) {
  let pdf: any = null;

  for (let i = 0; i < sheetsToExport.length; i++) {
    const sheet = sheetsToExport[i]
    const element = document.getElementById(`sheet-content-${sheet.id}`)

    if (!element) {
      console.warn(`Skipping sheet ${sheet.name} — element not found`)
      continue
    }

    const canvas = await html2canvas(element, { ...CANVAS_OPTIONS, scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const w = canvas.width / 2;
    const h = canvas.height / 2;

    if (!pdf) {
      pdf = new jsPDF({
        orientation: w > h ? 'landscape' : 'portrait',
        unit: 'px',
        format: [w, h],
      })
    } else {
      pdf.addPage([w, h], w > h ? 'landscape' : 'portrait')
    }

    // Full-bleed image for the specific sheet size
    pdf.addImage(imgData, 'PNG', 0, 0, w, h)

    if (onProgress) {
      onProgress(Math.round(((i + 1) / sheetsToExport.length) * 100))
    }

    await delay(200)
  }

  if (pdf) {
    pdf.save(`PRISM_Full_Export_${getTimestamp()}.pdf`)
  }
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
