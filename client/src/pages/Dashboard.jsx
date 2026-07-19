import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import {
  FaWeight, FaTint, FaHeartbeat, FaRunning, FaPlus, FaTimes, FaChartLine, FaFilePdf,
  FaUsers, FaArrowLeft, FaUserFriends, FaFilter, FaCalendarAlt,
  FaVial, FaFlask, FaChevronLeft, FaChevronRight,
} from 'react-icons/fa'
import {
  ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area,
} from 'recharts'
import jsPDF from 'jspdf'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'
import MedicationsPanel from '../components/dashboard/MedicationsPanel'
import SupplementsPanel from '../components/dashboard/SupplementsPanel'
import WearableSection from '../components/dashboard/WearableSection'
import StreakBadges from '../components/dashboard/StreakBadges'
import AddFamilyMemberModal from '../components/family/AddFamilyMemberModal'
import {
  calcBMI, getBMICategory, getGlucoseCategory, getHeartRateCategory, getBloodPressureCategory,
  getCholesterolCategory, getTriglyceridesCategory,
} from '../utils/bmiUtils'

const RELATIONSHIP_LABELS = {
  abuelo: 'Abuelo', abuela: 'Abuela', padre: 'Padre', madre: 'Madre',
  tio: 'Tío', tia: 'Tía', hermano: 'Hermano', hermana: 'Hermana',
  hijo: 'Hijo', hija: 'Hija', otro: 'Otro',
}
const MAX_FAMILY = 4

const TYPES = [
  { key: 'weight', label: 'Peso', icon: FaWeight, unit: 'kg', color: 'var(--color-metric-weight)', gradient: ['var(--color-metric-weight-grad-0)', 'var(--color-metric-weight-grad-1)'] },
  { key: 'glucose', label: 'Glucosa', icon: FaTint, unit: 'mg/dL', color: 'var(--color-metric-glucose)', gradient: ['var(--color-metric-glucose-grad-0)', 'var(--color-metric-glucose-grad-1)'] },
  { key: 'bloodPressure', label: 'Presión Arterial', icon: FaHeartbeat, unit: 'mmHg', color: 'var(--color-metric-bloodPressure)', gradient: ['var(--color-metric-bloodPressure-grad-0)', 'var(--color-metric-bloodPressure-grad-1)'] },
  { key: 'heartRate', label: 'Frec. Cardíaca', icon: FaRunning, unit: 'bpm', color: 'var(--color-metric-heartRate)', gradient: ['var(--color-metric-heartRate-grad-0)', 'var(--color-metric-heartRate-grad-1)'] },
  { key: 'cholesterol', label: 'Colesterol', icon: FaVial, unit: 'mg/dL', color: 'var(--color-metric-cholesterol)', gradient: ['var(--color-metric-cholesterol-grad-0)', 'var(--color-metric-cholesterol-grad-1)'] },
  { key: 'triglycerides', label: 'Triglicéridos', icon: FaFlask, unit: 'mg/dL', color: 'var(--color-metric-triglycerides)', gradient: ['var(--color-metric-triglycerides-grad-0)', 'var(--color-metric-triglycerides-grad-1)'] },
]

// Helper to shade a hex color (adjust brightness by percent)
function adjustColorBrightness(hex, percent) {
  if (!hex || hex.charAt(0) !== '#') return hex;
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);

  R = parseInt((R * (100 + percent)) / 100);
  G = parseInt((G * (100 + percent)) / 100);
  B = parseInt((B * (100 + percent)) / 100);

  R = (R < 255) ? R : 255;
  G = (G < 255) ? G : 255;
  B = (B < 255) ? B : 255;

  R = (R > 0) ? R : 0;
  G = (G > 0) ? G : 0;
  B = (B > 0) ? B : 0;

  const rHex = R.toString(16).padStart(2, '0');
  const gHex = G.toString(16).padStart(2, '0');
  const bHex = B.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

