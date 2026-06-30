import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  FaHeartbeat, FaArrowLeft, FaChartLine, FaExclamationTriangle,
  FaCheckCircle, FaWeight, FaTint, FaRunning, FaVial, FaFlask,
  FaFilePrescription, FaInfoCircle, FaChevronLeft
} from 'react-icons/fa'
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar, Legend, LineChart, Line
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'

const METRIC_CONFIGS = {
  weight: { label: 'Peso', icon: FaWeight, unit: 'kg', color: '#871233' },
  glucose: { label: 'Glucosa', icon: FaTint, unit: 'mg/dL', color: '#d97706' },
  bloodPressure: { label: 'Presión Arterial', icon: FaHeartbeat, unit: 'mmHg', color: '#dc2626' },
  heartRate: { label: 'Frec. Cardíaca', icon: FaRunning, unit: 'bpm', color: '#0d9488' },
  cholesterol: { label: 'Colesterol', icon: FaVial, unit: 'mg/dL', color: '#2563eb' },
  triglycerides: { label: 'Triglicéridos', icon: FaFlask, unit: 'mg/dL', color: '#7c3aed' },
}

export default function AdvancedAnalytics({ propUserId, propFamilyMemberId, familyMembers = [], isDoctorView = false }) {
  const { user } = useAuth()
  const { dark } = useTheme()
  const [searchParams] = useSearchParams()

  // Determine user context (props or query parameters or logged-in user)
  const userId = propUserId || searchParams.get('userId') || user?.id
  
  // Local state for the selected member ID
  const [selectedMemberId, setSelectedMemberId] = useState(() => {
    const fromParam = propFamilyMemberId !== undefined 
      ? propFamilyMemberId 
      : (searchParams.get('familyMemberId') || null)
    return fromParam === 'main' ? null : fromParam
  })

  // List of family members to display in the selector bar
  const [localFamilyMembers, setLocalFamilyMembers] = useState([])
  
  // Sync prop changes
  useEffect(() => {
    if (propFamilyMemberId !== undefined) {
      setSelectedMemberId(propFamilyMemberId === 'main' ? null : propFamilyMemberId)
    }
  }, [propFamilyMemberId])

  useEffect(() => {
    if (isDoctorView) {
      setLocalFamilyMembers(familyMembers || [])
    } else {
      api.get('/family')
        .then(res => setLocalFamilyMembers(res.data.members || []))
        .catch(err => console.error('Error loading family members:', err))
    }
  }, [isDoctorView, familyMembers])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Data States
  const [summary, setSummary] = useState(null)
  const [predictions, setPredictions] = useState(null)
  const [trends, setTrends] = useState([])
  const [trendMetric, setTrendMetric] = useState('glucose')

  // Calculate compliance locally based on medications listed
  const fetchComplianceAndAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch medications list to calculate local today compliance
      const medParams = {}
      if (userId) medParams.userId = userId
      if (selectedMemberId) medParams.familyMemberId = selectedMemberId

      const medsRes = await api.get('/medications', { params: medParams })
      const medicationsList = medsRes.data.medications || []

      // 2. Local compliance logic matching user checks in Navbar today
      const todayKey = new Date().toISOString().split('T')[0]
      let completedDoses = []
      try {
        const stored = localStorage.getItem('jcs_meds_taken_' + todayKey)
        if (stored) {
          completedDoses = JSON.parse(stored)
        }
      } catch (e) {
        console.error('Error parsing meds taken from localStorage', e)
      }

      let totalScheduled = 0
      let totalTaken = 0
      medicationsList.forEach(med => {
        if (med.schedules && Array.isArray(med.schedules)) {
          med.schedules.forEach(time => {
            totalScheduled++
            const key = `${med.id}_${time}`
            if (completedDoses.includes(key)) {
              totalTaken++
            }
          })
        }
      })
      const computedCompliance = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 100

      // 3. Fetch summary, predictions, and trend metrics from backend
      const queryParams = { compliance: computedCompliance }
      if (userId) queryParams.userId = userId
      if (selectedMemberId) {
        queryParams.familyMemberId = selectedMemberId
      }

      const [summaryRes, predictionsRes, trendsRes] = await Promise.all([
        api.get('/analytics/summary', { params: queryParams }),
        api.get('/analytics/predictions', { params: queryParams }),
        api.get('/analytics/trends', { params: { ...queryParams, type: trendMetric } })
      ])

      setSummary(summaryRes.data)
      setPredictions(predictionsRes.data)
      setTrends(trendsRes.data.trends || [])
    } catch (err) {
      console.error('Error fetching analytics data:', err)
      setError(err.response?.data?.error || 'Error al cargar el panel de estadísticas avanzadas. Asegúrate de tener registros de salud.')
    } finally {
      setLoading(false)
    }
  }, [userId, selectedMemberId, trendMetric])

  useEffect(() => {
    fetchComplianceAndAnalytics()
  }, [fetchComplianceAndAnalytics])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--color-primary-200)', borderTopColor: 'var(--color-primary-500)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: dark ? '#a89580' : '#7d6e5e', fontWeight: '600', fontSize: '0.9rem' }}>Analizando horizontes de salud...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2.5rem 1.5rem', maxWidth: '800px', margin: '2rem auto', background: dark ? '#1e1c25' : '#fef2f2', borderRadius: '16px', border: `1px solid ${dark ? '#272530' : '#fecaca'}`, textAlign: 'center' }}>
        <FaExclamationTriangle size={42} style={{ color: '#ef4444', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', marginBottom: '0.5rem' }}>No se pudieron generar analíticas</h3>
        <p style={{ color: dark ? '#a89580' : '#7d6e5e', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          {!isDoctorView && (
            <Link to="/dashboard" style={{ padding: '0.6rem 1.25rem', background: dark ? '#272530' : '#fff', color: dark ? '#fff' : '#1a1715', border: `1px solid ${dark ? '#3a3845' : '#d4c4b0'}`, borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '0.85rem' }}>
              Volver al Panel
            </Link>
          )}
          <button onClick={fetchComplianceAndAnalytics} style={{ padding: '0.6rem 1.25rem', background: 'var(--color-primary-500)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const { score, breakdown } = summary || { score: 100, breakdown: { vitalSigns: 100, compliance: 100, alerts: 100 } }
  const { cardiovascularRisk, predictions: projected, recommendations } = predictions || { cardiovascularRisk: {}, predictions: {}, recommendations: [] }

  // Custom styling elements based on mode
  const bgCard = dark ? '#141319' : '#ffffff'
  const borderCard = dark ? '1px solid #1e1c25' : '1px solid #e8ddd0'
  const textTitle = dark ? '#ffffff' : '#1a1715'
  const textMuted = dark ? '#a89580' : '#7d6e5e'

  // Score status colors
  let scoreColor = '#10b981' // Green
  let scoreText = 'Excelente'
  if (score < 60) {
    scoreColor = '#ef4444' // Red
    scoreText = 'Requiere Atención'
  } else if (score < 85) {
    scoreColor = '#f59e0b' // Yellow
    scoreText = 'Aceptable'
  }

  return (
    <div style={{ padding: isDoctorView ? '0' : '2rem 1.5rem', maxWidth: '1280px', margin: '0 auto', background: isDoctorView ? 'transparent' : (dark ? '#0c0b0f' : '#f8fafc'), minHeight: '100vh' }}>
      
      {/* Header section (Hide in doctor panel since it has its own headers) */}
      {!isDoctorView && (
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '12px', background: dark ? '#1e1c25' : '#ffffff', color: dark ? '#fff' : '#1a1715', border: borderCard, textDecoration: 'none' }} title="Volver al Dashboard">
              <FaChevronLeft />
            </Link>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: textTitle, margin: 0 }}>Estadísticas y Métricas de Salud</h1>
              <p style={{ fontSize: '0.85rem', color: textMuted, margin: '2px 0 0' }}>Análisis completo del estado de salud pasado, actual y futuro</p>
            </div>
          </div>
        </div>
      )}

      {/* Family selector tabs */}
      {localFamilyMembers.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem',
          marginBottom: '1.5rem',
          background: dark ? '#141319' : '#f1ede6',
          border: borderCard,
          borderRadius: '14px',
          overflowX: 'auto',
        }}>
          <button
            onClick={() => setSelectedMemberId(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1.1rem', borderRadius: '10px', border: 'none',
              background: !selectedMemberId
                ? 'linear-gradient(135deg, var(--color-success), #047857)'
                : 'transparent',
              color: !selectedMemberId ? 'white' : textMuted,
              fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            <FaChartLine size={12} />
            {isDoctorView ? 'Paciente Principal' : 'Tú'}
          </button>
          {localFamilyMembers.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMemberId(m.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.55rem 1.1rem', borderRadius: '10px', border: 'none',
                background: selectedMemberId === m.id
                  ? 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-600))'
                  : 'transparent',
                color: selectedMemberId === m.id ? 'white' : textMuted,
                fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
            >
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%',
                background: selectedMemberId === m.id ? 'rgba(255,255,255,0.25)' : (dark ? '#22202a' : '#e8ddd0'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.6rem', fontWeight: '800', color: selectedMemberId === m.id ? 'white' : textMuted,
              }}>
                {m.name?.charAt(0)?.toUpperCase()}
              </div>
              {m.name?.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', lg: 'repeat(12, 1fr)', gap: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        
        {/* ROW 1: SCORE ACTUAL & CARDIOVASCULAR RISK */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          
          {/* Integrated Health Score Gauge Card */}
          <div style={{ background: bgCard, border: borderCard, borderRadius: '18px', padding: '1.5rem', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ alignSelf: 'flex-start', width: '100%' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Métrica Actual</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: textTitle, margin: '4px 0 0' }}>Índice de Salud Integrado</h3>
              <p style={{ fontSize: '0.78rem', color: textMuted, margin: '2px 0 12px' }}>Combina signos vitales, alertas y apego a tratamiento</p>
            </div>

            {/* Premium circular gauge progress */}
            <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0' }}>
              <svg width="160" height="160" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="40" stroke={dark ? '#22202a' : '#f3ede4'} strokeWidth="8" fill="transparent" />
                <circle cx="50" cy="50" r="40" stroke={scoreColor} strokeWidth="8" fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: '900', color: textTitle, lineHeight: 1 }}>{score}</span>
                <span style={{ fontSize: '0.68rem', fontWeight: '800', color: scoreColor, textTransform: 'uppercase', marginTop: '4px' }}>{scoreText}</span>
              </div>
            </div>

            {/* Score Breakdown Bars */}
            <div style={{ width: '100%', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { name: 'Signos Vitales (50%)', val: breakdown.vitalSigns, color: '#3b82f6' },
                { name: 'Apego a Tratamiento (30%)', val: breakdown.compliance, color: '#10b981' },
                { name: 'Control de Alertas (20%)', val: breakdown.alerts, color: '#f59e0b' }
              ].map((item, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', fontWeight: '700', marginBottom: '2px' }}>
                    <span style={{ color: textTitle }}>{item.name}</span>
                    <span style={{ color: item.color }}>{item.val}%</span>
                  </div>
                  <div style={{ height: '6px', background: dark ? '#22202a' : '#f1ede6', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${item.val}%`, background: item.color, borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Framingham 10-Year Cardiovascular Risk Score */}
          <div style={{ background: bgCard, border: borderCard, borderRadius: '18px', padding: '1.5rem', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Horizonte Futuro</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: textTitle, margin: '4px 0 0' }}>Riesgo Cardiovascular a 10 Años</h3>
              <p style={{ fontSize: '0.78rem', color: textMuted, margin: '2px 0 12px' }}>Cálculo basado en el Algoritmo Framingham</p>
            </div>

            {cardiovascularRisk && cardiovascularRisk.percent != null ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2.8rem', fontWeight: '900', color: cardiovascularRisk.category === 'Alto' ? '#ef4444' : cardiovascularRisk.category === 'Moderado' ? '#f59e0b' : '#10b981', lineHeight: 1 }}>
                    {cardiovascularRisk.percent}%
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: textMuted }}>de probabilidad de evento cardiaco</span>
                </div>

                {/* Risk Bar Gauge */}
                <div>
                  <div style={{ height: '12px', background: 'linear-gradient(to right, #10b981, #f59e0b, #ef4444)', borderRadius: '6px', position: 'relative', overflow: 'visible', margin: '0.5rem 0 1.25rem' }}>
                    {/* Indicator pin */}
                    <div style={{
                      position: 'absolute', top: '-4px', left: `calc(${Math.min(100, (cardiovascularRisk.percent / 30) * 100)}% - 6px)`,
                      width: '12px', height: '20px', background: textTitle, border: `2px solid ${bgCard}`, borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: '800', color: textMuted }}>
                    <span>BAJO (0-9%)</span>
                    <span>MODERADO (10-19%)</span>
                    <span>ALTO (20%+)</span>
                  </div>
                </div>

                <div style={{ padding: '0.85rem', background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: '12px', borderLeft: `4px solid ${cardiovascularRisk.category === 'Alto' ? '#ef4444' : cardiovascularRisk.category === 'Moderado' ? '#f59e0b' : '#10b981'}` }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: textTitle, textTransform: 'uppercase', marginBottom: '2px' }}>Categoría de Riesgo: {cardiovascularRisk.category}</span>
                  <p style={{ fontSize: '0.75rem', color: textMuted, margin: 0, lineHeight: 1.4 }}>{cardiovascularRisk.advice}</p>
                </div>
                
                {/* Inputs Debug List */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.68rem', fontWeight: '700', color: textMuted }}>
                  <span>Edad: {cardiovascularRisk.inputs?.age} años</span>
                  <span>Género: {cardiovascularRisk.inputs?.gender === 'male' ? 'Masculino' : 'Femenino'}</span>
                  <span>Presión Art: {cardiovascularRisk.inputs?.sysBP} mmHg</span>
                  <span>Colesterol: {cardiovascularRisk.inputs?.totalChol} mg/dL</span>
                </div>
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: textMuted }}>
                Faltan datos de perfil para calcular el riesgo cardiovascular.
              </div>
            )}
          </div>

        </div>

        {/* ROW 2: PREDICCIONES Y REGRESIÓN DE TENDENCIAS */}
        <div style={{ background: bgCard, border: borderCard, borderRadius: '18px', padding: '1.5rem', boxShadow: 'var(--shadow-card)' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Horizonte Futuro</span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: textTitle, margin: '4px 0 0' }}>Proyecciones y Tendencias Avanzadas (Regresión Lineal)</h3>
            <p style={{ fontSize: '0.78rem', color: textMuted, margin: '2px 0 1.25rem' }}>Análisis estadístico predictivo a 30 días basado en los últimos 6 meses</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {Object.keys(METRIC_CONFIGS).map(type => {
              const pred = projected?.[type]
              const config = METRIC_CONFIGS[type]
              if (!pred) return null

              return (
                <div key={type} style={{ padding: '1.25rem', borderRadius: '14px', background: dark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)', border: dark ? '1px solid #1e1c25' : '1px solid #faf8f5', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <config.icon style={{ color: config.color, fontSize: '1.2rem' }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: '800', color: textTitle }}>Tendencia de {config.label}</span>
                    </div>
                    {pred.status === 'success' && (
                      <span style={{
                        fontSize: '0.68rem', fontWeight: '800', padding: '2px 8px', borderRadius: '20px',
                        background: pred.slope <= 0 ? '#10b98120' : '#f59e0b20',
                        color: pred.slope <= 0 ? '#10b981' : '#f59e0b'
                      }}>
                        {pred.slope <= 0 ? 'Estable / Bajando' : 'Incrementando'}
                      </span>
                    )}
                  </div>

                  {pred.status === 'success' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div style={{ padding: '0.6rem', borderRadius: '8px', background: bgCard, border: borderCard }}>
                          <span style={{ display: 'block', fontSize: '0.62rem', fontWeight: '800', color: textMuted, textTransform: 'uppercase' }}>Valor Actual</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: '900', color: textTitle }}>{pred.currentValue} <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>{config.unit}</span></span>
                        </div>
                        <div style={{ padding: '0.6rem', borderRadius: '8px', background: bgCard, border: borderCard }}>
                          <span style={{ display: 'block', fontSize: '0.62rem', fontWeight: '800', color: textMuted, textTransform: 'uppercase' }}>Proyección 30 Días</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: '900', color: config.color }}>{pred.projectedValue30Days} <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>{config.unit}</span></span>
                        </div>
                      </div>

                      {/* Small inline chart showing line slope projection */}
                      <div style={{ width: '100%', height: '110px', marginTop: '0.5rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={[
                            ...pred.points.map(p => ({ day: p.days, valor: p.value })),
                            { day: pred.points[pred.points.length - 1].days + 30, valor: pred.projectedValue30Days, isProjected: true }
                          ]}>
                            <defs>
                              <linearGradient id={`grad-${type}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={config.color} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={config.color} stopOpacity={0.0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#22202a' : '#f1ede6'} />
                            <Tooltip contentStyle={{ background: bgCard, borderColor: dark ? '#1e1c25' : '#e8ddd0', color: textTitle }} />
                            <Area type="monotone" dataKey="valor" stroke={config.color} strokeWidth={2} fill={`url(#grad-${type})`} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      <p style={{ fontSize: '0.7rem', color: textMuted, margin: 0, fontStyle: 'italic', lineHeight: 1.4 }}>
                        Cambio estimado: <strong>{(pred.slopePerMonth).toFixed(2)} {config.unit}</strong> por mes. Ecuación: Y = {(pred.slope).toFixed(3)}*X + {(pred.currentValue - pred.slope * pred.points[pred.points.length - 1].days).toFixed(1)}.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '1rem', border: `1px dashed ${dark ? '#272530' : '#e8ddd0'}`, borderRadius: '10px', textAlign: 'center', minHeight: '120px' }}>
                      <FaInfoCircle size={20} style={{ color: textMuted, marginBottom: '0.4rem' }} />
                      <p style={{ fontSize: '0.72rem', color: textMuted, margin: 0, lineHeight: 1.4 }}>
                        {pred.message || 'Datos insuficientes para proyectar.'}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ROW 3: ANÁLISIS PASADO (TENDENCIAS HISTÓRICAS) */}
        <div style={{ background: bgCard, border: borderCard, borderRadius: '18px', padding: '1.5rem', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Horizonte Pasado</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: textTitle, margin: '4px 0 0' }}>Análisis Histórico y Promedios Mensuales</h3>
              <p style={{ fontSize: '0.78rem', color: textMuted, margin: '2px 0 0' }}>Evolución a 12 meses agrupada por promedios mensuales</p>
            </div>

            {/* Metric selector pill bar */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {Object.keys(METRIC_CONFIGS).map(key => {
                const isSelected = trendMetric === key
                const conf = METRIC_CONFIGS[key]
                return (
                  <button
                    key={key}
                    onClick={() => setTrendMetric(key)}
                    style={{
                      padding: '0.35rem 0.75rem', borderRadius: '8px', border: 'none',
                      background: isSelected ? conf.color : (dark ? '#1e1c25' : '#faf8f5'),
                      color: isSelected ? 'white' : textMuted,
                      fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: isSelected ? `1px solid ${conf.color}` : borderCard
                    }}
                  >
                    {conf.label}
                  </button>
                )
              })}
            </div>
          </div>

          {trends.length === 0 ? (
            <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${dark ? '#1e1c25' : '#e8ddd0'}`, borderRadius: '12px' }}>
              <p style={{ fontSize: '0.85rem', color: textMuted, margin: 0 }}>Sin registros históricos en los últimos 12 meses para esta métrica.</p>
            </div>
          ) : (
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#22202a' : '#f1ede6'} />
                  <XAxis dataKey="label" stroke={textMuted} style={{ fontSize: '0.72rem', fontWeight: '600' }} />
                  <YAxis stroke={textMuted} style={{ fontSize: '0.72rem', fontWeight: '600' }} />
                  <Tooltip contentStyle={{ background: bgCard, borderColor: dark ? '#1e1c25' : '#e8ddd0', color: textTitle }} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.75rem', fontWeight: '700' }} />
                  <Bar dataKey="value" fill={METRIC_CONFIGS[trendMetric].color} radius={[4, 4, 0, 0]} name={`Promedio de ${METRIC_CONFIGS[trendMetric].label} (${METRIC_CONFIGS[trendMetric].unit})`} />
                  {trendMetric === 'bloodPressure' && (
                    <Bar dataKey="value2" fill="#ef4444" radius={[4, 4, 0, 0]} name="Promedio Diastólica (mmHg)" />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ROW 4: RECOMENDACIONES PREVENTIVAS PERSONALIZADAS */}
        <div style={{ background: bgCard, border: borderCard, borderRadius: '18px', padding: '1.5rem', boxShadow: 'var(--shadow-card)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: textTitle, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaCheckCircle style={{ color: '#10b981' }} /> Recomendaciones Preventivas Personalizadas
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {recommendations && recommendations.map((rec, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1.25rem', borderRadius: '14px',
                  background: rec.type === 'warning'
                    ? (dark ? 'rgba(245,158,11,0.06)' : '#fffbeb')
                    : (dark ? 'rgba(16,185,129,0.06)' : '#f0fdf4'),
                  border: `1px solid ${rec.type === 'warning' ? (dark ? '#5f3e07' : '#fef3c7') : (dark ? '#064e3b' : '#dcfce7')}`,
                  display: 'flex', gap: '0.75rem', alignItems: 'flex-start'
                }}
              >
                <div style={{ fontSize: '1.25rem', color: rec.type === 'warning' ? '#d97706' : '#10b981', flexShrink: 0 }}>
                  {rec.type === 'warning' ? <FaExclamationTriangle /> : <FaCheckCircle />}
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: textTitle, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{rec.title}</h4>
                  <p style={{ fontSize: '0.78rem', color: textMuted, margin: 0, lineHeight: 1.45 }}>{rec.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
