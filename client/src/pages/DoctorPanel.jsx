import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api, { getApiBaseUrl } from '../services/api'

const API_BASE = getApiBaseUrl()
import AdvancedAnalytics from './AdvancedAnalytics'
import {
  FaHeartbeat, FaUsers, FaChartLine, FaArrowLeft, FaTimes, FaBell,
  FaCapsules, FaStethoscope, FaEnvelope, FaExclamationTriangle,
  FaWeight, FaTint, FaRunning, FaVial, FaFlask, FaCheckCircle,
  FaFilePrescription, FaUtensils, FaUserFriends, FaChevronRight,
  FaTrash, FaCalendarAlt, FaVideo, FaLink, FaCopy, FaPlus, FaTrashAlt,
  FaCog, FaClipboardCheck
} from 'react-icons/fa'
import { HiMenu } from 'react-icons/hi'
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip
} from 'recharts'
import {
  calcBMI, getBMICategory, getGlucoseCategory, getHeartRateCategory,
  getBloodPressureCategory, getCholesterolCategory, getTriglyceridesCategory
} from '../utils/bmiUtils'

const CARD_RADIUS = '16px'

const METRIC_CONFIGS = {
  weight: { label: 'Peso', icon: FaWeight, unit: 'kg', color: 'var(--color-metric-weight)', gradient: ['var(--color-metric-weight-grad-0)', 'var(--color-metric-weight-grad-1)'] },
  glucose: { label: 'Glucosa', icon: FaTint, unit: 'mg/dL', color: 'var(--color-metric-glucose)', gradient: ['var(--color-metric-glucose-grad-0)', 'var(--color-metric-glucose-grad-1)'] },
  bloodPressure: { label: 'Presión Arterial', icon: FaHeartbeat, unit: 'mmHg', color: 'var(--color-metric-bloodPressure)', gradient: ['var(--color-metric-bloodPressure-grad-0)', 'var(--color-metric-bloodPressure-grad-1)'] },
  heartRate: { label: 'Frec. Cardíaca', icon: FaRunning, unit: 'bpm', color: 'var(--color-metric-heartRate)', gradient: ['var(--color-metric-heartRate-grad-0)', 'var(--color-metric-heartRate-grad-1)'] },
  cholesterol: { label: 'Colesterol', icon: FaVial, unit: 'mg/dL', color: 'var(--color-metric-cholesterol)', gradient: ['var(--color-metric-cholesterol-grad-0)', 'var(--color-metric-cholesterol-grad-1)'] },
  triglycerides: { label: 'Triglicéridos', icon: FaFlask, unit: 'mg/dL', color: 'var(--color-metric-triglycerides)', gradient: ['var(--color-metric-triglycerides-grad-0)', 'var(--color-metric-triglycerides-grad-1)'] },
}

const cardStyle = (dark) => ({
  background: dark ? '#141319' : '#fff',
  borderRadius: CARD_RADIUS,
  border: `1px solid ${dark ? '#1e1c25' : '#e8ddd0'}`,
  boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.55)' : '0 1px 4px rgba(0,0,0,0.04)',
})

const formatTimeTo12h = (timeStr) => {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length < 2) return timeStr
  const hours = parseInt(parts[0], 10)
  const minutes = parts[1]
  const ampm = hours >= 12 ? 'p.m.' : 'a.m.'
  const displayHours = hours % 12 || 12
  const formattedHours = String(displayHours).padStart(2, '0')
  return `${formattedHours}:${minutes} ${ampm}`
}