export default function Dashboard() {
  const { user, setUser } = useAuth()
  
  const customThemeStyles = user?.themeColor ? {
    '--color-primary-50': adjustColorBrightness(user.themeColor, 120),
    '--color-primary-100': adjustColorBrightness(user.themeColor, 90),
    '--color-primary-200': adjustColorBrightness(user.themeColor, 60),
    '--color-primary-300': adjustColorBrightness(user.themeColor, 30),
    '--color-primary-400': adjustColorBrightness(user.themeColor, 15),
    '--color-primary-500': user.themeColor,
    '--color-primary-600': adjustColorBrightness(user.themeColor, -15),
    '--color-primary-700': adjustColorBrightness(user.themeColor, -30),
    '--color-primary-800': adjustColorBrightness(user.themeColor, -45),
    '--color-primary-900': adjustColorBrightness(user.themeColor, -60),
  } : {}
  const { dark } = useTheme()
  const [stats, setStats] = useState(null)
  const [records, setRecords] = useState([])
  const [activeType, setActiveType] = useState('weight')
  const [startIndex, setStartIndex] = useState(0)

  // Auto-focus active type in carousel
  useEffect(() => {
    const idx = TYPES.findIndex(t => t.key === activeType)
    if (idx !== -1) {
      setStartIndex(prev => {
        if (idx < prev) {
          return idx
        } else if (idx >= prev + 4) {
          return idx - 3
        }
        return prev
      })
    }
  }, [activeType])

  const [showModal, setShowModal] = useState(false)
  const [editRecord, setEditRecord] = useState(null) // null = create mode, record = edit mode
  const [recordToDelete, setRecordToDelete] = useState(null)
  const [formData, setFormData] = useState({ type: 'weight', value: '', value2: '', heightCm: '', notes: '', recordedAt: new Date().toISOString().slice(0, 16) })
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [expandedTypes, setExpandedTypes] = useState({})
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showCustomPicker, setShowCustomPicker] = useState(false)
  const pdfMenuRef = useRef(null)

  // ── Date filter state ────────────────────────────
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [showDateFilter, setShowDateFilter] = useState(false)
  const hasDateFilter = filterFrom || filterTo
  const clearDateFilter = () => { setFilterFrom(''); setFilterTo('') }
  const [streaks, setStreaks] = useState(null)
  const [showStreakModal, setShowStreakModal] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ── Family integration state ──────────────────────
  const [familyMembers, setFamilyMembers] = useState([])
  const [selectedFamilyId, setSelectedFamilyId] = useState(null) // null = own profile
  const [familyModalOpen, setFamilyModalOpen] = useState(false)
  const [loadingFamily, setLoadingFamily] = useState(true)

  const selectedMember = familyMembers.find(m => m.id === selectedFamilyId)
  const isViewingFamily = selectedFamilyId !== null

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (pdfMenuRef.current && !pdfMenuRef.current.contains(e.target)) {
        setPdfMenuOpen(false)
        setShowCustomPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleExportPDF = async ({ fromDate, toDate } = {}) => {
    setPdfMenuOpen(false)
    setShowCustomPicker(false)
    setExporting(true)
    try {
      // Fetch records and filter by the requested date range
      const recordsEndpoint = selectedFamilyId
        ? `/family/${selectedFamilyId}/health`
        : '/health-tracking/records'
      const allRecordsRes = await api.get(recordsEndpoint, { params: { limit: 500 } })
      const from = fromDate ? new Date(fromDate) : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d })()
      const to = toDate ? new Date(toDate) : new Date()
      to.setHours(23, 59, 59, 999)  // include the full end day
      const allRecords = (allRecordsRes.data.records || [])
        .filter(r => { const d = new Date(r.recordedAt); return d >= from && d <= to })
      const statsData = stats

      // ── Load logos (base64 + natural dimensions) ─────────
      const loadLogo = (url) => new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          canvas.getContext('2d').drawImage(img, 0, 0)
          resolve({ b64: canvas.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight })
        }
        img.onerror = () => resolve(null)
        img.crossOrigin = 'anonymous'
        img.src = url
      })

      const logoSrcs = ['/logo-tamaulipas.png', '/logo-injuventud.png', '/logo-salud.png', '/logo-bienestar.png']
      const logoData = (await Promise.all(logoSrcs.map(loadLogo))).filter(Boolean)

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const margin = 15
      let y = margin

      const hexToRgb = (colorStr) => {
        let hex = colorStr
        if (hex.startsWith('var(')) {
          const varName = hex.slice(4, -1).trim()
          hex = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
        }
        if (!hex || !hex.startsWith('#')) return [136, 136, 136]
        return [
          parseInt(hex.slice(1, 3), 16),
          parseInt(hex.slice(3, 5), 16),
          parseInt(hex.slice(5, 7), 16),
        ]
      }

      const addPageIfNeeded = (needed = 10) => {
        if (y + needed > pageH - margin) {
          pdf.addPage()
          y = margin
          return true
        }
        return false
      }

      // ── Header bar (white background for logos) ─────────
      const headerH = 36
      pdf.setFillColor(255, 255, 255)  // blanco
      pdf.rect(0, 0, pageW, headerH, 'F')

      // Place logos in equal slots, preserving aspect ratio, no overlap
      const slotW = (pageW - margin * 2) / logoData.length  // mm per slot
      const maxLogoH = 24  // max height in mm
      const padding = 3    // horizontal padding inside each slot

      logoData.forEach(({ b64, w, h }, i) => {
        const maxW = slotW - padding * 2
        let lw = (w / h) * maxLogoH
        let lh = maxLogoH
        if (lw > maxW) {          // too wide → scale down by width
          lw = maxW
          lh = (h / w) * lw
        }
        const slotX = margin + i * slotW
        const lx = slotX + (slotW - lw) / 2   // center horizontally in slot
        const ly = (headerH - lh) / 2           // center vertically in bar
        try {
          pdf.addImage(b64, 'PNG', lx, ly, lw, lh, undefined, 'FAST')
        } catch { /* skip if corrupt */ }
      })

      // Subtle title row below the logos
      pdf.setFillColor(94, 12, 35) // darker stripe
      pdf.rect(0, headerH, pageW, 10, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Jóvenes con Salud — Instituto de la Juventud de Tamaulipas', margin, headerH + 7)
      const dateStr = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.text(`Generado: ${dateStr}`, pageW - margin, headerH + 7, { align: 'right' })
      y = headerH + 18


      // ── Patient info ────────────────────────────────────
      pdf.setTextColor(15, 23, 42)
      pdf.setFontSize(13)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Reporte Mensual de Salud', margin, y)
      y += 7
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 116, 139)
      const patientName = isViewingFamily && selectedMember ? selectedMember.name : (user?.name || 'N/D')
      const patientDetail = isViewingFamily && selectedMember
        ? `Familiar: ${patientName}   |   Parentesco: ${RELATIONSHIP_LABELS[selectedMember.relationship] || selectedMember.relationship}   |   Usuario: ${user?.name || 'N/D'}`
        : `Paciente: ${patientName}   |   Correo: ${user?.email || 'N/D'}`
      pdf.text(patientDetail, margin, y)
      y += 3
      pdf.setDrawColor(226, 232, 240)
      pdf.line(margin, y, pageW - margin, y)
      y += 8

      // ── Summary cards (matching Dashboard metric cards) ─────
      pdf.setTextColor(15, 23, 42)
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Últimas mediciones registradas', margin, y)
      y += 7

      const cardW = (pageW - margin * 2 - 5) / 2
      const cardH = 34
      const gapX = 5
      const gapY = 4

      // Pre-load the saved height for BMI (same logic as the dashboard)
      const pdfHeightKey = isViewingFamily
        ? `bmi_height_family_${selectedFamilyId}`
        : `bmi_height_user_${user?.id}`

      TYPES.forEach((t, i) => {
        const row = Math.floor(i / 2)
        const col = i % 2
        const x = margin + col * (cardW + gapX)
        const cardY = y + row * (cardH + gapY)
        const latest = statsData?.latest?.[t.key]
        const val = latest
          ? (latest.type === 'bloodPressure' ? `${latest.value}/${latest.value2}` : `${latest.value}`)
          : 'Sin datos'
        const unit = latest ? t.unit : ''

        // ── Resolve metric color ──
        const [cr, cg, cb] = hexToRgb(t.color)

        // ── Card background + border ──
        pdf.setFillColor(248, 250, 252)
        pdf.roundedRect(x, cardY, cardW, cardH, 2.5, 2.5, 'F')
        pdf.setDrawColor(226, 232, 240)
        pdf.roundedRect(x, cardY, cardW, cardH, 2.5, 2.5, 'S')

        // ── Colored accent bar at top ──
        pdf.setFillColor(cr, cg, cb)
        pdf.rect(x + 0.5, cardY + 0.5, cardW - 1, 2, 'F')

        // ── Label (e.g. "PESO") ──
        pdf.setFontSize(6.5)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(130, 140, 155)
        pdf.text(t.label.toUpperCase(), x + 4, cardY + 7.5)

        // ── Value + Unit ──
        pdf.setFontSize(15)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(15, 23, 42)
        pdf.text(val, x + 4, cardY + 15.5)
        if (unit) {
          const valWidth = pdf.getTextWidth(val)
          pdf.setFontSize(7.5)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(130, 140, 155)
          pdf.text(unit, x + 4 + valWidth + 1.5, cardY + 15.5)
        }

        // ── Health indicator badge + description ──
        if (latest) {
          // Compute category (same logic as Dashboard)
          const heightForBMI = t.key === 'weight'
            ? (latest.value2 || localStorage.getItem(pdfHeightKey))
            : null
          const bmi = t.key === 'weight' && latest.value && heightForBMI
            ? calcBMI(latest.value, heightForBMI)
            : null
          const bmiCat = getBMICategory(bmi)
          const glucoseCat = t.key === 'glucose' ? getGlucoseCategory(latest.value) : null
          const heartRateCat = t.key === 'heartRate' ? getHeartRateCategory(latest.value) : null
          const bpCat = t.key === 'bloodPressure' ? getBloodPressureCategory(latest.value, latest.value2) : null
          const cholesterolCat = t.key === 'cholesterol' ? getCholesterolCategory(latest.value) : null
          const triglyceridesCat = t.key === 'triglycerides' ? getTriglyceridesCategory(latest.value) : null
          const indicatorCat = bmiCat || glucoseCat || heartRateCat || bpCat || cholesterolCat || triglyceridesCat
          const indicatorLabel = bmiCat
            ? `IMC ${bmi} - ${bmiCat.label}`
            : indicatorCat?.label || null

          if (indicatorCat && indicatorLabel) {
            const [ir, ig, ib] = hexToRgb(indicatorCat.color)

            // Badge pill background
            const badgeX = x + 4
            const badgeY = cardY + 18.5
            const badgeText = indicatorLabel
            pdf.setFontSize(6.5)
            pdf.setFont('helvetica', 'bold')
            const dotSpace = 4 // space for the colored dot
            const badgeW = pdf.getTextWidth(badgeText) + dotSpace + 5
            const badgeH = 4.5
            const [br, bg2, bb] = hexToRgb(indicatorCat.bg)
            pdf.setFillColor(br, bg2, bb)
            const [bdr, bdg, bdb] = hexToRgb(indicatorCat.border)
            pdf.setDrawColor(bdr, bdg, bdb)
            pdf.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, 'FD')
            // Colored dot (replaces emoji which jsPDF can't render)
            pdf.setFillColor(ir, ig, ib)
            pdf.circle(badgeX + 3, badgeY + badgeH / 2, 1.2, 'F')
            // Label text
            pdf.setTextColor(ir, ig, ib)
            pdf.text(badgeText, badgeX + dotSpace + 2, badgeY + 3.3)

            // Description text after badge
            if (indicatorCat.description) {
              const descText = indicatorCat.description.replace(/[^\x20-\x7EÁÉÍÓÚáéíóúÑñ¡¿üÜ]/g, '')
              pdf.setFontSize(6)
              pdf.setFont('helvetica', 'italic')
              pdf.setTextColor(148, 163, 184)
              pdf.text(descText, badgeX + badgeW + 2, badgeY + 3.3)
            }
          }

          // ── Date ──
          const dateStr = new Date(latest.recordedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
          pdf.setFontSize(6)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(160, 170, 185)
          pdf.text(dateStr, x + 4, cardY + cardH - 3)
        }

        // ── Icon circle (top-right) ──
        const iconR = 4.5
        const iconCx = x + cardW - iconR - 4
        const iconCy = cardY + 9
        pdf.setFillColor(cr, cg, cb, 0.08)
        // Use a very light tint of the metric color
        pdf.setFillColor(
          Math.min(255, Math.round(cr + (255 - cr) * 0.88)),
          Math.min(255, Math.round(cg + (255 - cg) * 0.88)),
          Math.min(255, Math.round(cb + (255 - cb) * 0.88))
        )
        pdf.circle(iconCx, iconCy, iconR, 'F')
        // Small colored dot in center to represent the icon
        pdf.setFillColor(cr, cg, cb)
        pdf.circle(iconCx, iconCy, 1.5, 'F')
      })
      y += Math.ceil(TYPES.length / 2) * (cardH + gapY) + 3

      // ── Per-type: Table + Chart ──────────────────────────
      const colsT = [
        { label: 'Fecha', x: margin, w: 44 },
        { label: 'Valor', x: margin + 44, w: 28 },
        { label: 'Unidad', x: margin + 72, w: 24 },
        { label: 'Notas', x: margin + 96, w: pageW - margin - 96 - margin },
      ]
      const rowH = 6.5



      const drawLineChart = (data, color) => {
        const chartH = 42
        addPageIfNeeded(chartH + 8)
        const cW = pageW - margin * 2
        const cX = margin, cY = y
        const [r, g, b] = hexToRgb(color)
        pdf.setFillColor(248, 250, 252)
        pdf.rect(cX, cY, cW, chartH, 'F')
        pdf.setDrawColor(226, 232, 240)
        pdf.rect(cX, cY, cW, chartH, 'S')
        if (data.length < 2) {
          pdf.setFontSize(8); pdf.setTextColor(148, 163, 184)
          pdf.text('Insuficientes datos para graficar', cX + cW / 2, cY + chartH / 2, { align: 'center' })
          y += chartH + 5; return
        }
        const vals = data.map(d => d.v)
        const minV = Math.min(...vals), maxV = Math.max(...vals), range = maxV - minV || 1
        const pad = 7
        const toX = (i) => cX + pad + (i / (data.length - 1)) * (cW - pad * 2)
        const toY = (v) => cY + chartH - pad - ((v - minV) / range) * (chartH - pad * 2)
        // grid lines
        pdf.setDrawColor(226, 232, 240); pdf.setLineWidth(0.15)
        for (let g = 0; g <= 4; g++) {
          const gy = cY + pad + (g / 4) * (chartH - pad * 2)
          pdf.line(cX + pad, gy, cX + cW - pad, gy)
        }
        // axis value labels
        pdf.setFontSize(5.5); pdf.setTextColor(148, 163, 184)
        pdf.text(`${maxV}`, cX + 1, cY + pad + 1)
        pdf.text(`${minV}`, cX + 1, cY + chartH - pad + 1)
        // line
        pdf.setDrawColor(r, g, b); pdf.setLineWidth(0.7)
        for (let i = 1; i < data.length; i++) {
          pdf.line(toX(i - 1), toY(vals[i - 1]), toX(i), toY(vals[i]))
        }
        // dots
        pdf.setFillColor(r, g, b)
        const step = Math.max(1, Math.floor(data.length / 8))
        data.forEach((d, i) => {
          pdf.circle(toX(i), toY(d.v), 0.9, 'F')
          if (i % step === 0 || i === data.length - 1) {
            pdf.setFontSize(5.5); pdf.setTextColor(148, 163, 184)
            pdf.text(d.label, toX(i), cY + chartH - 1, { align: 'center' })
          }
        })
        pdf.setLineWidth(0.2)
        y += chartH + 6
      }

      TYPES.forEach(t => {
        const recs = allRecords
          .filter(r => r.type === t.key)
          .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt))
        if (recs.length === 0) return

        addPageIfNeeded(20)
        const [cr, cg, cb] = hexToRgb(t.color)
        // Section header
        pdf.setFillColor(cr, cg, cb)
        pdf.rect(margin, y, pageW - margin * 2, 8, 'F')
        pdf.setTextColor(255, 255, 255); pdf.setFontSize(9); pdf.setFont('helvetica', 'bold')
        pdf.text(`${t.label}  (${t.unit})`, margin + 3, y + 5.5)
        pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal')
        pdf.text(`${recs.length} registro${recs.length !== 1 ? 's' : ''}`, pageW - margin - 2, y + 5.5, { align: 'right' })
        y += 8
        // Column headers
        pdf.setFillColor(240, 242, 245)
        pdf.rect(margin, y, pageW - margin * 2, 6, 'F')
        pdf.setTextColor(71, 85, 105); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold')
        colsT.forEach(c => pdf.text(c.label, c.x + 2, y + 4.2))
        y += 6
        // Rows
        pdf.setFont('helvetica', 'normal')
        recs.forEach((r, i) => {
          addPageIfNeeded(rowH + 2)
          pdf.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255)
          pdf.rect(margin, y, pageW - margin * 2, rowH, 'F')
          pdf.setTextColor(71, 85, 105); pdf.setFontSize(8)
          const rDate = new Date(r.recordedAt).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          const rVal = r.type === 'bloodPressure' ? `${r.value}/${r.value2}` : `${r.value}`
          pdf.text(rDate, colsT[0].x + 2, y + 4.5)
          pdf.text(rVal, colsT[1].x + 2, y + 4.5)
          pdf.text(t.unit, colsT[2].x + 2, y + 4.5)
          pdf.text(pdf.splitTextToSize(r.notes || '—', colsT[3].w - 4)[0], colsT[3].x + 2, y + 4.5)
          y += rowH
        })
        // Chart
        y += 3
        drawLineChart(recs.map(r => ({ v: parseFloat(r.value), label: new Date(r.recordedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) })), t.color)
        y += 2
      })

      // ── Footer ──────────────────────────────────────────
      const totalPages = pdf.internal.getNumberOfPages()
      for (let p = 1; p <= totalPages; p++) {
        pdf.setPage(p)
        pdf.setFillColor(248, 250, 252)
        pdf.rect(0, pageH - 10, pageW, 10, 'F')
        pdf.setDrawColor(226, 232, 240)
        pdf.line(0, pageH - 10, pageW, pageH - 10)
        pdf.setFontSize(7)
        pdf.setTextColor(148, 163, 184)
        pdf.text('Jóvenes con Salud — Instituto de la Juventud de Tamaulipas', margin, pageH - 4)
        pdf.text(`Página ${p} de ${totalPages}`, pageW - margin, pageH - 4, { align: 'right' })
      }

      // Force download with .pdf extension
      const pdfName = isViewingFamily && selectedMember
        ? `Reporte_Salud_${selectedMember.name?.split(' ')[0]}_${new Date().toISOString().split('T')[0]}.pdf`
        : `Reporte_Salud_${new Date().toISOString().split('T')[0]}.pdf`

      if (Capacitor.isNativePlatform()) {
        const base64Data = pdf.output('datauristring').split(',')[1]
        const result = await Filesystem.writeFile({
          path: pdfName,
          data: base64Data,
          directory: Directory.Cache,
        })
        await Share.share({
          title: 'Reporte de Salud',
          text: 'Tu reporte de salud generado por la plataforma Jóvenes con Salud.',
          url: result.uri,
          dialogTitle: 'Abrir/Compartir Reporte',
        })
      } else {
        const blob = pdf.output('blob')
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = pdfName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
      }
    } catch (e) {
      console.error('Error exportando PDF:', e)
      alert(`Error al generar el PDF:\n${e.message}\n\nStack: ${e.stack?.split('\n').slice(0, 3).join('\n')}`)
    } finally {
      setExporting(false)
    }
  }

  // ── Fetch family members ──────────────────────────
  const fetchFamily = useCallback(async () => {
    try {
      const res = await api.get('/family')
      setFamilyMembers(res.data.members || [])
    } catch (err) {
      console.error('Error fetching family:', err)
    } finally {
      setLoadingFamily(false)
    }
  }, [])

  useEffect(() => { fetchFamily() }, [fetchFamily])

  const handleFamilySave = async (formData, memberId) => {
    if (memberId) {
      await api.put(`/family/${memberId}`, formData)
    } else {
      const res = await api.post('/family', formData)
      setSelectedFamilyId(res.data.member.id)
    }
    fetchFamily()
  }

  const fetchData = useCallback(async () => {
    try {
      let statsRes, recordsRes, streaksRes
      if (selectedFamilyId) {
        [statsRes, recordsRes, streaksRes] = await Promise.all([
          api.get(`/family/${selectedFamilyId}/health/stats`),
          api.get(`/family/${selectedFamilyId}/health`, { params: { limit: 100 } }),
          api.get(`/family/${selectedFamilyId}/health/streaks`),
        ])
      } else {
        [statsRes, recordsRes, streaksRes] = await Promise.all([
          api.get('/health-tracking/stats'),
          api.get('/health-tracking/records', { params: { limit: 100 } }),
          api.get('/health-tracking/streaks'),
        ])
      }
      setStats(statsRes.data)
      setRecords(recordsRes.data.records)
      setStreaks(streaksRes.data)
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoadingData(false)
    }
  }, [selectedFamilyId])

  useEffect(() => { setLoadingData(true); fetchData() }, [fetchData])

  useEffect(() => {
    const handleUpdate = () => {
      fetchData()
    }
    window.addEventListener('health-records-updated', handleUpdate)
    return () => window.removeEventListener('health-records-updated', handleUpdate)
  }, [fetchData])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        type: formData.type,
        value: parseFloat(formData.value),
        value2: formData.type === 'bloodPressure'
          ? parseFloat(formData.value2)
          : formData.type === 'weight' && formData.heightCm
            ? parseFloat(formData.heightCm)
            : undefined,
        notes: formData.notes || undefined,
        recordedAt: formData.recordedAt,
      }
      // ── Persist height in localStorage so it survives across sessions ──────
      if (formData.type === 'weight' && formData.heightCm) {
        const lsKey = isViewingFamily
          ? `bmi_height_family_${selectedFamilyId}`
          : `bmi_height_user_${user?.id}`
        localStorage.setItem(lsKey, formData.heightCm)
      }
      if (editRecord) {
        if (isViewingFamily) {
          // Edit mode — family member record
          await api.put(`/family/${selectedFamilyId}/health/${editRecord.id}`, payload)
        } else {
          // Edit mode — own record
          await api.put(`/health-tracking/records/${editRecord.id}`, payload)
        }
        setEditRecord(null)
      } else {
        if (isViewingFamily) {
          // Create mode — family member record
          await api.post(`/family/${selectedFamilyId}/health`, payload)
        } else {
          // Create mode — own record
          await api.post('/health-tracking/records', payload)
        }
      }
      setShowModal(false)
      setFormData({ type: 'weight', value: '', value2: '', heightCm: '', notes: '', recordedAt: new Date().toISOString().slice(0, 16) })
      fetchData()
    } catch (err) {
      console.error('Error saving:', err)
      alert(err.response?.data?.error || 'Error al guardar el registro. Por favor, verifica los datos e intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  // ── Pre-load saved height for BMI calculation ────────────────────────────────
  // Priority: 1) latest weight record's value2 (from API)
  //           2) localStorage for this user / family member
  const lsHeightKey = isViewingFamily
    ? `bmi_height_family_${selectedFamilyId}`
    : `bmi_height_user_${user?.id}`
  const savedHeight =
    (stats?.latest?.weight?.value2 ? String(stats.latest.weight.value2) : '') ||
    localStorage.getItem(lsHeightKey) ||
    ''

  const openWeightModal = (type) => {
    const hcm = type === 'weight' ? savedHeight : ''
    setFormData({
      type,
      value: '',
      value2: '',
      heightCm: hcm,
      notes: '',
      recordedAt: new Date().toISOString().slice(0, 16)
    })
    setEditRecord(null)
    setShowModal(true)
  }
  const filteredRecords = records.filter(r => {
    if (!filterFrom && !filterTo) return true
    const d = new Date(r.recordedAt)
    if (filterFrom && d < new Date(filterFrom + 'T00:00:00')) return false
    if (filterTo && d > new Date(filterTo + 'T23:59:59')) return false
    return true
  })

  const chartData = [...filteredRecords]
    .filter(r => r.type === activeType)
    .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt))
    .map(r => ({
      date: new Date(r.recordedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
      value: r.value,
      value2: r.value2,
    }))

  const activeTypeInfo = TYPES.find(t => t.key === activeType)

  const formatLatest = (record) => {
    if (!record) return '—'
    if (record.type === 'bloodPressure') return `${record.value}/${record.value2}`
    return record.value
  }

  return (
    <div id="dashboard-content" style={{ padding: '2rem 1.5rem', maxWidth: '1280px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', ...customThemeStyles }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-500))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FaChartLine style={{ color: 'white', fontSize: '1.1rem' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-surface-900)' }}>
              Hola, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ fontSize: '0.85rem', color: dark ? '#ffffff' : 'var(--color-surface-500)' }}>
              Tu panel de seguimiento de salud personalizado
            </p>
          </div>
        </div>

        {/* ── Action buttons header group ─────────────────────── */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          position: 'relative',
          width: isMobile ? '100%' : 'auto',
        }} data-html2canvas-ignore="true">
          {user?.doctorId && (
            <Link
              to="/citas-virtuales"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.6rem 1.25rem', borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                color: 'white', fontSize: '0.85rem', fontWeight: '600',
                cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
                textDecoration: 'none', transition: 'all 0.2s',
                flex: isMobile ? '1 1 calc(50% - 0.375rem)' : '0 1 auto',
                boxSizing: 'border-box',
              }}
            >
              <FaCalendarAlt style={{ color: 'white' }} />
              Citas Virtuales
            </Link>
          )}

          {streaks && (
            <button
              onClick={() => setShowStreakModal(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.6rem 1.25rem', borderRadius: '10px',
                border: 'none',
                background: streaks.daily.current > 0 
                  ? 'linear-gradient(135deg, #f97316, #ef4444)' 
                  : 'linear-gradient(135deg, var(--color-surface-400), var(--color-surface-500))',
                color: 'white', fontSize: '0.85rem', fontWeight: '600',
                cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s',
                flex: isMobile ? '1 1 calc(50% - 0.375rem)' : '0 1 auto',
                boxSizing: 'border-box',
              }}
            >
              <span style={{ fontSize: '1rem', marginRight: '0.1rem' }}>🔥</span>
              Racha {streaks.daily.current > 0 ? `(${streaks.daily.current})` : '(0)'}
            </button>
          )}

          <Link
            to={`/analytics${selectedFamilyId ? `?familyMemberId=${selectedFamilyId}` : ''}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.6rem 1.25rem', borderRadius: '10px',
              border: 'none', background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-800))',
              color: 'white', fontSize: '0.85rem', fontWeight: '600',
              cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
              textDecoration: 'none', transition: 'all 0.2s',
              flex: isMobile ? '1 1 calc(50% - 0.375rem)' : '0 1 auto',
              boxSizing: 'border-box',
            }}
          >
            <FaChartLine style={{ color: 'white' }} />
            Estadísticas Avanzadas
          </Link>

          <div ref={pdfMenuRef} style={{
            flex: isMobile ? '1 1 calc(50% - 0.375rem)' : '0 1 auto',
            boxSizing: 'border-box',
          }}>
            <button
              onClick={() => { if (!exporting) { setPdfMenuOpen(p => !p); setShowCustomPicker(false) } }}
              disabled={exporting}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.6rem 1.25rem', borderRadius: '10px',
                border: '1.5px solid var(--color-surface-200)', background: 'white',
                color: 'var(--color-surface-600)', fontSize: '0.85rem', fontWeight: '600',
                cursor: exporting ? 'not-allowed' : 'pointer', boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <FaFilePdf style={{ color: '#ef4444' }} />
              {exporting ? 'Generando PDF...' : 'Descargar Reporte'}
              <span style={{ fontSize: '0.65rem', marginLeft: '0.1rem', transition: 'transform 0.2s', display: 'inline-block', transform: pdfMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </button>

            {pdfMenuOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 500,
                background: 'var(--color-surface-100)', borderRadius: '14px', minWidth: '240px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.25)', border: '1px solid var(--color-surface-200)',
                overflow: 'hidden',
                animation: 'fadeIn 0.15s ease',
              }}>
                {/* Quick options */}
                <div style={{ padding: '0.6rem 0.5rem', borderBottom: '1px solid var(--color-surface-200)' }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: '700', color: dark ? '#ffffff' : 'var(--color-surface-500)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0.2rem 0.75rem 0.5rem' }}>Rango rápido</p>
                  {[
                    { label: '📅  Último mes', months: 1 },
                    { label: '📅  Últimos 3 meses', months: 3 },
                    { label: '📅  Últimos 6 meses', months: 6 },
                  ].map(({ label, months }) => {
                    const from = new Date()
                    from.setMonth(from.getMonth() - months)
                    return (
                      <button
                        key={months}
                        onClick={() => handleExportPDF({ fromDate: from })}
                        style={{
                          width: '100%', textAlign: 'left', padding: '0.6rem 1rem',
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: '0.875rem', color: 'var(--color-surface-800)', fontWeight: '500',
                          borderRadius: '8px', transition: 'background 0.15s',
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-200)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>

                {/* Custom range toggle */}
                <div style={{ padding: '0.5rem' }}>
                  <button
                    onClick={() => setShowCustomPicker(p => !p)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '0.6rem 1rem',
                      background: showCustomPicker ? 'var(--color-primary-100)' : 'none',
                      border: showCustomPicker ? '1px solid var(--color-primary-300)' : '1px solid transparent',
                      cursor: 'pointer', fontSize: '0.875rem', color: showCustomPicker ? 'var(--color-primary-600)' : 'var(--color-surface-800)',
                      fontWeight: '600', borderRadius: '8px', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}
                  >
                    🗓️  Rango personalizado
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>{showCustomPicker ? '▲' : '▼'}</span>
                  </button>

                  {showCustomPicker && (
                    <div style={{ padding: '0.75rem 0.5rem 0.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: '700', color: dark ? '#ffffff' : 'var(--color-surface-500)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.3rem' }}>Desde</label>
                        <input
                          type="date"
                          value={customFrom}
                          max={customTo || new Date().toISOString().slice(0, 10)}
                          onChange={e => setCustomFrom(e.target.value)}
                          style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1.5px solid var(--color-surface-300)', background: 'var(--color-surface-50)', color: 'var(--color-surface-800)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: '700', color: dark ? '#ffffff' : 'var(--color-surface-500)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.3rem' }}>Hasta</label>
                        <input
                          type="date"
                          value={customTo}
                          min={customFrom}
                          max={new Date().toISOString().slice(0, 10)}
                          onChange={e => setCustomTo(e.target.value)}
                          style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1.5px solid var(--color-surface-300)', background: 'var(--color-surface-50)', color: 'var(--color-surface-800)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (!customFrom || !customTo) return alert('Selecciona ambas fechas.')
                          handleExportPDF({ fromDate: customFrom, toDate: customTo })
                        }}
                        style={{
                          marginTop: '0.25rem', padding: '0.55rem 1rem', borderRadius: '8px',
                          border: 'none', background: 'var(--color-primary-500)', color: 'white',
                          fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        <FaFilePdf size={12} /> Generar PDF
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>



      {/* ── Family Profile Selector Bar ─────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.4rem', marginBottom: '1.25rem',
        background: 'var(--color-surface-100)',
        border: '1px solid var(--color-surface-200)',
        borderRadius: '14px',
        overflowX: 'auto',
      }}>
        {/* Own profile button */}
        <button
          onClick={() => setSelectedFamilyId(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.55rem 1.1rem', borderRadius: '10px', border: 'none',
            background: !isViewingFamily
              ? 'linear-gradient(135deg, var(--color-success), #047857)'
              : 'transparent',
            color: !isViewingFamily ? 'white' : (dark ? '#ffffff' : 'var(--color-surface-500)'),
            fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer',
            transition: 'all 0.2s', whiteSpace: 'nowrap',
            boxShadow: !isViewingFamily ? '0 2px 8px rgba(16,185,129,0.3)' : 'none',
          }}
          onMouseEnter={e => { if (isViewingFamily) e.currentTarget.style.background = 'var(--color-surface-200)' }}
          onMouseLeave={e => { if (isViewingFamily) e.currentTarget.style.background = 'transparent' }}
        >
          <FaChartLine size={12} />
          Tú
        </button>

        {/* Family member buttons */}
        {familyMembers.map(m => (
          <button
            key={m.id}
            onClick={() => setSelectedFamilyId(m.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1.1rem', borderRadius: '10px', border: 'none',
              background: selectedFamilyId === m.id
                ? 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-800))'
                : 'transparent',
              color: selectedFamilyId === m.id ? 'white' : (dark ? '#ffffff' : 'var(--color-surface-500)'),
              fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
              boxShadow: selectedFamilyId === m.id ? '0 2px 8px rgba(135,18,51,0.3)' : 'none',
            }}
            onMouseEnter={e => { if (selectedFamilyId !== m.id) e.currentTarget.style.background = 'var(--color-surface-200)' }}
            onMouseLeave={e => { if (selectedFamilyId !== m.id) e.currentTarget.style.background = 'transparent' }}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: selectedFamilyId === m.id
                ? 'rgba(255,255,255,0.25)'
                : 'linear-gradient(135deg, var(--color-surface-200), var(--color-surface-300))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', fontWeight: '800',
              color: selectedFamilyId === m.id ? 'white' : 'var(--color-surface-600)',
              flexShrink: 0,
            }}>
              {m.name?.charAt(0)?.toUpperCase()}
            </div>
            {m.name?.split(' ')[0]}
          </button>
        ))}

        {/* Add family member button */}
        {familyMembers.length < MAX_FAMILY && (
          <button
            onClick={() => setFamilyModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.55rem 1rem', borderRadius: '10px',
              border: dark ? '2px dashed rgba(255, 255, 255, 0.4)' : '2px dashed var(--color-surface-300)', background: 'transparent',
              color: dark ? '#ffffff' : 'var(--color-surface-400)', fontSize: '0.78rem', fontWeight: '700',
              cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary-500)'; e.currentTarget.style.color = 'var(--color-primary-500)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? 'rgba(255, 255, 255, 0.4)' : 'var(--color-surface-300)'; e.currentTarget.style.color = dark ? '#ffffff' : 'var(--color-surface-400)' }}
          >
            <FaPlus size={10} />
            Agregar
          </button>
        )}
      </div>

      {/* ── Family member banner ─────────────────────────────── */}
      {isViewingFamily && selectedMember && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.85rem 1.25rem', marginBottom: '1.25rem',
          background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-accent-50) 100%)',
          borderRadius: '14px', borderLeft: '4px solid var(--color-primary-500)',
          flexWrap: 'wrap', gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-400))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '0.95rem', fontWeight: '800', flexShrink: 0,
            }}>
              {selectedMember.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-surface-900)' }}>
                  {selectedMember.name}
                </span>
                <span style={{
                  padding: '0.15rem 0.6rem', borderRadius: '20px',
                  background: 'var(--color-primary-500)', color: 'white',
                  fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  <FaUserFriends size={9} style={{ marginRight: '3px', verticalAlign: 'middle' }} />
                  Familiar
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: dark ? '#ffffff' : 'var(--color-surface-500)', marginTop: '0.15rem' }}>
                {RELATIONSHIP_LABELS[selectedMember.relationship] || selectedMember.relationship}
                {' · Viendo datos de salud de este familiar'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedFamilyId(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1rem', borderRadius: '10px',
              border: '1.5px solid var(--color-primary-500)', background: 'var(--color-surface-100)',
              color: 'var(--color-primary-500)', fontSize: '0.82rem', fontWeight: '700',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-500)'; e.currentTarget.style.color = 'white' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface-100)'; e.currentTarget.style.color = 'var(--color-primary-500)' }}
          >
            <FaArrowLeft size={11} />
            Volver a mi perfil
          </button>
        </div>
      )}

      {/* Summary Cards Carousel */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '2rem',
        width: '100%',
      }}>
        {/* Navigation Left Chevron */}
        <button
          onClick={() => setStartIndex(prev => Math.max(0, prev - 1))}
          className="carousel-chevron"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '1.5px solid var(--color-surface-200)',
            background: 'white',
            color: 'var(--color-surface-600)',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s',
            visibility: startIndex > 0 ? 'visible' : 'hidden',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#871233' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--color-surface-600)' }}
        >
          <FaChevronLeft size={16} />
        </button>

        {/* Carousel Grid showing 4 cards */}
        <div 
          className="dashboard-carousel-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            flex: 1,
            minWidth: 0, // prevents grid blowout
          }}
        >
          {(isMobile ? TYPES : TYPES.slice(startIndex, startIndex + 4)).map((t) => {
            const latest = stats?.latest?.[t.key]

            // ── BMI for weight card ──────────────────────
            const heightForBMI = t.key === 'weight'
              ? (latest?.value2 || localStorage.getItem(lsHeightKey))
              : null
            const bmi = t.key === 'weight' && latest?.value && heightForBMI
              ? calcBMI(latest.value, heightForBMI)
              : null
            const bmiCat = getBMICategory(bmi)

            // ── Indicator badge for other metrics ────────
            const glucoseCat = t.key === 'glucose' ? getGlucoseCategory(latest?.value) : null
            const heartRateCat = t.key === 'heartRate' ? getHeartRateCategory(latest?.value) : null
            const bpCat = t.key === 'bloodPressure' ? getBloodPressureCategory(latest?.value, latest?.value2) : null
            const cholesterolCat = t.key === 'cholesterol' ? getCholesterolCategory(latest?.value) : null
            const triglyceridesCat = t.key === 'triglycerides' ? getTriglyceridesCategory(latest?.value) : null

            // The active indicator badge for this card (whichever applies)
            const indicatorCat = bmiCat || glucoseCat || heartRateCat || bpCat || cholesterolCat || triglyceridesCat
            const indicatorLabel = bmiCat
              ? `IMC ${bmi} — ${bmiCat.label}`
              : glucoseCat
                ? glucoseCat.label
                : heartRateCat
                  ? heartRateCat.label
                  : bpCat
                    ? bpCat.label
                    : cholesterolCat
                      ? cholesterolCat.label
                      : triglyceridesCat
                        ? triglyceridesCat.label
                        : null
            const indicatorDescription = indicatorCat?.description || null

            return (
              <div
                key={t.key}
                onClick={() => setActiveType(t.key)}
                className="animate-fade-in-up"
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-xl)',
                  background: 'white',
                  boxShadow: activeType === t.key ? `0 0 0 2px ${t.color}, var(--shadow-card)` : 'var(--shadow-card)',
                  border: '1px solid var(--color-surface-200)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Accent bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                  background: `linear-gradient(90deg, ${t.gradient[0]}, ${t.gradient[1]})`,
                  opacity: activeType === t.key ? 1 : 0,
                  transition: 'opacity 0.3s',
                }} />

                <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: '600', color: dark ? '#ffffff' : 'var(--color-surface-500)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {t.label}
                    </p>
                    <p style={{ fontSize: '1.75rem', fontWeight: '800', color: dark ? '#ffffff' : 'var(--color-surface-900)' }}>
                      {formatLatest(latest)}
                      <span style={{ fontSize: '0.85rem', fontWeight: '500', color: dark ? '#ffffff' : 'var(--color-surface-400)', marginLeft: '0.25rem' }}>
                        {latest ? t.unit : ''}
                      </span>
                    </p>
                    {/* Health indicator badge — shown for all metrics when data exists */}
                    {latest && indicatorCat && indicatorLabel && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                          padding: '0.2rem 0.65rem', borderRadius: '2rem',
                          background: indicatorCat.bg, color: indicatorCat.color,
                          border: `1px solid ${indicatorCat.border}`,
                          fontSize: '0.72rem', fontWeight: '700',
                        }}>
                          <span style={{ fontSize: '0.65rem' }}>{indicatorCat.emoji}</span>
                          {indicatorLabel}
                        </span>
                        {indicatorDescription && (
                          <span style={{ fontSize: '0.68rem', color: dark ? '#ffffff' : 'var(--color-surface-400)', fontStyle: 'italic' }}>
                            {indicatorDescription}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: 'var(--radius-lg)',
                    background: `${t.color}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <t.icon style={{ fontSize: '1.1rem', color: t.color }} />
                  </div>
                </div>
                {latest && (
                  <p style={{ fontSize: '0.75rem', color: dark ? '#ffffff' : 'var(--color-surface-400)', marginTop: '0.5rem' }}>
                    {new Date(latest.recordedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Navigation Right Chevron */}
        <button
          onClick={() => setStartIndex(prev => Math.min(TYPES.length - 4, prev + 1))}
          className="carousel-chevron"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '1.5px solid var(--color-surface-200)',
            background: 'white',
            color: 'var(--color-surface-600)',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s',
            visibility: startIndex < TYPES.length - 4 ? 'visible' : 'hidden',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#871233' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--color-surface-600)' }}
        >
          <FaChevronRight size={16} />
        </button>
      </div>

      {/* Chart section */}
      <div style={{
        padding: '1.5rem',
        borderRadius: 'var(--radius-xl)',
        background: 'white',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--color-surface-200)',
        marginBottom: '2rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-surface-900)' }}>
              Evolución — {activeTypeInfo.label}
            </h2>
            {hasDateFilter ? (
              <p style={{ fontSize: '0.75rem', color: '#0369a1', marginTop: '0.15rem' }}>
                📅 Filtrado: {filterFrom ? new Date(filterFrom + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Inicio'}
                {' — '}
                {filterTo ? new Date(filterTo + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Hoy'}
                {' · '}{chartData.length} registros
              </p>
            ) : (
              <p style={{ fontSize: '0.8rem', color: dark ? '#ffffff' : 'var(--color-surface-400)' }}>
                Últimos {chartData.length} registros
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            {hasDateFilter && (
              <button onClick={clearDateFilter} style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #fecaca',
                background: '#fef2f2', color: '#dc2626', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
              }}>
                <FaTimes size={10} /> Quitar filtro
              </button>
            )}
            <button onClick={() => setShowDateFilter(s => !s)} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1.1rem', borderRadius: '10px',
              border: '1.5px solid var(--color-primary-500)',
              background: showDateFilter ? 'var(--color-primary-500)' : 'white',
              color: showDateFilter ? 'white' : 'var(--color-primary-500)',
              fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: showDateFilter ? '0 4px 12px rgba(135,18,51,0.15)' : 'none',
            }}
              onMouseEnter={e => {
                if (!showDateFilter) {
                  e.currentTarget.style.background = 'var(--color-primary-50)'
                }
              }}
              onMouseLeave={e => {
                if (!showDateFilter) {
                  e.currentTarget.style.background = 'white'
                }
              }}
            >
              <FaFilter size={11} /> Filtrar fechas
            </button>
            <button
              onClick={() => openWeightModal(activeType)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.55rem 1.1rem',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
                color: 'white',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(135,18,51,0.2)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(135,18,51,0.3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(135,18,51,0.2)'
              }}
            >
              <FaPlus size={12} /> Nuevo Registro
            </button>
          </div>
        </div>

        {/* Date filter bar */}
        {showDateFilter && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
            borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0',
            marginBottom: '1rem', flexWrap: 'wrap', animation: 'slideUp 0.2s ease',
          }}>
            <FaCalendarAlt size={13} style={{ color: '#871233', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>Desde:</label>
              <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
                style={{ padding: '0.35rem 0.5rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.8rem', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>Hasta:</label>
              <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
                style={{ padding: '0.35rem 0.5rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.8rem', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            {hasDateFilter && (
              <button onClick={clearDateFilter} style={{
                padding: '0.35rem 0.6rem', borderRadius: '8px', border: '1px solid #fecaca',
                background: 'white', color: '#dc2626', fontSize: '0.73rem', fontWeight: '600', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.25rem',
              }}>
                <FaTimes size={9} /> Limpiar
              </button>
            )}
          </div>
        )}

        {loadingData ? (
          <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        ) : chartData.length > 0 ? (
          <div style={{ width: '100%', minHeight: '280px' }}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id={`gradient-${activeType}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeTypeInfo.color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={activeTypeInfo.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? 'var(--color-surface-200)' : '#e2e8f0'} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: dark ? 'var(--color-surface-600)' : '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: dark ? 'var(--color-surface-600)' : '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    background: dark ? 'var(--color-surface-100)' : 'white',
                    border: dark ? '1px solid var(--color-surface-300)' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-card)',
                    fontSize: '0.85rem',
                    color: dark ? 'var(--color-surface-900)' : 'inherit',
                  }}
                  itemStyle={{
                    color: dark ? 'var(--color-surface-900)' : 'inherit'
                  }}
                  labelStyle={{
                    color: dark ? 'var(--color-surface-800)' : 'inherit'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={activeTypeInfo.color}
                  strokeWidth={2.5}
                  fill={`url(#gradient-${activeType})`}
                  dot={{ fill: activeTypeInfo.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: activeTypeInfo.color }}
                  name={activeTypeInfo.label}
                />
                {activeType === 'bloodPressure' && (
                  <Area
                    type="monotone"
                    dataKey="value2"
                    stroke="#f87171"
                    strokeWidth={2}
                    fill="none"
                    dot={{ fill: '#f87171', strokeWidth: 2, r: 3 }}
                    name="Diastólica"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{
            height: '280px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            color: dark ? '#ffffff' : 'var(--color-surface-400)',
          }}>
            <activeTypeInfo.icon style={{ fontSize: '2.5rem', opacity: 0.3 }} />
            <p style={{ fontSize: '0.95rem' }}>Aún no tienes registros de {activeTypeInfo.label.toLowerCase()}</p>
            <button
              onClick={() => openWeightModal(activeType)}
              style={{
                padding: '0.6rem 1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: `2px dashed ${activeTypeInfo.color}50`,
                background: 'none',
                color: activeTypeInfo.color,
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Agregar primer registro
            </button>
          </div>
        )}
      </div>

      {/* Records per type — last 5 + expand to all */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {TYPES.map(t => {
          const allTypeRecs = records.filter(r => r.type === t.key)
          if (allTypeRecs.length === 0) return null
          const isExpanded = !!expandedTypes[t.key]
          const shown = isExpanded ? allTypeRecs : allTypeRecs.slice(0, 5)
          const hasMore = allTypeRecs.length > 5

          return (
            <div key={t.key} style={{
              borderRadius: 'var(--radius-xl)', background: 'white',
              boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-surface-200)',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.85rem 1.25rem',
                borderBottom: `3px solid ${t.color}`,
                background: `${t.color}08`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <t.icon style={{ color: t.color, fontSize: '1rem' }} />
                  <span style={{ fontWeight: '700', color: 'var(--color-surface-800)', fontSize: '0.95rem' }}>{t.label}</span>
                  <span style={{ fontSize: '0.75rem', color: dark ? '#ffffff' : 'var(--color-surface-400)' }}>({t.unit})</span>
                </div>
                <span style={{
                  padding: '0.15rem 0.65rem', borderRadius: '2rem',
                  background: `${t.color}18`, color: t.color,
                  fontSize: '0.72rem', fontWeight: '700',
                }}>
                  {allTypeRecs.length} registro{allTypeRecs.length !== 1 ? 's' : ''} en total
                </span>
              </div>

              {/* Rows */}
              {shown.map((r, i) => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.7rem 1.25rem',
                  background: i % 2 === 0 ? 'var(--color-table-row-even)' : 'var(--color-table-row-odd)',
                  borderBottom: '1px solid var(--color-surface-200)',
                  transition: 'background 0.15s',
                }}>
                  <div style={{ flex: '0 0 140px' }}>
                    <p style={{ fontSize: '0.82rem', color: dark ? '#ffffff' : 'var(--color-surface-700)', fontWeight: '500' }}>
                      {new Date(r.recordedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: dark ? '#ffffff' : 'var(--color-surface-400)' }}>
                      {new Date(r.recordedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div style={{ flex: '0 0 160px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: '800', color: t.color, fontSize: '1.05rem' }}>
                      {r.type === 'bloodPressure' ? `${r.value}/${r.value2}` : r.value}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: dark ? '#ffffff' : 'var(--color-surface-400)', marginLeft: '0.2rem' }}>{t.unit}</span>
                    {r.source === 'wearable' && (
                      <span className="record-wearable-badge" title="Sincronizado desde dispositivo wearable">
                        ⌚ Wearable
                      </span>
                    )}
                  </div>
                  <p style={{ flex: 1, fontSize: '0.82rem', color: dark ? '#ffffff' : 'var(--color-surface-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.notes || <span style={{ color: dark ? 'rgba(255, 255, 255, 0.4)' : 'var(--color-surface-300)' }}>Sin notas</span>}
                  </p>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <button title="Editar"
                      onClick={() => {
                        setEditRecord(r)
                        setFormData({ type: r.type, value: r.value, value2: r.value2 || '', heightCm: r.type === 'weight' ? (String(r.value2 || '') || savedHeight) : '', notes: r.notes || '', recordedAt: new Date(r.recordedAt).toISOString().slice(0, 16) })
                        setShowModal(true)
                      }}
                      style={{ padding: '0.35rem 0.6rem', borderRadius: '8px', border: dark ? '1.5px solid var(--color-surface-300)' : '1.5px solid var(--color-surface-200)', background: dark ? 'var(--color-surface-200)' : 'white', color: dark ? '#ffffff' : 'var(--color-surface-500)', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = t.color; e.currentTarget.style.color = t.color }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? 'var(--color-surface-300)' : 'var(--color-surface-200)'; e.currentTarget.style.color = dark ? '#ffffff' : 'var(--color-surface-500)' }}
                    >✏️</button>
                    <button title="Eliminar"
                      onClick={() => setRecordToDelete(r)}
                      style={{ padding: '0.35rem 0.6rem', borderRadius: '8px', border: dark ? '1.5px solid #5c0817' : '1.5px solid #fecaca', background: dark ? 'var(--color-surface-200)' : 'white', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = dark ? '#29030a' : '#fef2f2' }}
                      onMouseLeave={e => { e.currentTarget.style.background = dark ? 'var(--color-surface-200)' : 'white' }}
                    >🗑️</button>
                  </div>
                </div>
              ))}

              {/* Expand / collapse footer */}
              {hasMore && (
                <button
                  onClick={() => setExpandedTypes(prev => ({ ...prev, [t.key]: !prev[t.key] }))}
                  style={{
                    width: '100%', padding: '0.65rem 1.25rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    background: isExpanded ? `${t.color}06` : 'white',
                    border: 'none', borderTop: '1px solid var(--color-surface-100)',
                    color: t.color, fontSize: '0.82rem', fontWeight: '600',
                    cursor: 'pointer', transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${t.color}10` }}
                  onMouseLeave={e => { e.currentTarget.style.background = isExpanded ? `${t.color}06` : 'white' }}
                >
                  <span style={{ display: 'inline-block', transition: 'transform 0.25s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', fontSize: '0.75rem' }}>▼</span>
                  {isExpanded
                    ? 'Mostrar solo los últimos 5'
                    : `Ver todos los registros (${allTypeRecs.length - 5} más)`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <MedicationsPanel selectedFamilyId={selectedFamilyId} />
      <SupplementsPanel selectedFamilyId={selectedFamilyId} />

      {!selectedFamilyId && streaks && (
        <StreakBadges
          maxStreak={streaks.daily?.max || 0}
          currentUser={user}
          onThemeUpdated={(newColor) => setUser(prev => ({ ...prev, themeColor: newColor }))}
        />
      )}

      {/* Add Record Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div className="animate-fade-in-up" style={{
            width: '100%', maxWidth: '440px',
            padding: '2rem',
            borderRadius: 'var(--radius-2xl)',
            background: 'white',
            boxShadow: 'var(--shadow-elevated)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-surface-900)' }}>
                {editRecord ? 'Editar Registro' : 'Nuevo Registro de Salud'}
              </h3>
              <button
                onClick={() => { setShowModal(false); setEditRecord(null); setFormData({ type: 'weight', value: '', value2: '', heightCm: '', notes: '', recordedAt: new Date().toISOString().slice(0, 16) }) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-surface-400)', fontSize: '1.25rem' }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Type selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.5rem' }}>
                  Tipo de medición
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {TYPES.map(t => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        const hcm = t.key === 'weight' ? (formData.heightCm || savedHeight) : formData.heightCm
                        setFormData(f => ({ ...f, type: t.key, heightCm: hcm }))
                      }}
                      style={{
                        padding: '0.6rem',
                        borderRadius: 'var(--radius-lg)',
                        border: `2px solid ${formData.type === t.key ? t.color : 'var(--color-surface-200)'}`,
                        background: formData.type === t.key ? `${t.color}10` : 'white',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        fontSize: '0.8rem', fontWeight: '600',
                        color: formData.type === t.key ? t.color : 'var(--color-surface-500)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <t.icon size={14} /> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
                    {formData.type === 'bloodPressure' ? 'Sistólica' : 'Valor'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder={formData.type === 'bloodPressure' ? '120' : 'Ej: 72.5'}
                    value={formData.value}
                    onChange={e => setFormData(f => ({ ...f, value: e.target.value }))}
                    style={{
                      width: '100%', padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-lg)', border: '2px solid var(--color-surface-200)',
                      fontSize: '0.9rem', outline: 'none',
                    }}
                  />
                </div>
                {formData.type === 'bloodPressure' && (
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
                      Diastólica
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="80"
                      value={formData.value2}
                      onChange={e => setFormData(f => ({ ...f, value2: e.target.value }))}
                      style={{
                        width: '100%', padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-lg)', border: '2px solid var(--color-surface-200)',
                        fontSize: '0.9rem', outline: 'none',
                      }}
                    />
                  </div>
                )}
                {formData.type === 'weight' && (
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
                      Altura (cm)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="50"
                      max="250"
                      placeholder="Ej: 170"
                      value={formData.heightCm}
                      onChange={e => setFormData(f => ({ ...f, heightCm: e.target.value }))}
                      style={{
                        width: '100%', padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-lg)', border: '2px solid var(--color-surface-200)',
                        fontSize: '0.9rem', outline: 'none',
                      }}
                    />
                    {savedHeight && formData.heightCm === savedHeight && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--color-surface-400)', marginTop: '0.25rem' }}>
                        Guardada: {savedHeight} cm — modifica solo si cambió
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
                  Fecha y hora
                </label>
                <input
                  type="datetime-local"
                  value={formData.recordedAt}
                  onChange={e => setFormData(f => ({ ...f, recordedAt: e.target.value }))}
                  style={{
                    width: '100%', padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-lg)', border: '2px solid var(--color-surface-200)',
                    fontSize: '0.9rem', outline: 'none',
                  }}
                />
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-surface-700)', marginBottom: '0.4rem' }}>
                  Notas (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Después de comer, en ayunas..."
                  value={formData.notes}
                  onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                  style={{
                    width: '100%', padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-lg)', border: '2px solid var(--color-surface-200)',
                    fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  marginTop: '0.25rem',
                  padding: '0.875rem',
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                  background: saving ? 'var(--color-surface-300)' : 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(135,18,51,0.2)',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
              >
                {saving ? (
                  <>
                    <div className="spinner" style={{ width: '18px', height: '18px' }} />
                    Guardando...
                  </>
                ) : (
                  'Guardar Registro'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Streak Modal ────────────────────────────────────── */}
      {showStreakModal && streaks && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div className="animate-fade-in-up" style={{
            width: '100%', maxWidth: '600px',
            borderRadius: 'var(--radius-2xl)',
            background: dark ? 'var(--color-surface-100)' : 'white',
            border: `1px solid ${dark ? 'var(--color-surface-300)' : '#e2e8f0'}`,
            boxShadow: 'var(--shadow-elevated)',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: `1px solid ${dark ? 'var(--color-surface-300)' : '#f1f5f9'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: dark ? 'rgba(0, 0, 0, 0.2)' : '#fafafa',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: streaks.daily.current > 0 ? 'linear-gradient(135deg, #f97316, #ef4444)' : (dark ? 'var(--color-surface-200)' : '#e2e8f0'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: streaks.daily.current > 0 ? '0 0 10px rgba(249,115,22,0.35)' : 'none',
                }}>
                  <span style={{ fontSize: '1rem' }}>🔥</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: dark ? '#ffffff' : 'var(--color-surface-900)' }}>
                    Rachas de Salud
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: dark ? '#9ea4b0' : 'var(--color-surface-500)', margin: 0 }}>
                    Tu historial de consistencia en registros
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStreakModal(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: dark ? 'rgba(255,255,255,0.6)' : 'var(--color-surface-400)',
                  fontSize: '1.25rem', padding: '0.25rem'
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Daily Streak Status */}
              <div style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-xl)',
                background: streaks.daily.current > 0 ? 'rgba(249, 115, 22, 0.08)' : (dark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0,0,0,0.02)'),
                border: streaks.daily.current > 0 ? '1px solid rgba(249, 115, 22, 0.2)' : `1px solid ${dark ? 'var(--color-surface-300)' : '#e2e8f0'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: dark ? '#ffffff' : 'var(--color-surface-900)' }}>
                    {streaks.daily.current > 0 
                      ? `¡Tienes una Racha Activa de ${streaks.daily.current} ${streaks.daily.current === 1 ? 'día' : 'días'}!` 
                      : '¡Comienza tu racha de registros hoy!'}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: dark ? '#9ea4b0' : 'var(--color-surface-500)', marginTop: '0.2rem', margin: 0 }}>
                    {streaks.daily.current > 0 
                      ? 'Mantén encendido el fuego registrando tus datos diariamente.' 
                      : 'Registra cualquier medición hoy para iniciar tu racha.'}
                  </p>
                </div>

                {/* Week Bubbles Calendar */}
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((dayName, idx) => {
                    const isActive = streaks.currentWeekDays[idx];
                    return (
                      <div 
                        key={idx}
                        title={isActive ? `Registro completado este ${['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][idx]}` : `Sin registros este ${['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][idx]}`}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          background: isActive 
                            ? 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-800))'
                            : (dark ? 'var(--color-surface-300)' : '#f1f5f9'),
                          color: isActive ? 'white' : (dark ? 'rgba(255, 255, 255, 0.4)' : 'var(--color-surface-400)'),
                          border: isActive 
                            ? 'none' 
                            : `1.5px solid ${dark ? 'var(--color-surface-400)' : '#e2e8f0'}`,
                          boxShadow: isActive ? '0 2px 6px rgba(135,18,51,0.3)' : 'none',
                        }}
                      >
                        {dayName}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Statistics Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
              }}>
                {/* Daily Streak Card */}
                <div style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-xl)',
                  background: dark ? 'var(--color-surface-200)' : '#fafafa',
                  border: `1px solid ${dark ? 'var(--color-surface-300)' : '#e2e8f0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}>
                  <span style={{ fontSize: '2rem' }}>📅</span>
                  <div>
                    <h4 style={{ fontSize: '0.72rem', fontWeight: '800', color: dark ? '#9ea4b0' : 'var(--color-surface-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Racha Diaria
                    </h4>
                    <p style={{ fontSize: '1.35rem', fontWeight: '800', color: dark ? '#ffffff' : 'var(--color-surface-900)', margin: '0.1rem 0 0.15rem' }}>
                      {streaks.daily.current} {streaks.daily.current === 1 ? 'Día' : 'Días'}
                    </p>
                    <p style={{ fontSize: '0.68rem', color: dark ? '#7e7a8c' : 'var(--color-surface-400)', margin: 0 }}>
                      Máximo histórico: {streaks.daily.max}
                    </p>
                  </div>
                </div>

                {/* Weekly Streak Card */}
                <div style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-xl)',
                  background: dark ? 'var(--color-surface-200)' : '#fafafa',
                  border: `1px solid ${dark ? 'var(--color-surface-300)' : '#e2e8f0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}>
                  <span style={{ fontSize: '2rem' }}>🗓️</span>
                  <div>
                    <h4 style={{ fontSize: '0.72rem', fontWeight: '800', color: dark ? '#9ea4b0' : 'var(--color-surface-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Racha Semanal
                    </h4>
                    <p style={{ fontSize: '1.35rem', fontWeight: '800', color: dark ? '#ffffff' : 'var(--color-surface-900)', margin: '0.1rem 0 0.15rem' }}>
                      {streaks.weekly.current} {streaks.weekly.current === 1 ? 'Semana' : 'Semanas'}
                    </p>
                    <p style={{ fontSize: '0.68rem', color: dark ? '#7e7a8c' : 'var(--color-surface-400)', margin: 0 }}>
                      Máximo histórico: {streaks.weekly.max}
                    </p>
                  </div>
                </div>

                {/* Monthly Streak Card */}
                <div style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-xl)',
                  background: dark ? 'var(--color-surface-200)' : '#fafafa',
                  border: `1px solid ${dark ? 'var(--color-surface-300)' : '#e2e8f0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}>
                  <span style={{ fontSize: '2rem' }}>✨</span>
                  <div>
                    <h4 style={{ fontSize: '0.72rem', fontWeight: '800', color: dark ? '#9ea4b0' : 'var(--color-surface-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Racha Mensual
                    </h4>
                    <p style={{ fontSize: '1.35rem', fontWeight: '800', color: dark ? '#ffffff' : 'var(--color-surface-900)', margin: '0.1rem 0 0.15rem' }}>
                      {streaks.monthly.current} {streaks.monthly.current === 1 ? 'Mes' : 'Meses'}
                    </p>
                    <p style={{ fontSize: '0.68rem', color: dark ? '#7e7a8c' : 'var(--color-surface-400)', margin: 0 }}>
                      Máximo histórico: {streaks.monthly.max}
                    </p>
                  </div>
                </div>

                {/* Yearly Streak Card */}
                <div style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-xl)',
                  background: dark ? 'var(--color-surface-200)' : '#fafafa',
                  border: `1px solid ${dark ? 'var(--color-surface-300)' : '#e2e8f0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}>
                  <span style={{ fontSize: '2rem' }}>🏆</span>
                  <div>
                    <h4 style={{ fontSize: '0.72rem', fontWeight: '800', color: dark ? '#9ea4b0' : 'var(--color-surface-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Racha Anual
                    </h4>
                    <p style={{ fontSize: '1.35rem', fontWeight: '800', color: dark ? '#ffffff' : 'var(--color-surface-900)', margin: '0.1rem 0 0.15rem' }}>
                      {streaks.yearly.current} {streaks.yearly.current === 1 ? 'Año' : 'Años'}
                    </p>
                    <p style={{ fontSize: '0.68rem', color: dark ? '#7e7a8c' : 'var(--color-surface-400)', margin: 0 }}>
                      Máximo histórico: {streaks.yearly.max}
                    </p>
                  </div>
                </div>
              </div>

              {/* Motivational message */}
              <div style={{
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-xl)',
                background: dark ? 'rgba(224, 59, 96, 0.12)' : 'var(--color-primary-50)',
                borderLeft: '4px solid var(--color-primary-500)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <span style={{ fontSize: '1.3rem' }}>🎯</span>
                <p style={{ fontSize: '0.82rem', color: dark ? '#ffffff' : 'var(--color-primary-900)', fontWeight: '600', margin: 0, lineHeight: '1.4' }}>
                  {streaks.daily.current >= 7 
                    ? '¡Nivel Leyenda! Estás demostrando una constancia increíble con tu salud. ¡Sigue así!'
                    : streaks.daily.current >= 3
                      ? '¡Excelente ritmo! Estás creando el hábito perfecto de monitorear tu salud.'
                      : streaks.daily.current > 0
                        ? '¡Buen comienzo! Registra tu salud mañana también para mantener el fuego activo.'
                        : 'El primer paso es registrar una medición hoy. ¡Tu salud te lo agradecerá!'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Family Member Modal ─────────────────────────── */}
      <AddFamilyMemberModal
        isOpen={familyModalOpen}
        onClose={() => setFamilyModalOpen(false)}
        onSave={handleFamilySave}
        member={null}
      />

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          animation: 'fadeIn 0.2s',
        }}>
          <div style={{
            background: dark ? 'var(--color-surface-100)' : 'white',
            width: '100%', maxWidth: '400px',
            padding: '1.5rem', borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            border: dark ? '1px solid var(--color-surface-300)' : '1px solid var(--color-surface-200)',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>🗑️</span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-surface-900)', marginBottom: '0.5rem' }}>
              ¿Eliminar registro?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-surface-500)', marginBottom: '1.5rem' }}>
              Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este registro de salud?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setRecordToDelete(null)}
                style={{
                  padding: '0.6rem 1.25rem', borderRadius: '10px',
                  border: '1.5px solid var(--color-surface-200)', background: 'none',
                  color: 'var(--color-surface-600)', fontSize: '0.85rem', fontWeight: '600',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const r = recordToDelete
                  setRecordToDelete(null)
                  try {
                    if (isViewingFamily) {
                      await api.delete(`/family/${selectedFamilyId}/health/${r.id}`)
                    } else {
                      await api.delete(`/health-tracking/records/${r.id}`)
                    }
                    fetchData()
                  } catch (err) {
                    console.error('Error al eliminar:', err)
                    alert('Error al eliminar el registro')
                  }
                }}
                style={{
                  padding: '0.6rem 1.25rem', borderRadius: '10px',
                  border: 'none', background: '#ef4444',
                  color: 'white', fontSize: '0.85rem', fontWeight: '600',
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


