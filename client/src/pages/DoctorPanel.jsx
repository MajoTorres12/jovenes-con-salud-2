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
  FaTrash
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
  const [activeTab, setActiveTab] = useState('patients') // 'patients' or 'alerts'
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

  useEffect(() => {
    loadDashboardData()
    // 15 seconds polling to keep metrics fresh
    const interval = setInterval(loadDashboardData, 15000)
    return () => clearInterval(interval)
  }, [loadDashboardData])

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

              ) : (
                
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

              )}

            </div>
          )}

        </div>

      </main>

    </div>
  )
}