export default function DoctorPanel() {
  const { user, logout } = useAuth()
  const { dark } = useTheme()
  const [activeTab, setActiveTab] = useState('patients') // 'patients', 'alerts', or 'appointments'
  const [alertsSubTab, setAlertsSubTab] = useState('all') // 'all', 'critical', 'warning'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Dashboard & List State
  const [stats, setStats] = useState({ patients: 0, records: 0, recordsLast7Days: 0 })
  const [patients, setPatients] = useState([])
  const [alerts, setAlerts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Detailed Patient view
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [patientDetail, setPatientDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [activePatientTab, setActivePatientTab] = useState('main') // 'main' or family member ID
  const [chartMetric, setChartMetric] = useState('glucose')

  // Appointments & Schedule States
  const [doctorAppointments, setDoctorAppointments] = useState([])
  const [apptStats, setApptStats] = useState({ pending: 0, acceptedToday: 0, completed: 0 })
  const [doctorSchedule, setDoctorSchedule] = useState([])
  const [appointmentDuration, setAppointmentDuration] = useState(30)
  const [maxDailyAppointments, setMaxDailyAppointments] = useState('')
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [selectedAppt, setSelectedAppt] = useState(null)
  const [copiedApptId, setCopiedApptId] = useState(null)

  // Modal Form States
  const [meetLink, setMeetLink] = useState('')
  const [meetCode, setMeetCode] = useState('')
  const [acceptNotes, setAcceptNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [medications, setMedications] = useState([{ name: '', dose: '', frequency: '', duration: '', route: 'Oral', instructions: '' }])
  const [generalInstructions, setGeneralInstructions] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [configSuccess, setConfigSuccess] = useState('')

  // Load summary statistics, patient list and alerts list
  const loadDashboardData = useCallback(async () => {
    try {
      const [resStats, resPatients, resAlerts] = await Promise.all([
        api.get('/doctor/stats'),
        api.get('/doctor/patients'),
        api.get('/doctor/alerts')
      ])
      setStats(resStats.data)
      setPatients(resPatients.data.patients)
      setAlerts(resAlerts.data.alerts)
    } catch (err) {
      console.error('Error loading doctor dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch appointments and schedules
  const fetchAppointmentsAndSchedule = useCallback(async () => {
    try {
      const [resAppts, resApptStats, resSchedule] = await Promise.all([
        api.get('/appointments/doctor'),
        api.get('/appointments/doctor/stats'),
        api.get('/appointments/doctor/schedule')
      ])
      setDoctorAppointments(resAppts.data.appointments)
      setApptStats(resApptStats.data)
      // Group schedule objects by day of week or keep raw list
      setDoctorSchedule(resSchedule.data.schedules || [])
    } catch (err) {
      console.error('Error loading appointments and schedules:', err)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
    if (user?.role === 'doctor') {
      fetchAppointmentsAndSchedule()
      // Get doctor config
      api.get('/auth/me').then(res => {
        setAppointmentDuration(res.data.user.appointmentDuration || 30)
        setMaxDailyAppointments(res.data.user.maxDailyAppointments || '')
      }).catch(err => console.error(err))
    }
    
    const interval = setInterval(() => {
      loadDashboardData()
      if (user?.role === 'doctor') {
        fetchAppointmentsAndSchedule()
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [loadDashboardData, fetchAppointmentsAndSchedule, user])

  // Fetch individual patient records details
  const viewPatientDetails = async (patientId) => {
    setSelectedPatientId(patientId)
    setLoadingDetail(true)
    setActivePatientTab('main')
    try {
      const res = await api.get(`/doctor/patients/${patientId}/records`)
      setPatientDetail(res.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cargar registros del paciente')
      setSelectedPatientId(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  const dismissAlert = async (alertId, e) => {
    if (e) e.stopPropagation()
    try {
      await api.put(`/doctor/alerts/${alertId}/dismiss`)
      // Refresh alerts list
      const resAlerts = await api.get('/doctor/alerts')
      setAlerts(resAlerts.data.alerts)
    } catch (err) {
      alert('Error al descartar la alerta')
    }
  }

  // Get active alerts count (pending status)
  const pendingAlerts = alerts.filter(a => a.status === 'pending')
  const pendingCount = pendingAlerts.length

  // Helper to calculate age from date
  const getAge = (birthDateString) => {
    if (!birthDateString) return ''
    const today = new Date()
    const birthDate = new Date(birthDateString)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Check if a patient has any pending alerts
  const getPatientAlertBadge = (patientId) => {
    const patientPending = pendingAlerts.filter(a => a.userId === patientId)
    if (patientPending.length === 0) {
      return (
        <span style={{
          padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700',
          background: '#10b98115', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
        }}>
          <FaCheckCircle size={10} /> Normal
        </span>
      )
    }
    
    const hasCritical = patientPending.some(a => a.severity === 'critical')
    return (
      <span style={{
        padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700',
        background: hasCritical ? '#ef444415' : '#f59e0b15',
        color: hasCritical ? '#ef4444' : '#f59e0b',
        display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
      }}>
        <FaExclamationTriangle size={10} /> {hasCritical ? 'Crítico' : 'Alerta'} ({patientPending.length})
      </span>
    )
  }

  // Filter patients by search text
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filter alerts by sub tab
  const filteredAlerts = alerts.filter(a => {
    if (alertsSubTab === 'critical') return a.severity === 'critical'
    if (alertsSubTab === 'warning') return a.severity === 'warning'
    return true
  })

  // Format dates nicely
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin registros'
    const d = new Date(dateString)
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  // Helper to extract last health record metrics for detailed tab
  const getLatestMetrics = (recordsList) => {
    const latest = {}
    const types = ['weight', 'glucose', 'bloodPressure', 'heartRate', 'cholesterol', 'triglycerides']
    
    // Sort records descending to get the newest first
    const sorted = [...recordsList].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
    
    for (const t of types) {
      latest[t] = sorted.find(r => r.type === t) || null
    }
    return latest
  }

  // Render Metric Card in Detail Panel
  const renderMetricDetailCard = (type, record) => {
    const cfg = METRIC_CONFIGS[type]
    if (!cfg) return null

    let classification = null
    let valStr = 'N/A'
    let unit = cfg.unit
    let dateStr = ''

    if (record) {
      valStr = record.value
      dateStr = new Date(record.recordedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
      
      if (type === 'glucose') {
        classification = getGlucoseCategory(record.value)
      } else if (type === 'heartRate') {
        classification = getHeartRateCategory(record.value)
      } else if (type === 'bloodPressure' && record.value2 != null) {
        valStr = `${record.value}/${record.value2}`
        classification = getBloodPressureCategory(record.value, record.value2)
      } else if (type === 'cholesterol') {
        classification = getCholesterolCategory(record.value)
      } else if (type === 'triglycerides') {
        classification = getTriglyceridesCategory(record.value)
      } else if (type === 'weight' && record.value2 != null) {
        // height in value2
        const bmi = calcBMI(record.value, record.value2)
        valStr = `${record.value} kg`
        classification = getBMICategory(bmi)
        if (classification) {
          classification = { ...classification, label: `IMC: ${bmi} (${classification.label})` }
        }
      }
    }

    return (
      <div 
        onClick={() => setChartMetric(type)}
        style={{
          ...cardStyle(dark),
          padding: '1rem',
          cursor: 'pointer',
          border: chartMetric === type ? `2px solid ${dark ? '#0284c7' : '#0369a1'}` : `1px solid ${dark ? '#1e1c25' : '#e8ddd0'}`,
          background: chartMetric === type 
            ? (dark ? 'rgba(2, 132, 199, 0.08)' : '#f0f9ff')
            : (dark ? '#141319' : '#fff'),
          transition: 'all 0.15s ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '120px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: '800', color: dark ? '#7e7a8c' : '#a89580', textTransform: 'uppercase' }}>
            {cfg.label}
          </span>
          <cfg.icon style={{ color: cfg.color, fontSize: '1.1rem' }} />
        </div>
        
        <div style={{ margin: '0.4rem 0' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715' }}>
            {valStr}
          </span>
          {record && type !== 'weight' && (
            <span style={{ fontSize: '0.75rem', color: dark ? '#7e7a8c' : '#a89580', marginLeft: '0.25rem' }}>
              {unit}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
          {classification ? (
            <span style={{
              fontSize: '0.62rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px',
              color: classification.color, background: classification.bg, border: `1px solid ${classification.border}`
            }}>
              {classification.label}
            </span>
          ) : (
            <span style={{ fontSize: '0.65rem', color: dark ? '#7e7a8c' : '#a89580', fontStyle: 'italic' }}>
              Sin datos
            </span>
          )}
          {dateStr && (
            <span style={{ fontSize: '0.65rem', color: dark ? '#7e7a8c' : '#a89580', fontWeight: '600' }}>
              {dateStr}
            </span>
          )}
        </div>
      </div>
    )
  }

  // ── Appointment Action Handlers ──
  const handleSaveConfig = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    setConfigSuccess('')
    try {
      await api.put('/appointments/doctor/config', {
        appointmentDuration: Number(appointmentDuration),
        maxDailyAppointments: maxDailyAppointments === '' ? null : Number(maxDailyAppointments)
      })
      await api.put('/appointments/doctor/schedule', {
        schedules: doctorSchedule
      })
      setConfigSuccess('Configuración y horarios guardados correctamente.')
      await fetchAppointmentsAndSchedule()
      setTimeout(() => setConfigSuccess(''), 4000)
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar la configuración.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddBlock = (dayIdx) => {
    const newBlock = {
      dayOfWeek: dayIdx,
      startTime: '09:00',
      endTime: '17:00',
      isActive: true
    }
    setDoctorSchedule(prev => [...prev, newBlock])
  }

  const handleRemoveBlock = (indexToRemove) => {
    setDoctorSchedule(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleBlockChange = (index, field, value) => {
    setDoctorSchedule(prev => prev.map((s, idx) => {
      if (idx === index) {
        return { ...s, [field]: value }
      }
      return s
    }))
  }

  const handleAcceptSubmit = async (e) => {
    e.preventDefault()
    if (!meetLink || !meetCode) return alert('Debes proporcionar el enlace y código de Google Meet.')
    setActionLoading(true)
    try {
      await api.put(`/appointments/${selectedAppt.id}/accept`, { meetLink, meetCode, notes: acceptNotes })
      setShowAcceptModal(false)
      setMeetLink('')
      setMeetCode('')
      setAcceptNotes('')
      setSelectedAppt(null)
      await fetchAppointmentsAndSchedule()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al confirmar la cita.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectSubmit = async (e) => {
    e.preventDefault()
    if (!rejectionReason) return alert('Debes indicar un motivo de rechazo.')
    setActionLoading(true)
    try {
      await api.put(`/appointments/${selectedAppt.id}/reject`, { rejectionReason })
      setShowRejectModal(false)
      setRejectionReason('')
      setSelectedAppt(null)
      await fetchAppointmentsAndSchedule()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al rechazar la cita.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCompleteAppointment = async (apptId) => {
    if (!window.confirm('¿Estás seguro de que deseas marcar esta cita como completada?')) return
    try {
      await api.put(`/appointments/${apptId}/complete`)
      await fetchAppointmentsAndSchedule()
    } catch (err) {
      alert('Error al marcar la cita como completada.')
    }
  }

  const handleMedicationChange = (index, field, value) => {
    setMedications(prev => prev.map((med, idx) => {
      if (idx === index) return { ...med, [field]: value }
      return med
    }))
  }

  const handleAddMedication = () => {
    setMedications(prev => [...prev, { name: '', dose: '', frequency: '', duration: '', route: 'Oral', instructions: '' }])
  }

  const handleRemoveMedication = (index) => {
    if (medications.length === 1) return
    setMedications(prev => prev.filter((_, idx) => idx !== index))
  }

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault()
    if (!diagnosis) return alert('Debes ingresar el diagnóstico.')
    
    // Validate medications list
    const invalidMeds = medications.some(m => !m.name || !m.dose || !m.frequency || !m.duration)
    if (invalidMeds) return alert('Todos los campos de los medicamentos agregados son obligatorios.')

    setActionLoading(true)
    try {
      await api.post(`/appointments/${selectedAppt.id}/prescription`, {
        diagnosis,
        medications,
        generalInstructions,
        validUntil: validUntil || undefined
      })
      setShowPrescriptionModal(false)
      setDiagnosis('')
      setMedications([{ name: '', dose: '', frequency: '', duration: '', route: 'Oral', instructions: '' }])
      setGeneralInstructions('')
      setValidUntil('')
      setSelectedAppt(null)
      await fetchAppointmentsAndSchedule()
      alert('¡Receta médica emitida y registrada con éxito!')
    } catch (err) {
      alert(err.response?.data?.error || 'Error al emitir la receta médica.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code)
    setCopiedApptId(id)
    setTimeout(() => setCopiedApptId(null), 2000)
  }

  return (
    <div className="doctor-layout" style={{ display: 'flex', minHeight: '100vh', background: dark ? '#0c0b0f' : '#f1ede6', fontFamily: 'var(--font-sans)' }}>
      {/* Sidebar overlay backdrop for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
      
      {/* ── Sidebar ─────────────────────── */}
      <aside 
        className={`doctor-sidebar ${sidebarOpen ? 'open' : ''}`}
        style={{
          width: 240,
          background: '#111827', // Dark medical panel sidebar
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          zIndex: 50,
        }}>
        {/* Brand Header */}
        <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FaStethoscope style={{ color: '#38bdf8', fontSize: '1.5rem' }} />
            <div>
              <div style={{ color: '#fff', fontWeight: '800', fontSize: '1.05rem', letterSpacing: '-0.01em' }}>Panel Médico</div>
              <div style={{ color: '#38bdf8', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase' }}>Jóvenes con Salud</div>
            </div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <button
            onClick={() => { setSelectedPatientId(null); setActiveTab('patients'); setSidebarOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.65rem',
              padding: '0.7rem 0.875rem', borderRadius: '10px',
              border: 'none', cursor: 'pointer', width: '100%',
              textAlign: 'left', fontSize: '0.88rem', fontWeight: '600',
              background: !selectedPatientId && activeTab === 'patients' ? '#0369a1' : 'transparent',
              color: !selectedPatientId && activeTab === 'patients' ? '#fff' : 'rgba(255,255,255,0.6)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { if (selectedPatientId || activeTab !== 'patients') e.currentTarget.style.background = 'rgba(3,105,161,0.15)' }}
            onMouseLeave={e => { if (selectedPatientId || activeTab !== 'patients') e.currentTarget.style.background = 'transparent' }}
          >
            <FaUsers size={15} />
            Mis Pacientes
          </button>

          <button
            onClick={() => { setSelectedPatientId(null); setActiveTab('alerts'); setSidebarOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.7rem 0.875rem', borderRadius: '10px',
              border: 'none', cursor: 'pointer', width: '100%',
              fontSize: '0.88rem', fontWeight: '600',
              background: !selectedPatientId && activeTab === 'alerts' ? '#0369a1' : 'transparent',
              color: !selectedPatientId && activeTab === 'alerts' ? '#fff' : 'rgba(255,255,255,0.6)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { if (selectedPatientId || activeTab !== 'alerts') e.currentTarget.style.background = 'rgba(3,105,161,0.15)' }}
            onMouseLeave={e => { if (selectedPatientId || activeTab !== 'alerts') e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <FaBell size={14} />
              Alertas de Salud
            </span>
            {pendingCount > 0 && (
              <span style={{
                background: '#ef4444', color: 'white', fontSize: '0.68rem', fontWeight: '800',
                padding: '1px 6px', borderRadius: '10px'
              }}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setSelectedPatientId(null); setActiveTab('appointments'); setSidebarOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.7rem 0.875rem', borderRadius: '10px',
              border: 'none', cursor: 'pointer', width: '100%',
              fontSize: '0.88rem', fontWeight: '600',
              background: !selectedPatientId && activeTab === 'appointments' ? '#0369a1' : 'transparent',
              color: !selectedPatientId && activeTab === 'appointments' ? '#fff' : 'rgba(255,255,255,0.6)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { if (selectedPatientId || activeTab !== 'appointments') e.currentTarget.style.background = 'rgba(3,105,161,0.15)' }}
            onMouseLeave={e => { if (selectedPatientId || activeTab !== 'appointments') e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <FaCalendarAlt size={14} />
              Citas Virtuales
            </span>
            {apptStats.pending > 0 && (
              <span style={{
                background: '#e11d48', color: 'white', fontSize: '0.68rem', fontWeight: '800',
                padding: '1px 6px', borderRadius: '10px'
              }}>
                {apptStats.pending}
              </span>
            )}
          </button>
        </nav>

        {/* Footer links */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.875rem', borderRadius: '10px', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}>
            <FaArrowLeft size={12} /> Ir al Inicio
          </Link>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.875rem', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'transparent', color: '#ef4444', fontSize: '0.85rem', fontWeight: '600', width: '100%', textAlign: 'left' }}>
            <FaTrash size={12} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ─────────────── */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Header */}
        <header 
          className="doctor-header"
          style={{
            padding: '1rem 2rem',
            borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: dark ? '#141319' : '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              className="doctor-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: 'none' }}
            >
              <HiMenu />
            </button>
            <div>
              <h1 style={{ fontSize: '1.3rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', margin: 0 }}>
                {selectedPatientId ? 'Expediente del Paciente' : 'Panel de Control Médico'}
              </h1>
              <p style={{ fontSize: '0.75rem', color: dark ? 'rgba(255,255,255,0.4)' : '#a89580', margin: 0 }}>
                Monitoreo y seguimiento de métricas de salud en Tamaulipas
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <select
              value={(() => {
                const match = document.cookie.match(/googtrans=\/es\/([a-z]{2})/)
                return match ? match[1] : 'es'
              })()}
              onChange={e => {
                const langCode = e.target.value
                if (langCode === 'es') {
                  document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost";
                  document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost";
                } else {
                  document.cookie = `googtrans=/es/${langCode}; path=/`;
                  document.cookie = `googtrans=/es/${langCode}; path=/; domain=localhost`;
                  document.cookie = `googtrans=/es/${langCode}; path=/; domain=.localhost`;
                }
                window.location.reload()
              }}
              style={{
                padding: '0.4rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700',
                border: `1.5px solid ${dark ? '#272530' : '#e8ddd0'}`,
                background: dark ? '#1e1c25' : '#faf8f5', color: dark ? '#fff' : '#1a1715',
                cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="es">Español 🇪🇸</option>
              <option value="en">English 🇺🇸</option>
              <option value="fr">Français 🇫🇷</option>
              <option value="pt">Português 🇵🇹</option>
              <option value="de">Deutsch 🇩🇪</option>
            </select>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.5rem 1rem', borderRadius: '12px',
              background: dark ? 'rgba(3,105,161,0.12)' : '#0369a112',
              color: dark ? '#38bdf8' : '#0369a1',
              fontSize: '0.8rem', fontWeight: '700',
            }}>
              <FaStethoscope size={14} />
              Dr(a). {user?.name}
            </div>
          </div>
        </header>

        {/* Outer scroll container */}
        <div style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <div className="spinner" />
            </div>
          ) : selectedPatientId ? (
            
            /* =========================================================================
               DETAILED PATIENT EXPEDIENT VIEW
               ========================================================================= */
            loadingDetail || !patientDetail ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
                <div className="spinner" />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Profile card and Back button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button 
                    onClick={() => setSelectedPatientId(null)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: dark ? '#38bdf8' : '#0369a1', fontWeight: '700', fontSize: '0.9rem'
                    }}
                  >
                    <FaArrowLeft /> Volver a la lista
                  </button>
                </div>

                <div style={{ ...cardStyle(dark), padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '50%', background: '#0369a120',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0369a140',
                      fontSize: '1.5rem', color: '#0369a1', overflow: 'hidden'
                    }}>
                      {patientDetail.patient.avatar ? (
                        <img src={patientDetail.patient.avatar.startsWith('http') ? patientDetail.patient.avatar : `${API_BASE}/${patientDetail.patient.avatar}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        patientDetail.patient.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', margin: 0 }}>
                        {patientDetail.patient.name}
                      </h2>
                      <p style={{ fontSize: '0.8rem', color: dark ? 'rgba(255,255,255,0.45)' : '#7d6e5e', margin: '2px 0 0' }}>
                        {patientDetail.patient.email} • Edad: {getAge(patientDetail.patient.birthDate)} años ({new Date(patientDetail.patient.birthDate).toLocaleDateString('es-MX')})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActivePatientTab('analytics')}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.6rem 1.25rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #0369a1, #38bdf8)',
                      color: 'white',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(3, 105, 161, 0.3)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(3, 105, 161, 0.4)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(3, 105, 161, 0.3)'
                    }}
                  >
                    <FaChartLine size={14} /> Estadísticas Avanzadas
                  </button>
                </div>

                {/* Sub-tabs: Principal Patient and Family Members */}
                <div style={{ display: 'flex', borderBottom: `2px solid ${dark ? '#1e1c25' : '#e8ddd0'}`, gap: '0.5rem', overflowX: 'auto', paddingBottom: '2px' }}>
                  <button
                    onClick={() => setActivePatientTab('main')}
                    style={{
                      padding: '0.6rem 1.2rem', border: 'none', background: 'none', cursor: 'pointer',
                      fontSize: '0.85rem', fontWeight: '700', whiteSpace: 'nowrap',
                      color: activePatientTab === 'main' ? (dark ? '#38bdf8' : '#0369a1') : (dark ? '#7e7a8c' : '#a89580'),
                      borderBottom: activePatientTab === 'main' ? `3px solid ${dark ? '#38bdf8' : '#0369a1'}` : '3px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Paciente Principal
                  </button>
                  {patientDetail.familyMembers.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setActivePatientTab(m.id)}
                      style={{
                        padding: '0.6rem 1.2rem', border: 'none', background: 'none', cursor: 'pointer',
                        fontSize: '0.85rem', fontWeight: '700', whiteSpace: 'nowrap',
                        color: activePatientTab === m.id ? (dark ? '#38bdf8' : '#0369a1') : (dark ? '#7e7a8c' : '#a89580'),
                        borderBottom: activePatientTab === m.id ? `3px solid ${dark ? '#38bdf8' : '#0369a1'}` : '3px solid transparent',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {m.name} ({m.relationship ? (m.relationship.charAt(0).toUpperCase() + m.relationship.slice(1)) : 'Familiar'})
                    </button>
                  ))}
                  <button
                    onClick={() => setActivePatientTab('analytics')}
                    style={{
                      padding: '0.6rem 1.2rem', border: 'none', background: 'none', cursor: 'pointer',
                      fontSize: '0.85rem', fontWeight: '700', whiteSpace: 'nowrap',
                      color: activePatientTab === 'analytics' ? (dark ? '#38bdf8' : '#0369a1') : (dark ? '#7e7a8c' : '#a89580'),
                      borderBottom: activePatientTab === 'analytics' ? `3px solid ${dark ? '#38bdf8' : '#0369a1'}` : '3px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Estadísticas y Predicciones
                  </button>
                </div>

                {/* Active Tab Container */}
                <div>
                  {activePatientTab === 'analytics' ? (
                    <AdvancedAnalytics
                      propUserId={selectedPatientId}
                      propFamilyMemberId={null}
                      familyMembers={patientDetail.familyMembers}
                      isDoctorView={true}
                    />
                  ) : activePatientTab === 'main' ? (
                    /* Main patient records */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {/* Grid cards metrics */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                        {(() => {
                          const latest = getLatestMetrics(patientDetail.records.filter(r => r.familyMemberId === null))
                          return Object.keys(METRIC_CONFIGS).map(type => 
                            renderMetricDetailCard(type, latest[type])
                          )
                        })()}
                      </div>

                      {/* Evolution Charts */}
                      {(() => {
                        const filtered = patientDetail.records.filter(r => r.familyMemberId === null && r.type === chartMetric)
                        // Reverse records to chronological for charting
                        const chartData = [...filtered].reverse().map(r => ({
                          date: new Date(r.recordedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
                          valor: r.value,
                          valor2: r.value2 || undefined
                        }))

                        const mCfg = METRIC_CONFIGS[chartMetric]

                        return (
                          <div style={{ ...cardStyle(dark), padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FaChartLine style={{ color: mCfg.color }} />
                              Historial y Evolución: {mCfg.label}
                            </h3>

                            {chartData.length === 0 ? (
                              <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${dark ? '#1e1c25' : '#e8ddd0'}`, borderRadius: '8px' }}>
                                <p style={{ fontSize: '0.85rem', color: dark ? '#7e7a8c' : '#a89580', margin: 0 }}>Sin registros históricos para esta métrica</p>
                              </div>
                            ) : (
                              <div style={{ width: '100%', height: '260px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                      <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={mCfg.gradient[0]} stopOpacity={0.6}/>
                                        <stop offset="95%" stopColor={mCfg.gradient[1]} stopOpacity={0.05}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#1e1c25' : '#e8ddd0'} />
                                    <XAxis dataKey="date" stroke={dark ? '#7e7a8c' : '#a89580'} style={{ fontSize: '0.75rem', fontWeight: '600' }} />
                                    <YAxis stroke={dark ? '#7e7a8c' : '#a89580'} style={{ fontSize: '0.75rem', fontWeight: '600' }} />
                                    <Tooltip contentStyle={{ background: dark ? '#141319' : '#fff', borderColor: dark ? '#1e1c25' : '#e8ddd0', color: dark ? '#fff' : '#1a1715' }} />
                                    <Area type="monotone" dataKey="valor" stroke={mCfg.color} strokeWidth={2.5} fillOpacity={1} fill="url(#metricGrad)" name={mCfg.label} />
                                    {chartMetric === 'bloodPressure' && (
                                      <Area type="monotone" dataKey="valor2" stroke="#ef4444" strokeWidth={2.5} fill="transparent" name="Presión Diastólica" />
                                    )}
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      {/* Two column meds / logs */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        
                        {/* Medical Logs Table */}
                        <div style={{ ...cardStyle(dark), padding: '1.25rem', overflow: 'hidden' }}>
                          <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaHeartbeat style={{ color: '#0369a1' }} /> Registros Recientes
                          </h3>
                          <div className="doctor-table-container" style={{ overflowX: 'auto', maxHeight: '300px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                              <thead>
                                <tr style={{ background: dark ? '#1e1c25' : '#faf8f5', borderBottom: `1px solid ${dark ? '#272530' : '#e8ddd0'}` }}>
                                  <th style={{ padding: '0.5rem', textAlign: 'left', color: '#0369a1' }}>FECHA</th>
                                  <th style={{ padding: '0.5rem', textAlign: 'left', color: '#0369a1' }}>MÉTRICA</th>
                                  <th style={{ padding: '0.5rem', textAlign: 'left', color: '#0369a1' }}>VALOR</th>
                                  <th style={{ padding: '0.5rem', textAlign: 'left', color: '#0369a1' }}>NOTAS</th>
                                </tr>
                              </thead>
                              <tbody>
                                {patientDetail.records.filter(r => r.familyMemberId === null).length === 0 ? (
                                  <tr><td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: dark ? '#7e7a8c' : '#a89580' }}>Sin registros cargados</td></tr>
                                ) : (
                                  patientDetail.records.filter(r => r.familyMemberId === null).slice(0, 15).map(r => (
                                    <tr key={r.id} style={{ borderBottom: `1px solid ${dark ? '#1e1c25' : '#f4efe7'}` }}>
                                      <td style={{ padding: '0.5rem', color: dark ? '#c5bfae' : '#5c5248', whiteSpace: 'nowrap' }}>
                                        {new Date(r.recordedAt).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                      </td>
                                      <td style={{ padding: '0.5rem', fontWeight: '600', color: dark ? '#e5dfef' : '#1a1715' }}>
                                        {METRIC_CONFIGS[r.type]?.label || r.type}
                                      </td>
                                      <td style={{ padding: '0.5rem', fontWeight: '700', color: dark ? '#fff' : '#1a1715' }}>
                                        {r.type === 'bloodPressure' ? `${r.value}/${r.value2} mmHg` : `${r.value} ${r.unit || ''}`}
                                      </td>
                                      <td style={{ padding: '0.5rem', color: dark ? '#7e7a8c' : '#a89580', fontStyle: 'italic', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {r.notes || '—'}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Medications and Supplements */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          
                          {/* Medications list */}
                          <div style={{ ...cardStyle(dark), padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FaFilePrescription style={{ color: '#10b981' }} /> Tratamiento Médico (Medicamentos)
                            </h3>
                            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                              {patientDetail.medications.length === 0 ? (
                                <p style={{ fontSize: '0.8rem', color: dark ? '#7e7a8c' : '#a89580', fontStyle: 'italic', margin: 0 }}>Sin medicamentos asignados</p>
                              ) : (
                                patientDetail.medications.map(m => (
                                  <div key={m.id} style={{ padding: '0.6rem', background: dark ? '#1e1c25' : '#faf8f5', borderRadius: '8px', border: `1px solid ${dark ? '#272530' : '#e8ddd0'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: dark ? '#fff' : '#1a1715' }}>{m.name}</span>
                                      <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '700' }}>Dosis: {m.dose}</span>
                                    </div>
                                    <p style={{ fontSize: '0.72rem', color: dark ? '#7e7a8c' : '#a89580', margin: '4px 0 0' }}>
                                      Frecuencia: {m.frequency} • Horarios: {Array.isArray(m.schedules) ? m.schedules.map(formatTimeTo12h).join(', ') : (typeof m.schedules === 'string' ? m.schedules.split(',').map(s => formatTimeTo12h(s.trim())).join(', ') : 'N/A')}
                                    </p>
                                    {m.instructions && (
                                      <p style={{ fontSize: '0.68rem', color: dark ? '#9ea4b0' : '#7d6e5e', fontStyle: 'italic', margin: '4px 0 0' }}>
                                        Instrucciones: "{m.instructions}"
                                      </p>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Nutraceuticals Supplements */}
                          <div style={{ ...cardStyle(dark), padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FaUtensils style={{ color: '#f59e0b' }} /> Suplementos Nutracéuticos
                            </h3>
                            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                              {patientDetail.supplements.length === 0 ? (
                                <p style={{ fontSize: '0.8rem', color: dark ? '#7e7a8c' : '#a89580', fontStyle: 'italic', margin: 0 }}>Sin suplementos registrados</p>
                              ) : (
                                patientDetail.supplements.map(s => (
                                  <div key={s.id} style={{ padding: '0.6rem', background: dark ? '#1e1c25' : '#faf8f5', borderRadius: '8px', border: `1px solid ${dark ? '#272530' : '#e8ddd0'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: dark ? '#fff' : '#1a1715' }}>{s.name}</span>
                                      <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: '700' }}>{s.dosage}</span>
                                    </div>
                                    <p style={{ fontSize: '0.72rem', color: dark ? '#7e7a8c' : '#a89580', margin: '4px 0 0' }}>
                                      Frecuencia: {s.frequency}
                                    </p>
                                    {s.instructions && (
                                      <p style={{ fontSize: '0.68rem', color: dark ? '#9ea4b0' : '#7d6e5e', fontStyle: 'italic', margin: '4px 0 0' }}>
                                        "{s.instructions}"
                                      </p>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                        </div>

                      </div>
                    </div>
                  ) : (
                    /* Family member records */
                    (() => {
                      const member = patientDetail.familyMembers.find(m => m.id === activePatientTab)
                      const memberRecords = patientDetail.records.filter(r => r.familyMemberId === activePatientTab)
                      if (!member) return null

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          
                          {/* Member info header card */}
                          <div style={{ ...cardStyle(dark), padding: '1rem', display: 'flex', gap: '1.5rem', background: dark ? 'rgba(255,255,255,0.02)' : '#fdfdfd' }}>
                            <div>
                              <span style={{ fontSize: '0.75rem', color: dark ? '#7e7a8c' : '#a89580', fontWeight: '700' }}>CURP:</span>
                              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: dark ? '#fff' : '#1a1715', marginLeft: '0.25rem' }}>{member.curp || 'N/A'}</span>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.75rem', color: dark ? '#7e7a8c' : '#a89580', fontWeight: '700' }}>Parentesco:</span>
                              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: dark ? '#fff' : '#1a1715', marginLeft: '0.25rem', textTransform: 'capitalize' }}>{member.relationship}</span>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.75rem', color: dark ? '#7e7a8c' : '#a89580', fontWeight: '700' }}>Género:</span>
                              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: dark ? '#fff' : '#1a1715', marginLeft: '0.25rem', textTransform: 'capitalize' }}>{member.gender === 'male' ? 'Masculino' : member.gender === 'female' ? 'Femenino' : 'Otro'}</span>
                            </div>
                            {member.diagnosis && (
                              <div>
                                <span style={{ fontSize: '0.75rem', color: dark ? '#7e7a8c' : '#a89580', fontWeight: '700' }}>Diagnóstico Previo:</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#ef4444', marginLeft: '0.25rem' }}>{member.diagnosis}</span>
                              </div>
                            )}
                          </div>

                          {/* Grid cards metrics */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                            {(() => {
                              const latest = getLatestMetrics(memberRecords)
                              return Object.keys(METRIC_CONFIGS).map(type => 
                                renderMetricDetailCard(type, latest[type])
                              )
                            })()}
                          </div>

                          {/* Evolution Charts */}
                          {(() => {
                            const filtered = memberRecords.filter(r => r.type === chartMetric)
                            const chartData = [...filtered].reverse().map(r => ({
                              date: new Date(r.recordedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
                              valor: r.value,
                              valor2: r.value2 || undefined
                            }))

                            const mCfg = METRIC_CONFIGS[chartMetric]

                            return (
                              <div style={{ ...cardStyle(dark), padding: '1.5rem' }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <FaChartLine style={{ color: mCfg.color }} />
                                  Historial y Evolución ({member.name}): {mCfg.label}
                                </h3>

                                {chartData.length === 0 ? (
                                  <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${dark ? '#1e1c25' : '#e8ddd0'}`, borderRadius: '8px' }}>
                                    <p style={{ fontSize: '0.85rem', color: dark ? '#7e7a8c' : '#a89580', margin: 0 }}>Sin registros históricos para esta métrica</p>
                                  </div>
                                ) : (
                                  <div style={{ width: '100%', height: '260px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                          <linearGradient id="memberGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={mCfg.gradient[0]} stopOpacity={0.6}/>
                                            <stop offset="95%" stopColor={mCfg.gradient[1]} stopOpacity={0.05}/>
                                          </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#1e1c25' : '#e8ddd0'} />
                                        <XAxis dataKey="date" stroke={dark ? '#7e7a8c' : '#a89580'} style={{ fontSize: '0.75rem', fontWeight: '600' }} />
                                        <YAxis stroke={dark ? '#7e7a8c' : '#a89580'} style={{ fontSize: '0.75rem', fontWeight: '600' }} />
                                        <Tooltip contentStyle={{ background: dark ? '#141319' : '#fff', borderColor: dark ? '#1e1c25' : '#e8ddd0', color: dark ? '#fff' : '#1a1715' }} />
                                        <Area type="monotone" dataKey="valor" stroke={mCfg.color} strokeWidth={2.5} fillOpacity={1} fill="url(#memberGrad)" name={mCfg.label} />
                                        {chartMetric === 'bloodPressure' && (
                                          <Area type="monotone" dataKey="valor2" stroke="#ef4444" strokeWidth={2.5} fill="transparent" name="Presión Diastólica" />
                                        )}
                                      </AreaChart>
                                    </ResponsiveContainer>
                                  </div>
                                )}
                              </div>
                            )
                          })()}

                          {/* Recent logs */}
                          <div style={{ ...cardStyle(dark), padding: '1.25rem', overflow: 'hidden' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FaHeartbeat style={{ color: '#0369a1' }} /> Registros Recientes de {member.name}
                            </h3>
                            <div className="doctor-table-container" style={{ overflowX: 'auto', maxHeight: '250px' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                <thead>
                                  <tr style={{ background: dark ? '#1e1c25' : '#faf8f5', borderBottom: `1px solid ${dark ? '#272530' : '#e8ddd0'}` }}>
                                    <th style={{ padding: '0.5rem', textAlign: 'left', color: '#0369a1' }}>FECHA</th>
                                    <th style={{ padding: '0.5rem', textAlign: 'left', color: '#0369a1' }}>MÉTRICA</th>
                                    <th style={{ padding: '0.5rem', textAlign: 'left', color: '#0369a1' }}>VALOR</th>
                                    <th style={{ padding: '0.5rem', textAlign: 'left', color: '#0369a1' }}>NOTAS</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {memberRecords.length === 0 ? (
                                    <tr><td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: dark ? '#7e7a8c' : '#a89580' }}>Sin registros cargados</td></tr>
                                  ) : (
                                    memberRecords.slice(0, 15).map(r => (
                                      <tr key={r.id} style={{ borderBottom: `1px solid ${dark ? '#1e1c25' : '#f4efe7'}` }}>
                                        <td style={{ padding: '0.5rem', color: dark ? '#c5bfae' : '#5c5248', whiteSpace: 'nowrap' }}>
                                          {new Date(r.recordedAt).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td style={{ padding: '0.5rem', fontWeight: '600', color: dark ? '#e5dfef' : '#1a1715' }}>
                                          {METRIC_CONFIGS[r.type]?.label || r.type}
                                        </td>
                                        <td style={{ padding: '0.5rem', fontWeight: '700', color: dark ? '#fff' : '#1a1715' }}>
                                          {r.type === 'bloodPressure' ? `${r.value}/${r.value2} mmHg` : `${r.value} ${r.unit || ''}`}
                                        </td>
                                        <td style={{ padding: '0.5rem', color: dark ? '#7e7a8c' : '#a89580', fontStyle: 'italic', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {r.notes || '—'}
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                        </div>
                      )
                    })()
                  )}
                </div>

              </div>
            )

          ) : (
            
            /* =========================================================================
               GENERAL DASHBOARD TABS & TABLES
               ========================================================================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Summary stats cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <div style={{ ...cardStyle(dark), padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#0284c715', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', fontSize: '1.25rem' }}>
                    <FaUsers />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: dark ? '#7e7a8c' : '#a89580' }}>
                      Pacientes Asignados
                    </span>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', margin: '2px 0 0' }}>
                      {stats.patients}
                    </div>
                  </div>
                </div>

                <div style={{ ...cardStyle(dark), padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#10b98115', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '1.25rem' }}>
                    <FaHeartbeat />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: dark ? '#7e7a8c' : '#a89580' }}>
                      Registros de Pacientes
                    </span>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', margin: '2px 0 0' }}>
                      {stats.records}
                    </div>
                  </div>
                </div>

                <div style={{ ...cardStyle(dark), padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f59e0b15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontSize: '1.25rem' }}>
                    <FaChartLine />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: dark ? '#7e7a8c' : '#a89580' }}>
                      Registros (Últimos 7 Días)
                    </span>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', margin: '2px 0 0' }}>
                      {stats.recordsLast7Days}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main tab switcher */}
              <div style={{ display: 'flex', borderBottom: `2px solid ${dark ? '#1e1c25' : '#e8ddd0'}`, gap: '0.5rem' }}>
                <button
                  onClick={() => setActiveTab('patients')}
                  style={{
                    padding: '0.75rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: '0.9rem', fontWeight: '700',
                    color: activeTab === 'patients' ? (dark ? '#38bdf8' : '#0369a1') : (dark ? '#7e7a8c' : '#a89580'),
                    borderBottom: activeTab === 'patients' ? `3px solid ${dark ? '#38bdf8' : '#0369a1'}` : '3px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Mis Pacientes
                </button>
                <button
                  onClick={() => setActiveTab('alerts')}
                  style={{
                    padding: '0.75rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: '0.9rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: activeTab === 'alerts' ? (dark ? '#38bdf8' : '#0369a1') : (dark ? '#7e7a8c' : '#a89580'),
                    borderBottom: activeTab === 'alerts' ? `3px solid ${dark ? '#38bdf8' : '#0369a1'}` : '3px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Alertas Médicas
                  {pendingCount > 0 && (
                    <span style={{
                      background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: '800',
                      padding: '1px 5px', borderRadius: '10px'
                    }}>
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('appointments')}
                  style={{
                    padding: '0.75rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: '0.9rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: activeTab === 'appointments' ? (dark ? '#38bdf8' : '#0369a1') : (dark ? '#7e7a8c' : '#a89580'),
                    borderBottom: activeTab === 'appointments' ? `3px solid ${dark ? '#38bdf8' : '#0369a1'}` : '3px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Citas Virtuales
                  {apptStats.pending > 0 && (
                    <span style={{
                      background: '#e11d48', color: '#fff', fontSize: '0.65rem', fontWeight: '800',
                      padding: '1px 5px', borderRadius: '10px'
                    }}>
                      {apptStats.pending}
                    </span>
                  )}
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'patients' ? (
                
                /* ── Patients Tab Content ─────────────────────── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Search Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
                      <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Buscar por nombre o correo..."
                        style={{
                          width: '100%', padding: '0.55rem 1rem', borderRadius: '8px',
                          border: `1.5px solid ${dark ? '#272530' : '#e8ddd0'}`,
                          background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#1a1715',
                          fontSize: '0.85rem', outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Patients Table */}
                  <div className="doctor-table-container" style={{ ...cardStyle(dark), overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: dark ? '#1e1c25' : '#faf8f5', borderBottom: `1px solid ${dark ? '#272530' : '#e8ddd0'}` }}>
                          {['PACIENTE', 'DIAGNÓSTICO / ALERTA', 'REGISTROS', 'FAMILIARES', 'ÚLTIMO REGISTRO', 'ACCIONES'].map(h => (
                            <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.06em', color: '#0369a1' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPatients.length === 0 ? (
                          <tr><td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: dark ? '#7e7a8c' : '#a89580' }}>No se encontraron pacientes asignados</td></tr>
                        ) : (
                          filteredPatients.map(p => (
                            <tr key={p.id} style={{ borderBottom: `1px solid ${dark ? '#1e1c25' : '#f4efe7'}` }}>
                              {/* Patient detail */}
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <div style={{
                                    width: '34px', height: '34px', borderRadius: '50%', background: '#0369a115',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '700', color: '#0369a1', overflow: 'hidden'
                                  }}>
                                    {p.avatar ? (
                                      <img src={p.avatar.startsWith('http') ? p.avatar : `${API_BASE}/${p.avatar}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      p.name.charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: '700', color: dark ? '#fff' : '#1a1715' }}>{p.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: dark ? '#7e7a8c' : '#7d6e5e' }}>{p.email}</div>
                                  </div>
                                </div>
                              </td>

                              {/* Alert summary badge */}
                              <td style={{ padding: '0.85rem 1rem' }}>
                                {getPatientAlertBadge(p.id)}
                              </td>

                              {/* Records count */}
                              <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: dark ? '#fff' : '#1a1715' }}>
                                {p.recordsCount} registros
                              </td>

                              {/* Family members count */}
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                  fontSize: '0.8rem', color: dark ? '#e5dfef' : '#1a1715', fontWeight: '600'
                                }}>
                                  <FaUserFriends style={{ color: dark ? '#7e7a8c' : '#a89580' }} />
                                  {p.familyCount}
                                </span>
                              </td>

                              {/* Last record timestamp */}
                              <td style={{ padding: '0.85rem 1rem', color: dark ? '#7e7a8c' : '#7d6e5e', fontWeight: '600' }}>
                                {p.lastRecordDate ? new Date(p.lastRecordDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin registros'}
                              </td>

                              {/* Detail actions */}
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <button
                                  onClick={() => viewPatientDetails(p.id)}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                    padding: '0.45rem 0.9rem', borderRadius: '6px', border: 'none',
                                    background: '#0369a1', color: 'white', fontSize: '0.78rem', fontWeight: '700',
                                    cursor: 'pointer', transition: 'background 0.2s'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#0284c7'}
                                  onMouseLeave={e => e.currentTarget.style.background = '#0369a1'}
                                >
                                  Ver Detalle <FaChevronRight size={10} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>

              ) : activeTab === 'alerts' ? (
                
                /* ── Alerts Tab Content ─────────────────────── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Alerts sub tab list */}
                  <div style={{ display: 'flex', gap: '0.5rem', background: dark ? '#141319' : '#faf8f5', padding: '0.25rem', borderRadius: '8px', width: 'fit-content', border: `1px solid ${dark ? '#1e1c25' : '#e8ddd0'}` }}>
                    {[
                      { key: 'all', label: 'Todas las Alertas' },
                      { key: 'critical', label: 'Solo Críticas' },
                      { key: 'warning', label: 'Solo Advertencias' }
                    ].map(st => (
                      <button
                        key={st.key}
                        onClick={() => setAlertsSubTab(st.key)}
                        style={{
                          padding: '0.4rem 0.8rem', border: 'none', borderRadius: '6px', cursor: 'pointer',
                          fontSize: '0.78rem', fontWeight: '700',
                          background: alertsSubTab === st.key 
                            ? (st.key === 'critical' ? '#ef4444' : st.key === 'warning' ? '#f59e0b' : '#0369a1')
                            : 'transparent',
                          color: alertsSubTab === st.key ? '#fff' : (dark ? '#7e7a8c' : '#5c5248'),
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {/* Alerts Grid / Cards */}
                  {filteredAlerts.length === 0 ? (
                    <div style={{ ...cardStyle(dark), padding: '3rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>✓</span>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', margin: 0 }}>¡Todo bajo control!</h3>
                      <p style={{ fontSize: '0.82rem', color: dark ? '#7e7a8c' : '#a89580', margin: '4px 0 0' }}>No hay alertas activas de esta categoría.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                      {filteredAlerts.map(alertItem => {
                        const isCrit = alertItem.severity === 'critical'
                        const isDismissed = alertItem.status === 'dismissed'

                        return (
                          <div 
                            key={alertItem.id} 
                            style={{ 
                              ...cardStyle(dark), 
                              padding: '1.25rem', 
                              borderLeft: `5px solid ${isCrit ? '#ef4444' : '#f59e0b'}`,
                              opacity: isDismissed ? 0.6 : 1,
                              display: 'flex', flexDirection: 'column', gap: '0.75rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{
                                padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.62rem', fontWeight: '800',
                                color: isCrit ? '#ef4444' : '#f59e0b',
                                background: isCrit ? '#ef444415' : '#f59e0b15',
                                border: `1px solid ${isCrit ? '#ef444430' : '#f59e0b30'}`
                              }}>
                                {isCrit ? 'CRÍTICO' : 'ADVERTENCIA'}
                              </span>
                              
                              <span style={{ fontSize: '0.7rem', color: dark ? '#7e7a8c' : '#a89580', fontWeight: '600' }}>
                                {formatDate(alertItem.recordedAt)}
                              </span>
                            </div>

                            <div>
                              <div style={{ fontSize: '0.7rem', fontWeight: '800', color: dark ? '#7e7a8c' : '#a89580', textTransform: 'uppercase' }}>
                                Paciente:
                              </div>
                              <div style={{ fontSize: '0.9rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715' }}>
                                {alertItem.patient?.name || 'Usuario'}
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
                              <div>
                                <span style={{ fontSize: '0.88rem', fontWeight: '800', color: isCrit ? '#ef4444' : '#f59e0b' }}>
                                  {alertItem.message}
                                </span>
                                <p style={{ fontSize: '0.75rem', color: dark ? '#9ea4b0' : '#5c5248', margin: '2px 0 0', lineHeight: 1.4 }}>
                                  {alertItem.description}
                                </p>
                              </div>
                              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', whiteSpace: 'nowrap' }}>
                                {alertItem.value}
                              </div>
                            </div>

                            {!isDismissed && (
                              <div style={{ borderTop: `1px solid ${dark ? '#1e1c25' : '#e8ddd0'}`, paddingTop: '0.75rem', display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                                <button
                                  onClick={() => viewPatientDetails(alertItem.userId)}
                                  style={{
                                    flex: 1, padding: '0.45rem', borderRadius: '6px', border: 'none',
                                    background: dark ? '#1e1c25' : '#faf8f5', 
                                    border: `1.5px solid ${dark ? '#272530' : '#e8ddd0'}`,
                                    color: dark ? '#fff' : '#1a1715', fontSize: '0.75rem', fontWeight: '700',
                                    cursor: 'pointer', transition: 'all 0.15s',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = dark ? '#272530' : '#f1ede6'}
                                  onMouseLeave={e => e.currentTarget.style.background = dark ? '#1e1c25' : '#faf8f5'}
                                >
                                  Ver paciente
                                </button>
                                <button
                                  onClick={(e) => dismissAlert(alertItem.id, e)}
                                  style={{
                                    flex: 1, padding: '0.45rem', borderRadius: '6px', border: 'none',
                                    background: '#10b98118', color: '#059669', fontSize: '0.75rem', fontWeight: '700',
                                    cursor: 'pointer', transition: 'all 0.15s',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#10b98130'}
                                  onMouseLeave={e => e.currentTarget.style.background = '#10b98118'}
                                >
                                  Descartar
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              ) : (
                 /* ── Appointments (Citas Virtuales) Tab Content ── */
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                   
                   {/* Dashboard stats specific to appointments */}
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                     <div style={{ ...cardStyle(dark), padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e11d4815', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', fontSize: '1.25rem' }}>
                         <FaCalendarAlt />
                       </div>
                       <div>
                         <span style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: dark ? '#7e7a8c' : '#a89580' }}>
                           Solicitudes Pendientes
                         </span>
                         <div style={{ fontSize: '1.75rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', margin: '2px 0 0' }}>
                           {apptStats.pending}
                         </div>
                       </div>
                     </div>

                     <div style={{ ...cardStyle(dark), padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#10b98115', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '1.25rem' }}>
                         <FaVideo />
                       </div>
                       <div>
                         <span style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: dark ? '#7e7a8c' : '#a89580' }}>
                           Confirmadas para Hoy
                         </span>
                         <div style={{ fontSize: '1.75rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', margin: '2px 0 0' }}>
                           {apptStats.acceptedToday}
                         </div>
                       </div>
                     </div>

                     <div style={{ ...cardStyle(dark), padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#0284c715', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', fontSize: '1.25rem' }}>
                         <FaCheckCircle />
                       </div>
                       <div>
                         <span style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: dark ? '#7e7a8c' : '#a89580' }}>
                           Total Completadas
                         </span>
                         <div style={{ fontSize: '1.75rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', margin: '2px 0 0' }}>
                           {apptStats.completed}
                         </div>
                       </div>
                     </div>
                   </div>

                   {/* Grid Layout: Left column has config & schedules, right column has appointments list */}
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'flex-start' }}>
                     
                     {/* LEFT COLUMN: Agenda Configuration & Recurrent Schedule */}
                     <div style={{ ...cardStyle(dark), padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: `1px solid ${dark ? '#1e1c25' : '#e8ddd0'}`, paddingBottom: '0.75rem' }}>
                         <FaCog style={{ color: dark ? '#38bdf8' : '#0369a1' }} />
                         <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715' }}>Configuración de Agenda</h3>
                       </div>

                       {configSuccess && (
                         <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#10b981', fontSize: '0.85rem', fontWeight: '600' }}>
                           {configSuccess}
                         </div>
                       )}

                       <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                         {/* Duration settings */}
                         <div>
                           <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: dark ? '#7e7a8c' : '#a89580', marginBottom: '0.35rem' }}>
                             Duración por cita (Minutos):
                           </label>
                           <select
                             value={appointmentDuration}
                             onChange={e => setAppointmentDuration(Number(e.target.value))}
                             style={{
                               width: '100%', padding: '0.55rem', borderRadius: '8px',
                               background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#1a1715',
                               border: `1.5px solid ${dark ? '#272530' : '#e8ddd0'}`, fontSize: '0.9rem', fontWeight: '600'
                             }}
                           >
                             <option value={15}>15 minutos</option>
                             <option value={20}>20 minutos</option>
                             <option value={30}>30 minutos</option>
                             <option value={45}>45 minutos</option>
                             <option value={60}>60 minutos</option>
                           </select>
                         </div>

                         {/* Daily limit */}
                         <div>
                           <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: dark ? '#7e7a8c' : '#a89580', marginBottom: '0.35rem' }}>
                             Límite de citas por día:
                           </label>
                           <input
                             type="number"
                             placeholder="Sin límite"
                             value={maxDailyAppointments}
                             onChange={e => setMaxDailyAppointments(e.target.value === '' ? '' : Number(e.target.value))}
                             style={{
                               width: '100%', padding: '0.55rem', borderRadius: '8px',
                               background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#1a1715',
                               border: `1.5px solid ${dark ? '#272530' : '#e8ddd0'}`, fontSize: '0.9rem'
                             }}
                           />
                         </div>

                         {/* Schedule list by Day of week */}
                         <div>
                           <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: dark ? '#7e7a8c' : '#a89580', marginBottom: '0.5rem' }}>
                             Horarios de atención semanal:
                           </label>
                           
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                             {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((dayName, dayIdx) => {
                               const daySchedules = doctorSchedule.filter(s => s.dayOfWeek === dayIdx)
                               
                               return (
                                 <div key={dayIdx} style={{ padding: '0.75rem', borderRadius: '8px', background: dark ? '#1e1c25' : '#faf8f5', border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                     <strong style={{ fontSize: '0.85rem', color: dark ? '#fff' : '#1a1715' }}>{dayName}</strong>
                                     <button
                                       type="button"
                                       onClick={() => handleAddBlock(dayIdx)}
                                       style={{
                                         display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                                         background: 'transparent', border: 'none', color: '#10b981',
                                         fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer'
                                       }}
                                     >
                                       <FaPlus size={10} /> Añadir Bloque
                                     </button>
                                   </div>

                                   {daySchedules.length === 0 ? (
                                     <span style={{ fontSize: '0.75rem', color: dark ? '#7e7a8c' : '#a89580', fontStyle: 'italic' }}>Sin horario de atención</span>
                                   ) : (
                                     daySchedules.map((s) => {
                                       // Find index in master list
                                       const masterIndex = doctorSchedule.findIndex(item => item === s)
                                       return (
                                         <div key={masterIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                           <input
                                             type="time"
                                             value={s.startTime}
                                             onChange={e => handleBlockChange(masterIndex, 'startTime', e.target.value)}
                                             style={{
                                               padding: '0.25rem', borderRadius: '4px', border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`,
                                               background: dark ? '#0c0b0f' : '#fff', color: dark ? '#fff' : '#1a1715', fontSize: '0.8rem'
                                             }}
                                           />
                                           <span style={{ fontSize: '0.75rem', color: dark ? '#7e7a8c' : '#a89580' }}>a</span>
                                           <input
                                             type="time"
                                             value={s.endTime}
                                             onChange={e => handleBlockChange(masterIndex, 'endTime', e.target.value)}
                                             style={{
                                               padding: '0.25rem', borderRadius: '4px', border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`,
                                               background: dark ? '#0c0b0f' : '#fff', color: dark ? '#fff' : '#1a1715', fontSize: '0.8rem'
                                             }}
                                           />
                                           <button
                                             type="button"
                                             onClick={() => handleRemoveBlock(masterIndex)}
                                             style={{
                                               border: 'none', background: 'transparent', color: '#ef4444',
                                               cursor: 'pointer', display: 'flex', alignItems: 'center'
                                             }}
                                             title="Eliminar bloque"
                                           >
                                             <FaTrashAlt size={12} />
                                           </button>
                                         </div>
                                       )
                                     })
                                   )}
                                 </div>
                               )
                             })}
                           </div>
                         </div>

                         <button
                           type="submit"
                           disabled={actionLoading}
                           style={{
                             padding: '0.7rem', borderRadius: '8px', border: 'none',
                             background: 'var(--color-primary-500)', color: 'white',
                             fontWeight: '700', cursor: actionLoading ? 'not-allowed' : 'pointer',
                             fontSize: '0.88rem', boxShadow: 'var(--shadow-sm)'
                           }}
                         >
                           {actionLoading ? 'Guardando...' : 'Guardar Configuración'}
                         </button>
                       </form>
                     </div>

                      {/* RIGHT COLUMN: Appointments lists */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Sub-sección: Solicitudes Pendientes */}
                        <div style={{ ...cardStyle(dark), padding: '1.5rem' }}>
                          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', borderBottom: `1px solid ${dark ? '#1e1c25' : '#e8ddd0'}`, paddingBottom: '0.5rem' }}>
                            Solicitudes Pendientes ({doctorAppointments.filter(a => a.status === 'pending').length})
                          </h3>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {doctorAppointments.filter(a => a.status === 'pending').length === 0 ? (
                              <p style={{ margin: 0, fontSize: '0.85rem', color: dark ? '#7e7a8c' : '#a89580', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>No hay solicitudes de citas pendientes.</p>
                            ) : (
                              doctorAppointments.filter(a => a.status === 'pending').map(appt => (
                                <div key={appt.id} style={{ padding: '1rem', borderRadius: '10px', background: dark ? '#1e1c25' : '#faf8f5', border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong style={{ fontSize: '0.9rem', color: dark ? '#fff' : '#1a1715' }}>{appt.patient?.name}</strong>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-500)', fontWeight: '700' }}>
                                      {appt.appointmentDate} @ {appt.appointmentTime}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.82rem', color: dark ? '#acb4c4' : '#5c5248' }}>
                                    <strong>Motivo:</strong> {appt.reason}
                                  </div>
                                  {appt.symptoms && (
                                    <div style={{ fontSize: '0.82rem', color: dark ? '#acb4c4' : '#5c5248' }}>
                                      <strong>Síntomas:</strong> {appt.symptoms}
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <button
                                      onClick={() => { setSelectedAppt(appt); setShowAcceptModal(true) }}
                                      style={{
                                        flex: 1, padding: '0.45rem', borderRadius: '6px', border: 'none',
                                        background: '#10b981', color: 'white', fontSize: '0.75rem', fontWeight: '700',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Aceptar
                                    </button>
                                    <button
                                      onClick={() => { setSelectedAppt(appt); setShowRejectModal(true) }}
                                      style={{
                                        flex: 1, padding: '0.45rem', borderRadius: '6px', border: '1px solid #ef4444',
                                        background: 'transparent', color: '#ef4444', fontSize: '0.75rem', fontWeight: '700',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Rechazar
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Sub-sección: Citas Confirmadas (Aceptadas) */}
                        <div style={{ ...cardStyle(dark), padding: '1.5rem' }}>
                          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', borderBottom: `1px solid ${dark ? '#1e1c25' : '#e8ddd0'}`, paddingBottom: '0.5rem' }}>
                            Citas Confirmadas / Próximas
                          </h3>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {doctorAppointments.filter(a => a.status === 'accepted').length === 0 ? (
                              <p style={{ margin: 0, fontSize: '0.85rem', color: dark ? '#7e7a8c' : '#a89580', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>No hay próximas citas confirmadas.</p>
                            ) : (
                              doctorAppointments.filter(a => a.status === 'accepted').map(appt => (
                                <div key={appt.id} style={{ padding: '1rem', borderRadius: '10px', background: dark ? '#1e1c25' : '#faf8f5', border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong style={{ fontSize: '0.9rem', color: dark ? '#fff' : '#1a1715' }}>{appt.patient?.name}</strong>
                                    <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: '700' }}>
                                      {appt.appointmentDate} a las {appt.appointmentTime} hrs
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.82rem', color: dark ? '#acb4c4' : '#5c5248' }}>
                                    <strong>Google Meet:</strong> <code>{appt.meetCode}</code>
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <button
                                      onClick={() => handleCompleteAppointment(appt.id)}
                                      style={{
                                        flex: 1, padding: '0.45rem', borderRadius: '6px', border: 'none',
                                        background: '#0284c7', color: 'white', fontSize: '0.75rem', fontWeight: '700',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Completar Cita
                                    </button>
                                    <button
                                      onClick={() => { setSelectedAppt(appt); setShowPrescriptionModal(true) }}
                                      style={{
                                        flex: 1, padding: '0.45rem', borderRadius: '6px', border: 'none',
                                        background: 'var(--color-primary-500)', color: 'white', fontSize: '0.75rem', fontWeight: '700',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Generar Receta
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Sub-sección: Historial de Citas */}
                        <div style={{ ...cardStyle(dark), padding: '1.5rem' }}>
                          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', borderBottom: `1px solid ${dark ? '#1e1c25' : '#e8ddd0'}`, paddingBottom: '0.5rem' }}>
                            Historial de Citas
                          </h3>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.50rem', maxHeight: '300px', overflowY: 'auto' }}>
                            {doctorAppointments.filter(a => ['completed', 'rejected', 'cancelled'].includes(a.status)).length === 0 ? (
                              <p style={{ margin: 0, fontSize: '0.85rem', color: dark ? '#7e7a8c' : '#a89580', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>El historial de citas está vacío.</p>
                            ) : (
                              doctorAppointments.filter(a => ['completed', 'rejected', 'cancelled'].includes(a.status)).map(appt => {
                                let statusLabel = 'Cancelada', statusColor = '#64748b'
                                if (appt.status === 'completed') { statusLabel = 'Completada'; statusColor = '#10b981' }
                                if (appt.status === 'rejected') { statusLabel = 'Rechazada'; statusColor = '#ef4444' }
                                
                                return (
                                  <div key={appt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: `1px solid ${dark ? '#1e1c25' : '#faf8f5'}` }}>
                                    <div>
                                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: dark ? '#fff' : '#1a1715' }}>{appt.patient?.name}</div>
                                      <div style={{ fontSize: '0.72rem', color: dark ? '#7e7a8c' : '#a89580' }}>
                                        {appt.appointmentDate} | {appt.appointmentTime} hrs
                                      </div>
                                    </div>
                                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: statusColor }}>
                                      {statusLabel}
                                    </span>
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>
                )}

              </div>
            )}

          </div>
        </main>

        {/* ── MODALS SECTION ── */}

        {/* 1. Accept Appointment Modal */}
        {showAcceptModal && selectedAppt && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
            <form onSubmit={handleAcceptSubmit} className="glass animate-fade-in" style={{ padding: '2rem', borderRadius: '16px', maxWidth: '450px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid var(--color-surface-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715' }}>Confirmar Cita Virtual</h3>
                <button type="button" onClick={() => { setShowAcceptModal(false); setSelectedAppt(null) }} style={{ background: 'transparent', border: 'none', color: 'var(--color-surface-400)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>
              
              <p style={{ margin: 0, fontSize: '0.88rem', color: dark ? '#b5bac5' : '#403a34' }}>
                Confirmarás la cita con <strong>{selectedAppt.patient?.name}</strong> para el día <strong>{selectedAppt.appointmentDate}</strong> a las <strong>{selectedAppt.appointmentTime} hrs</strong>.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: dark ? '#7e7a8c' : '#a89580', marginBottom: '0.35rem' }}>Enlace de Google Meet: *</label>
                <input
                  required
                  type="text"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={meetLink}
                  onChange={e => setMeetLink(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: `1.5px solid ${dark ? '#272530' : '#e8ddd0'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#1a1715' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: dark ? '#7e7a8c' : '#a89580', marginBottom: '0.35rem' }}>Código de Meet: *</label>
                <input
                  required
                  type="text"
                  placeholder="abc-defg-hij"
                  value={meetCode}
                  onChange={e => setMeetCode(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: `1.5px solid ${dark ? '#272530' : '#e8ddd0'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#1a1715' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: dark ? '#7e7a8c' : '#a89580', marginBottom: '0.35rem' }}>Notas para el paciente (opcional):</label>
                <textarea
                  placeholder="Indicaciones adicionales de acceso, etc..."
                  value={acceptNotes}
                  onChange={e => setAcceptNotes(e.target.value)}
                  style={{ width: '100%', minHeight: '60px', padding: '0.55rem', borderRadius: '6px', border: `1.5px solid ${dark ? '#272530' : '#e8ddd0'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#1a1715', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
                  {actionLoading ? 'Guardando...' : 'Confirmar Cita'}
                </button>
                <button type="button" onClick={() => { setShowAcceptModal(false); setSelectedAppt(null) }} style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`, background: 'transparent', color: dark ? '#fff' : '#1a1715', fontWeight: '600', cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 2. Reject Appointment Modal */}
        {showRejectModal && selectedAppt && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
            <form onSubmit={handleRejectSubmit} className="glass animate-fade-in" style={{ padding: '2rem', borderRadius: '16px', maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid var(--color-surface-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715' }}>Rechazar Solicitud de Cita</h3>
                <button type="button" onClick={() => { setShowRejectModal(false); setSelectedAppt(null) }} style={{ background: 'transparent', border: 'none', color: 'var(--color-surface-400)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: dark ? '#7e7a8c' : '#a89580', marginBottom: '0.35rem' }}>Escribe el Motivo del Rechazo: *</label>
                <textarea
                  required
                  placeholder="Explica al paciente por qué no es posible agendar la cita en este horario..."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  style={{ width: '100%', minHeight: '100px', padding: '0.55rem', borderRadius: '6px', border: `1.5px solid ${dark ? '#272530' : '#e8ddd0'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#1a1715', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
                  {actionLoading ? 'Rechazando...' : 'Confirmar Rechazo'}
                </button>
                <button type="button" onClick={() => { setShowRejectModal(false); setSelectedAppt(null) }} style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`, background: 'transparent', color: dark ? '#fff' : '#1a1715', fontWeight: '600', cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 3. Emit Prescription Modal */}
        {showPrescriptionModal && selectedAppt && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
            <form onSubmit={handlePrescriptionSubmit} className="glass animate-fade-in no-scrollbar" style={{ padding: '2rem', borderRadius: '16px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid var(--color-surface-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${dark ? '#272530' : '#e8ddd0'}`, paddingBottom: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715' }}>Emitir Receta Médica</h3>
                  <span style={{ fontSize: '0.8rem', color: dark ? '#7e7a8c' : '#a89580' }}>Paciente: {selectedAppt.patient?.name}</span>
                </div>
                <button type="button" onClick={() => { setShowPrescriptionModal(false); setSelectedAppt(null) }} style={{ background: 'transparent', border: 'none', color: 'var(--color-surface-400)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>

              {/* Diagnóstico */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: dark ? '#7e7a8c' : '#a89580', marginBottom: '0.35rem' }}>Diagnóstico Clínico: *</label>
                <textarea
                  required
                  placeholder="Describe el diagnóstico general del paciente..."
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  style={{ width: '100%', minHeight: '60px', padding: '0.55rem', borderRadius: '6px', border: `1.5px solid ${dark ? '#272530' : '#e8ddd0'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#1a1715', resize: 'vertical' }}
                />
              </div>

              {/* Medicamentos Lista */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: dark ? '#7e7a8c' : '#a89580' }}>Medicamentos: *</label>
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                      background: 'transparent', border: 'none', color: '#38bdf8',
                      fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer'
                    }}
                  >
                    <FaPlus size={10} /> Añadir Medicamento
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {medications.map((med, idx) => (
                    <div key={idx} style={{ padding: '0.75rem', borderRadius: '8px', background: dark ? '#1e1c25' : '#faf8f5', border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.50rem', position: 'relative' }}>
                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(idx)}
                          style={{ position: 'absolute', top: '0.35rem', right: '0.35rem', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                          title="Eliminar medicamento"
                        >
                          ✕
                        </button>
                      )}
                      <div style={{ gridColumn: 'span 2', paddingRight: '1rem' }}>
                        <input
                          required
                          type="text"
                          placeholder="Nombre comercial o genérico del medicamento"
                          value={med.name}
                          onChange={e => handleMedicationChange(idx, 'name', e.target.value)}
                          style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`, background: dark ? '#0c0b0f' : '#fff', color: dark ? '#fff' : '#1a1715', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <input
                          required
                          type="text"
                          placeholder="Dosis (ej: 500 mg)"
                          value={med.dose}
                          onChange={e => handleMedicationChange(idx, 'dose', e.target.value)}
                          style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`, background: dark ? '#0c0b0f' : '#fff', color: dark ? '#fff' : '#1a1715', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <input
                          required
                          type="text"
                          placeholder="Frecuencia (ej: cada 8 hrs)"
                          value={med.frequency}
                          onChange={e => handleMedicationChange(idx, 'frequency', e.target.value)}
                          style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`, background: dark ? '#0c0b0f' : '#fff', color: dark ? '#fff' : '#1a1715', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <input
                          required
                          type="text"
                          placeholder="Duración (ej: 7 días)"
                          value={med.duration}
                          onChange={e => handleMedicationChange(idx, 'duration', e.target.value)}
                          style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`, background: dark ? '#0c0b0f' : '#fff', color: dark ? '#fff' : '#1a1715', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <select
                          value={med.route}
                          onChange={e => handleMedicationChange(idx, 'route', e.target.value)}
                          style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`, background: dark ? '#0c0b0f' : '#fff', color: dark ? '#fff' : '#1a1715', fontSize: '0.85rem' }}
                        >
                          <option value="Oral">Vía Oral</option>
                          <option value="Cutánea">Vía Cutánea</option>
                          <option value="Sublingual">Vía Sublingual</option>
                          <option value="Inyectable">Vía Inyectable</option>
                          <option value="Inhalada">Vía Inhalada</option>
                          <option value="Oftálmica">Vía Oftálmica</option>
                          <option value="Ótica">Vía Ótica</option>
                        </select>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <input
                          type="text"
                          placeholder="Instrucciones adicionales (ej: después de los alimentos)"
                          value={med.instructions}
                          onChange={e => handleMedicationChange(idx, 'instructions', e.target.value)}
                          style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`, background: dark ? '#0c0b0f' : '#fff', color: dark ? '#fff' : '#1a1715', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Indicaciones Generales */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: dark ? '#7e7a8c' : '#a89580', marginBottom: '0.35rem' }}>Indicaciones Generales:</label>
                <textarea
                  placeholder="Dieta, reposo, cuidados o recomendaciones no farmacológicas..."
                  value={generalInstructions}
                  onChange={e => setGeneralInstructions(e.target.value)}
                  style={{ width: '100%', minHeight: '50px', padding: '0.55rem', borderRadius: '6px', border: `1.5px solid ${dark ? '#272530' : '#e8ddd0'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#1a1715', resize: 'vertical' }}
                />
              </div>

              {/* Fecha Vigencia */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: dark ? '#7e7a8c' : '#a89580', marginBottom: '0.35rem' }}>Vigencia de Receta (Opcional):</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={e => setValidUntil(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: `1.5px solid ${dark ? '#272530' : '#e8ddd0'}`, background: dark ? '#1e1c25' : '#fff', color: dark ? '#fff' : '#1a1715' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" disabled={actionLoading} style={{ flex: 1, padding: '0.7rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary-500)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
                  {actionLoading ? 'Registrando...' : 'Emitir Receta Certificada'}
                </button>
                <button type="button" onClick={() => { setShowPrescriptionModal(false); setSelectedAppt(null) }} style={{ padding: '0.7rem 1.25rem', borderRadius: '8px', border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`, background: 'transparent', color: dark ? '#fff' : '#1a1715', fontWeight: '600', cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    )
  }
