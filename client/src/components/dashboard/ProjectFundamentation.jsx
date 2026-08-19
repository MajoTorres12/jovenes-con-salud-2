import { useState, useEffect } from 'react'
import {
  FaUsers,
  FaWifi,
  FaMobileAlt,
  FaRocket,
  FaHeartbeat,
  FaMapMarkedAlt,
  FaChartLine,
  FaLightbulb,
  FaPlus,
  FaCopy,
  FaCheck,
  FaTrash,
  FaCity,
  FaClock,
  FaFileAlt,
  FaLayerGroup,
  FaExpand,
  FaTimes,
  FaDownload,
  FaArrowLeft,
  FaArrowRight,
  FaTree,
  FaSearchPlus
} from 'react-icons/fa'
import { useTheme } from '../../context/ThemeContext'

const STORAGE_KEY = 'jcs_admin_custom_dashboards'

const DIAGRAMS = [
  {
    id: 'problemas',
    title: 'Árbol de Problemas: Diagnóstico Causal y Efectos',
    subtitle: 'Metodología del Marco Lógico • Problemática Central, Causas Raíz y Efectos en la Salud Juvenil',
    badge: 'Diagnóstico Causal',
    src: '/images/arbol_problemas.png',
    description: 'Estructura analítica que desglosa el problema central (limitado acceso a servicios médicos preventivos y monitoreo fisiológico en jóvenes de Tamaulipas), sus causas directas/indirectas y la cadena de efectos sobre la calidad de vida y el sistema de salud estatal.'
  },
  {
    id: 'objetivos',
    title: 'Árbol de Objetivos: Medios y Fines Estratégicos',
    subtitle: 'Metodología del Marco Lógico • Alineado con el Plan Estatal de Desarrollo de Tamaulipas y ODS 3',
    badge: 'Alineación Estratégica',
    src: '/images/arbol_objetivos.png',
    description: 'Transformación de los problemas en objetivos estratégicos positivos: Provisión de herramientas digitales, eliminación de barreras geográficas/institucionales y creación del expediente clínico universal para elevar la productividad y bienestar de la juventud tamaulipeca.'
  }
]

export default function ProjectFundamentation() {
  const { dark } = useTheme()
  const [selectedDashboard, setSelectedDashboard] = useState('general')
  const [customDashboards, setCustomDashboards] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [copiedToast, setCopiedToast] = useState(false)
  const [activeAdoptionScenario, setActiveAdoptionScenario] = useState('moderado')
  const [activeRegion, setActiveRegion] = useState('norte')

  // Lightbox Modal State
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null)

  // Form for new dashboard
  const [newDashTitle, setNewDashTitle] = useState('')
  const [newDashDesc, setNewDashDesc] = useState('')
  const [newDashTarget, setNewDashTarget] = useState('')
  const [newDashNotes, setNewDashNotes] = useState('')

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeLightboxIndex === null) return
      if (e.key === 'Escape') {
        setActiveLightboxIndex(null)
      } else if (e.key === 'ArrowRight') {
        setActiveLightboxIndex(prev => (prev === 0 ? 1 : 0))
      } else if (e.key === 'ArrowLeft') {
        setActiveLightboxIndex(prev => (prev === 1 ? 0 : 1))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeLightboxIndex])

  // Load custom dashboards from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setCustomDashboards(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Error loading custom dashboards:', e)
    }
  }, [])

  const saveCustomDashboards = (list) => {
    setCustomDashboards(list)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    } catch (e) {
      console.error('Error saving custom dashboards:', e)
    }
  }

  const handleCreateDashboard = (e) => {
    e.preventDefault()
    if (!newDashTitle.trim()) return

    const newDash = {
      id: `dash_${Date.now()}`,
      title: newDashTitle.trim(),
      description: newDashDesc.trim(),
      target: newDashTarget.trim() || 'Meta Estratégica 2026',
      notes: newDashNotes.trim(),
      createdAt: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }),
    }

    const updated = [...customDashboards, newDash]
    saveCustomDashboards(updated)
    setSelectedDashboard(newDash.id)
    setNewDashTitle('')
    setNewDashDesc('')
    setNewDashTarget('')
    setNewDashNotes('')
    setShowCreateModal(false)
  }

  const handleDeleteDashboard = (id, e) => {
    e.stopPropagation()
    if (!window.confirm('¿Deseas eliminar este dashboard personalizado?')) return
    const updated = customDashboards.filter(d => d.id !== id)
    saveCustomDashboards(updated)
    if (selectedDashboard === id) {
      setSelectedDashboard('general')
    }
  }

  const handleCopySummary = () => {
    const summaryText = `
📊 FUNDAMENTACIÓN ESTRATÉGICA DEL PROYECTO: JÓVENES CON SALUD
Gobierno del Estado de Tamaulipas — Instituto de la Juventud de Tamaulipas (IJT)

📌 1. DEMOGRAFÍA GENERAL (INEGI)
• Población Total: 3,527,735 habitantes.
• Distribución: 50.8% Mujeres | 49.2% Hombres.
• Edad Mediana: 30 años.
• Población Urbana: 87.8% (Alta concentración en ciudades principales).
• Población Joven (12-29 años): 1,028,023 personas (29.1% del total estatal).

🌐 2. CONECTIVIDAD E INCLUSIÓN DIGITAL (ENDUTIH)
• Usuarios de Internet (6+ años): 87.7% (2.87 millones de personas).
• Acceso desde el Hogar: 97.8% de los usuarios.
• Penetración Smartphone en Jóvenes: +95.0%.
• Horas diarias en internet:
  - 18 a 24 años: 5.7 - 5.9 hrs/día.
  - 25 a 34 años: 5.6 hrs/día.
  - 12 a 17 años: 4.5 - 4.7 hrs/día.

🚀 3. ALCANCE Y EFECTO MULTIPLICADOR FAMILIAR
• Beneficiarios Directos: 976,622 jóvenes (27.7% de la población).
• Beneficiarios Indirectos: 2,246,230 familiares (63.6% de la población).
• Alcance Potencial Total: 3,222,852 personas (91.3% de cobertura combinada).
• Factor Multiplicador Familiar: 2.26x (Por cada joven usuario, se beneficia a 1.8 familiares adicionales en el hogar).

⚠️ 4. NECESIDAD EPIDEMIOLÓGICA (ENSANUT)
• Sobrepeso y Obesidad en Adultos (20+ años): 75.0%.
• Sobrepeso y Obesidad en Adolescentes (12-17 años): 40.0%.
• Hipertensión Arterial en Adultos: 30.0%.
• Diabetes Mellitus Tipo 2 en Adultos: 18.3%.
• Causas #1 de Mortalidad Estatal: Enfermedades del corazón y Diabetes Mellitus.

🗺️ 5. REGIONES Y MUNICIPIOS CLAVE
• Zona Fronteriza Norte (51.1% población): Reynosa (704k), Matamoros (541k), Nuevo Laredo (425k).
• Zona Sur Metropolitana (21.8% población): Tampico, Altamira y Cd. Madero (773k conjunto).
• Región Centro: Ciudad Victoria (349k).

📊 6. ESCENARIOS DE ADOPCIÓN (3 AÑOS)
• Conservador (5%): 122,078 personas (3.5% estatal).
• Moderado (15%): 410,180 personas (11.6% estatal).
• Optimista (30%): 937,558 personas (26.6% estatal).
    `.trim()

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopiedToast(true)
      setTimeout(() => setCopiedToast(false), 3500)
    })
  }

  // Predefined dashboard views
  const standardDashboards = [
    { id: 'general', label: 'Diagnóstico Integral Tamaulipas', icon: FaLayerGroup, badge: 'Completo (6 Tarjetas)' },
    { id: 'digital', label: 'Inclusión & Multiplicador', icon: FaRocket, badge: 'Conectividad & Familias' },
    { id: 'epidemiology', label: 'Prioridad Epidemiológica', icon: FaHeartbeat, badge: 'Salud & Factores de Riesgo' },
    { id: 'territory', label: 'Despliegue Territorial', icon: FaMapMarkedAlt, badge: 'Municipios Clave' },
  ]

  const currentCustomDash = customDashboards.find(d => d.id === selectedDashboard)

  // Style tokens based on dark mode
  const cardBg = dark ? 'var(--color-surface-100)' : 'white'
  const cardBorder = dark ? '1px solid var(--color-surface-300)' : '1px solid var(--color-surface-200)'
  const innerBg = dark ? 'var(--color-surface-200)' : 'var(--color-surface-50)'
  const innerBorder = dark ? '1px solid var(--color-surface-300)' : '1px solid var(--color-surface-200)'
  const headingColor = dark ? '#ffffff' : 'var(--color-surface-900)'
  const textColor = dark ? 'var(--color-surface-600)' : 'var(--color-surface-600)'

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Banner Principal / Header */}
      <div style={{
        background: dark
          ? 'linear-gradient(135deg, #18080f 0%, #300614 60%, #1e1308 100%)'
          : 'linear-gradient(135deg, #750f2c 0%, #871233 60%, #9a7a4e 100%)',
        borderRadius: 'var(--radius-2xl)',
        padding: '2rem',
        color: 'white',
        marginBottom: '1.75rem',
        boxShadow: dark ? '0 10px 30px rgba(0,0,0,0.6)' : 'var(--shadow-elevated)',
        border: dark ? '1px solid rgba(224, 59, 96, 0.35)' : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow decoration */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          background: dark ? 'rgba(212, 169, 106, 0.15)' : 'rgba(194, 163, 120, 0.25)',
          filter: 'blur(45px)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '640px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: '700',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}>
              <span>🏛️ Panel Exclusivo de Administración</span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0 0 0.5rem', lineHeight: 1.2, color: 'white' }}>
              Fundamentación Estratégica del Proyecto
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.92)', margin: 0, lineHeight: 1.5 }}>
              Diagnóstico sociodemográfico, penetración tecnológica, necesidades epidemiológicas y modelo multiplicador familiar en el Estado de Tamaulipas (Fuentes: INEGI, ENSANUT, ENDUTIH).
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleCopySummary}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: dark ? 'var(--color-surface-200)' : 'white',
                color: dark ? 'var(--color-primary-500)' : 'var(--color-primary-800)',
                padding: '0.65rem 1.1rem',
                borderRadius: 'var(--radius-lg)',
                border: dark ? '1px solid rgba(224, 59, 96, 0.4)' : '1px solid rgba(135,18,51,0.15)',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {copiedToast ? <FaCheck style={{ color: '#10b981' }} /> : <FaCopy />}
              {copiedToast ? '¡Copiado!' : 'Copiar para Canva / Pitch'}
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: dark ? 'var(--color-primary-500)' : 'var(--color-accent-400)',
                color: dark ? 'white' : 'var(--color-primary-900)',
                padding: '0.65rem 1.1rem',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <FaPlus />
              Crear Nuevo Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Switcher Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        marginBottom: '1.5rem',
      }}>
        {standardDashboards.map(dash => {
          const Icon = dash.icon
          const isSelected = selectedDashboard === dash.id
          return (
            <button
              key={dash.id}
              onClick={() => setSelectedDashboard(dash.id)}
              style={{
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-xl)',
                border: isSelected
                  ? (dark ? '1.5px solid var(--color-primary-500)' : '2px solid var(--color-primary-500)')
                  : (dark ? '1px solid var(--color-surface-300)' : '1px solid var(--color-surface-200)'),
                background: isSelected
                  ? (dark ? 'rgba(224, 59, 96, 0.18)' : 'var(--color-primary-50)')
                  : (dark ? 'var(--color-surface-100)' : 'white'),
                color: isSelected
                  ? (dark ? '#ffffff' : 'var(--color-primary-700)')
                  : (dark ? 'var(--color-surface-500)' : 'var(--color-surface-600)'),
                fontWeight: isSelected ? '700' : '600',
                fontSize: '0.84rem',
                cursor: 'pointer',
                boxShadow: isSelected ? 'var(--shadow-card)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={14} color={isSelected ? (dark ? '#fca5b7' : 'var(--color-primary-600)') : (dark ? '#6b7280' : '#9ca3af')} />
              <span>{dash.label}</span>
              <span style={{
                fontSize: '0.7rem',
                background: isSelected
                  ? (dark ? 'rgba(224, 59, 96, 0.3)' : 'var(--color-primary-200)')
                  : (dark ? 'var(--color-surface-200)' : 'var(--color-surface-100)'),
                color: isSelected
                  ? (dark ? '#fca5b7' : 'var(--color-primary-800)')
                  : (dark ? 'var(--color-surface-500)' : 'var(--color-surface-500)'),
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: '700',
              }}>
                {dash.badge}
              </span>
            </button>
          )
        })}

        {/* Custom Dashboards rendered dynamically */}
        {customDashboards.map(custom => {
          const isSelected = selectedDashboard === custom.id
          return (
            <button
              key={custom.id}
              onClick={() => setSelectedDashboard(custom.id)}
              style={{
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-xl)',
                border: isSelected
                  ? (dark ? '1.5px solid var(--color-accent-500)' : '2px solid var(--color-accent-500)')
                  : (dark ? '1px dashed var(--color-surface-300)' : '1px dashed var(--color-accent-300)'),
                background: isSelected
                  ? (dark ? 'rgba(212, 169, 106, 0.18)' : 'var(--color-accent-50)')
                  : (dark ? 'var(--color-surface-100)' : 'white'),
                color: isSelected
                  ? (dark ? '#fde68a' : 'var(--color-accent-800)')
                  : (dark ? 'var(--color-surface-500)' : 'var(--color-surface-600)'),
                fontWeight: isSelected ? '700' : '600',
                fontSize: '0.84rem',
                cursor: 'pointer',
                boxShadow: isSelected ? 'var(--shadow-card)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <FaFileAlt size={13} color={dark ? '#d4a96a' : 'var(--color-accent-600)'} />
              <span>{custom.title}</span>
              <span
                onClick={(e) => handleDeleteDashboard(custom.id, e)}
                title="Eliminar dashboard personalizado"
                style={{
                  marginLeft: '0.25rem',
                  color: '#ef4444',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <FaTrash size={11} />
              </span>
            </button>
          )
        })}
      </div>

      {/* Render Custom Dashboard Content if selected */}
      {currentCustomDash ? (
        <div className="animate-fade-in" style={{
          background: cardBg,
          borderRadius: 'var(--radius-2xl)',
          padding: '2rem',
          boxShadow: 'var(--shadow-card)',
          border: cardBorder,
          marginBottom: '1.75rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: dark ? '1px solid var(--color-surface-300)' : '1px solid var(--color-surface-200)', paddingBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: dark ? '#d4a96a' : 'var(--color-accent-600)', letterSpacing: '0.05em' }}>
                Dashboard Personalizado • Creado el {currentCustomDash.createdAt}
              </span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: headingColor, margin: '0.35rem 0' }}>
                {currentCustomDash.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: textColor, margin: 0 }}>
                {currentCustomDash.description || 'Sin descripción adicional.'}
              </p>
            </div>
            <div style={{
              background: dark ? 'rgba(224, 59, 96, 0.2)' : 'var(--color-primary-50)',
              color: dark ? '#fca5b7' : 'var(--color-primary-700)',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: '700',
              border: dark ? '1px solid rgba(224, 59, 96, 0.4)' : '1px solid var(--color-primary-200)'
            }}>
              🎯 {currentCustomDash.target}
            </div>
          </div>

          <div style={{
            background: innerBg,
            borderRadius: 'var(--radius-xl)',
            padding: '1.5rem',
            border: innerBorder,
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: headingColor, marginTop: 0, marginBottom: '0.5rem' }}>
              Notas Estratégicas y Puntos Clave
            </h4>
            <p style={{ fontSize: '0.88rem', color: textColor, whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>
              {currentCustomDash.notes || 'No se han agregado notas para este dashboard aún.'}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              onClick={() => setSelectedDashboard('general')}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: 'var(--radius-lg)',
                border: dark ? '1px solid var(--color-surface-300)' : '1px solid var(--color-surface-300)',
                background: dark ? 'var(--color-surface-200)' : 'white',
                color: headingColor,
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Volver al Diagnóstico General
            </button>
          </div>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* 6 TARJETAS VISUALES CON INFORMACIÓN ESTRUCTURADA */}
      {/* ========================================================================= */}
      {(selectedDashboard === 'general' || selectedDashboard === 'digital') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* TARJETA 1: KPIs DEMOGRÁFICOS */}
          {(selectedDashboard === 'general') && (
            <div className="animate-fade-in" style={{
              background: cardBg,
              borderRadius: 'var(--radius-2xl)',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-card)',
              border: cardBorder,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: dark ? 'rgba(224, 59, 96, 0.2)' : 'var(--color-primary-50)',
                      color: dark ? '#fca5b7' : 'var(--color-primary-600)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
                    }}>
                      <FaUsers />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: dark ? '#fca5b7' : 'var(--color-primary-500)', letterSpacing: '0.04em' }}>
                        Tarjeta 1 • Demografía INEGI
                      </span>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: headingColor, margin: 0 }}>
                        KPIs Demográficos Generales
                      </h3>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    background: dark ? 'var(--color-surface-200)' : 'var(--color-surface-100)',
                    color: dark ? 'var(--color-surface-500)' : 'var(--color-surface-600)'
                  }}>
                    Tamaulipas
                  </span>
                </div>

                {/* Big Number KPI */}
                <div style={{
                  background: dark
                    ? 'linear-gradient(135deg, var(--color-surface-200) 0%, rgba(224, 59, 96, 0.12) 100%)'
                    : 'linear-gradient(135deg, var(--color-surface-50) 0%, var(--color-primary-50) 100%)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-xl)',
                  border: dark ? '1px solid rgba(224, 59, 96, 0.25)' : '1px solid var(--color-primary-100)',
                  textAlign: 'center',
                  marginBottom: '1.25rem',
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: textColor, textTransform: 'uppercase' }}>
                    Población Total del Estado
                  </span>
                  <div style={{ fontSize: '2.4rem', fontWeight: '900', color: dark ? '#ffffff' : 'var(--color-primary-700)', lineHeight: 1.1, margin: '0.25rem 0' }}>
                    3,527,735
                  </div>
                  <span style={{ fontSize: '0.8rem', color: textColor }}>
                    Habitantes en los 43 municipios
                  </span>
                </div>

                {/* Demographic Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ background: innerBg, padding: '0.85rem', borderRadius: 'var(--radius-lg)', border: innerBorder }}>
                    <span style={{ fontSize: '0.74rem', color: textColor, display: 'block' }}>Población Joven (12-29)</span>
                    <strong style={{ fontSize: '1.2rem', color: headingColor }}>1,028,023</strong>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: dark ? '#fca5b7' : 'var(--color-primary-600)', display: 'block' }}>29.1% del estado</span>
                  </div>

                  <div style={{ background: innerBg, padding: '0.85rem', borderRadius: 'var(--radius-lg)', border: innerBorder }}>
                    <span style={{ fontSize: '0.74rem', color: textColor, display: 'block' }}>Edad Mediana</span>
                    <strong style={{ fontSize: '1.2rem', color: headingColor }}>30 Años</strong>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: dark ? '#d4a96a' : 'var(--color-accent-700)', display: 'block' }}>Bono Demográfico</span>
                  </div>
                </div>

                {/* Proportions & Urban Population */}
                <div style={{ fontSize: '0.82rem', color: textColor, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontWeight: '600' }}>
                      <span>Distribución por Sexo:</span>
                      <span style={{ color: headingColor }}>50.8% Mujeres • 49.2% Hombres</span>
                    </div>
                    <div style={{ height: '8px', width: '100%', background: dark ? 'var(--color-surface-300)' : '#3b82f630', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: '50.8%', background: '#ec4899' }} title="50.8% Mujeres" />
                      <div style={{ width: '49.2%', background: '#3b82f6' }} title="49.2% Hombres" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: innerBg, padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: innerBorder }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}>
                      <FaCity color={dark ? '#fca5b7' : 'var(--color-primary-600)'} /> Población Urbana:
                    </span>
                    <strong style={{ color: headingColor }}>87.8% (Alta concentración)</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TARJETA 2: CONECTIVIDAD E INCLUSIÓN DIGITAL */}
          <div className="animate-fade-in" style={{
            background: cardBg,
            borderRadius: 'var(--radius-2xl)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-card)',
            border: cardBorder,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: dark ? 'rgba(59, 130, 246, 0.2)' : '#3b82f615',
                    color: dark ? '#60a5fa' : '#2563eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
                  }}>
                    <FaWifi />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: dark ? '#60a5fa' : '#2563eb', letterSpacing: '0.04em' }}>
                      Tarjeta 2 • Adopción ENDUTIH
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: headingColor, margin: 0 }}>
                      Conectividad e Inclusión Digital
                    </h3>
                  </div>
                </div>
                <span style={{
                  fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  background: dark ? 'rgba(59, 130, 246, 0.2)' : '#2563eb15',
                  color: dark ? '#60a5fa' : '#2563eb'
                }}>
                  Alta Adopción
                </span>
              </div>

              {/* Donut Chart Visual representation for Internet connectivity */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                background: innerBg,
                padding: '1.1rem',
                borderRadius: 'var(--radius-xl)',
                border: innerBorder,
                marginBottom: '1rem'
              }}>
                {/* SVG Donut */}
                <div style={{ position: 'relative', width: '84px', height: '84px', flexShrink: 0 }}>
                  <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={dark ? 'var(--color-surface-300)' : '#e5e7eb'}
                      strokeWidth="4"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="4"
                      strokeDasharray="87.7, 100"
                    />
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem',
                    color: dark ? '#60a5fa' : '#1e40af'
                  }}>
                    87.7%
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 0.2rem', fontSize: '0.92rem', fontWeight: '800', color: headingColor }}>
                    Usuarios de Internet (6+ años)
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: textColor, lineHeight: 1.4 }}>
                    <strong style={{ color: headingColor }}>2.87 millones de personas</strong> conectadas. 97.8% tienen acceso desde su propio hogar.
                  </p>
                </div>
              </div>

              {/* Smartphone metric */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-lg)',
                background: dark ? 'rgba(16, 185, 129, 0.12)' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.02))',
                border: dark ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(16, 185, 129, 0.25)',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaMobileAlt size={18} color={dark ? '#34d399' : '#059669'} />
                  <div>
                    <strong style={{ fontSize: '0.84rem', color: dark ? '#6ee7b7' : '#065f46', display: 'block' }}>Uso de Smartphone en Jóvenes</strong>
                    <span style={{ fontSize: '0.72rem', color: dark ? '#34d399' : '#047857' }}>Penetración móvil casi total</span>
                  </div>
                </div>
                <span style={{ fontSize: '1.25rem', fontWeight: '900', color: dark ? '#34d399' : '#059669' }}>+95.0%</span>
              </div>

              {/* Daily time in internet */}
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: textColor, display: 'block', marginBottom: '0.4rem' }}>
                  <FaClock style={{ marginRight: '4px', verticalAlign: 'middle' }} /> TIEMPO DIARIO EN INTERNET (JÓVENES)
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: innerBg, padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)', border: innerBorder }}>
                    <span>18 a 24 años:</span>
                    <strong style={{ color: dark ? '#fca5b7' : 'var(--color-primary-700)' }}>5.7 - 5.9 horas / día</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: innerBg, padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)', border: innerBorder }}>
                    <span>25 a 34 años:</span>
                    <strong style={{ color: headingColor }}>5.6 horas / día</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: innerBg, padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)', border: innerBorder }}>
                    <span>12 a 17 años:</span>
                    <strong style={{ color: headingColor }}>4.5 - 4.7 horas / día</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TARJETA 3: ALCANCE DEL PROYECTO Y EFECTO MULTIPLICADOR (FUNNEL) */}
      {(selectedDashboard === 'general' || selectedDashboard === 'digital') && (
        <div className="animate-fade-in" style={{
          background: cardBg,
          borderRadius: 'var(--radius-2xl)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-card)',
          border: cardBorder,
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-500))', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
              }}>
                <FaRocket />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: dark ? '#fca5b7' : 'var(--color-primary-500)', letterSpacing: '0.04em' }}>
                  Tarjeta 3 • Modelo de Impacto Social
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: headingColor, margin: 0 }}>
                  Alcance del Proyecto y Efecto Multiplicador
                </h3>
              </div>
            </div>

            {/* Factor Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: dark ? 'rgba(245, 158, 11, 0.18)' : 'linear-gradient(135deg, #fef3c7, #fde68a)',
              color: dark ? '#fbbf24' : '#92400e',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: '800',
              fontSize: '0.85rem',
              border: dark ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid #fcd34d'
            }}>
              ⚡ Factor Multiplicador Familiar: 2.26x
            </div>
          </div>

          {/* Funnel Visual Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Step 1: Direct */}
            <div style={{
              background: dark
                ? 'linear-gradient(135deg, rgba(224, 59, 96, 0.14) 0%, var(--color-surface-200) 100%)'
                : 'linear-gradient(135deg, var(--color-primary-50), white)',
              border: dark ? '1.5px solid rgba(224, 59, 96, 0.4)' : '2px solid var(--color-primary-200)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem',
              position: 'relative'
            }}>
              <span style={{
                position: 'absolute', top: '-10px', right: '15px',
                background: dark ? 'var(--color-primary-500)' : 'var(--color-primary-600)', color: 'white',
                fontSize: '0.7rem', fontWeight: '800', padding: '0.15rem 0.6rem', borderRadius: 'var(--radius-full)'
              }}>
                CÚSPIDE DEL EMBUDO
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: dark ? '#fca5b7' : 'var(--color-primary-600)' }}>
                Beneficiarios Directos
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: '900', color: headingColor, margin: '0.2rem 0' }}>
                976,622
              </div>
              <div style={{
                display: 'inline-block',
                background: dark ? 'rgba(224, 59, 96, 0.25)' : 'var(--color-primary-100)',
                color: dark ? '#fca5b7' : 'var(--color-primary-800)',
                fontWeight: '700', fontSize: '0.8rem', padding: '0.1rem 0.5rem', borderRadius: '4px', marginBottom: '0.5rem'
              }}>
                27.7% de la población estatal
              </div>
              <p style={{ fontSize: '0.8rem', color: textColor, margin: 0, lineHeight: 1.4 }}>
                Jóvenes (12-29 años) digitalmente activos que interactúan y gestionan su salud directamente desde la app.
              </p>
            </div>

            {/* Step 2: Indirect */}
            <div style={{
              background: dark
                ? 'linear-gradient(135deg, rgba(212, 169, 106, 0.14) 0%, var(--color-surface-200) 100%)'
                : 'linear-gradient(135deg, var(--color-accent-50), white)',
              border: dark ? '1.5px solid rgba(212, 169, 106, 0.4)' : '2px solid var(--color-accent-300)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem',
              position: 'relative'
            }}>
              <span style={{
                position: 'absolute', top: '-10px', right: '15px',
                background: dark ? 'var(--color-accent-500)' : 'var(--color-accent-600)', color: dark ? '#1a1715' : 'white',
                fontSize: '0.7rem', fontWeight: '800', padding: '0.15rem 0.6rem', borderRadius: 'var(--radius-full)'
              }}>
                BASE MULTIPLICADORA
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: dark ? '#fde68a' : 'var(--color-accent-700)' }}>
                Beneficiarios Indirectos
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: '900', color: headingColor, margin: '0.2rem 0' }}>
                2,246,230
              </div>
              <div style={{
                display: 'inline-block',
                background: dark ? 'rgba(212, 169, 106, 0.25)' : 'var(--color-accent-200)',
                color: dark ? '#fde68a' : 'var(--color-accent-900)',
                fontWeight: '700', fontSize: '0.8rem', padding: '0.1rem 0.5rem', borderRadius: '4px', marginBottom: '0.5rem'
              }}>
                63.6% de la población estatal
              </div>
              <p style={{ fontSize: '0.8rem', color: textColor, margin: 0, lineHeight: 1.4 }}>
                Familiares (padres, abuelos, tutores) monitoreados y asistidos tecnológicamente por el joven en el hogar.
              </p>
            </div>

            {/* Step 3: Total Reach */}
            <div style={{
              background: dark
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, var(--color-surface-200) 100%)'
                : 'linear-gradient(135deg, #ecfdf5, white)',
              border: dark ? '1.5px solid rgba(16, 185, 129, 0.4)' : '2px solid #a7f3d0',
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem',
              position: 'relative'
            }}>
              <span style={{
                position: 'absolute', top: '-10px', right: '15px',
                background: '#059669', color: 'white',
                fontSize: '0.7rem', fontWeight: '800', padding: '0.15rem 0.6rem', borderRadius: 'var(--radius-full)'
              }}>
                COBERTURA TOTAL
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: dark ? '#6ee7b7' : '#047857' }}>
                Alcance Potencial Combinado
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: '900', color: headingColor, margin: '0.2rem 0' }}>
                3,222,852
              </div>
              <div style={{
                display: 'inline-block',
                background: dark ? 'rgba(16, 185, 129, 0.25)' : '#d1fae5',
                color: dark ? '#6ee7b7' : '#065f46',
                fontWeight: '700', fontSize: '0.8rem', padding: '0.1rem 0.5rem', borderRadius: '4px', marginBottom: '0.5rem'
              }}>
                91.3% Cobertura Familiar Estatal
              </div>
              <p style={{ fontSize: '0.8rem', color: textColor, margin: 0, lineHeight: 1.4 }}>
                Impacto social masivo e intergeneracional: Por cada joven, se beneficia a 1.8 familiares adicionales.
              </p>
            </div>
          </div>

          {/* Table summary */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: innerBg, color: dark ? '#e5dfef' : 'var(--color-surface-700)' }}>
                  <th style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)' }}>Clasificación del Impacto</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Cifra de Población</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>% Estatal</th>
                  <th style={{ padding: '0.65rem 0.85rem', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>Descripción Estratégica</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: innerBorder }}>
                  <td style={{ padding: '0.65rem 0.85rem', fontWeight: '700', color: dark ? '#fca5b7' : 'var(--color-primary-700)' }}>Beneficiarios Directos</td>
                  <td style={{ padding: '0.65rem 0.85rem', fontWeight: '700', color: headingColor }}>976,622</td>
                  <td style={{ padding: '0.65rem 0.85rem', color: headingColor }}>27.7%</td>
                  <td style={{ padding: '0.65rem 0.85rem', color: textColor }}>Jóvenes (12-29 años) con uso activo y autónomo de la aplicación.</td>
                </tr>
                <tr style={{ borderBottom: innerBorder }}>
                  <td style={{ padding: '0.65rem 0.85rem', fontWeight: '700', color: dark ? '#fde68a' : 'var(--color-accent-800)' }}>Beneficiarios Indirectos</td>
                  <td style={{ padding: '0.65rem 0.85rem', fontWeight: '700', color: headingColor }}>2,246,230</td>
                  <td style={{ padding: '0.65rem 0.85rem', color: headingColor }}>63.6%</td>
                  <td style={{ padding: '0.65rem 0.85rem', color: textColor }}>Familiares (padres, abuelos) asistidos mediante el módulo de Núcleo Familiar.</td>
                </tr>
                <tr style={{ background: dark ? 'rgba(16, 185, 129, 0.08)' : 'var(--color-surface-50)' }}>
                  <td style={{ padding: '0.65rem 0.85rem', fontWeight: '800', color: dark ? '#34d399' : '#059669' }}>Alcance Potencial Total</td>
                  <td style={{ padding: '0.65rem 0.85rem', fontWeight: '800', color: dark ? '#34d399' : '#059669' }}>3,222,852</td>
                  <td style={{ padding: '0.65rem 0.85rem', fontWeight: '800', color: dark ? '#34d399' : '#059669' }}>91.3%</td>
                  <td style={{ padding: '0.65rem 0.85rem', fontWeight: '600', color: headingColor }}>Cobertura familiar combinada en Tamaulipas (Efecto multiplicador 2.26x).</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TARJETA 4: NECESIDAD EPIDEMIOLÓGICA */}
      {(selectedDashboard === 'general' || selectedDashboard === 'epidemiology') && (
        <div className="animate-fade-in" style={{
          background: cardBg,
          borderRadius: 'var(--radius-2xl)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-card)',
          border: cardBorder,
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: dark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                color: dark ? '#fca5a5' : '#dc2626',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
              }}>
                <FaHeartbeat />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: dark ? '#fca5a5' : '#dc2626', letterSpacing: '0.04em' }}>
                  Tarjeta 4 • Urgencia en Salud Pública (ENSANUT)
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: headingColor, margin: 0 }}>
                  Necesidad Epidemiológica en Tamaulipas
                </h3>
              </div>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: dark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
              color: dark ? '#fca5a5' : '#991b1b',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: '700',
              border: dark ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid #fecaca'
            }}>
              💔 Causas #1 de Mortalidad: Enfermedades del Corazón y Diabetes
            </div>
          </div>

          {/* Indicators Progress Bars */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {/* 1. Sobrepeso Adultos */}
            <div style={{ background: innerBg, padding: '1.1rem', borderRadius: 'var(--radius-xl)', border: innerBorder }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: headingColor, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  ⚖️ Sobrepeso y Obesidad en Adultos (20+ años)
                </span>
                <strong style={{ fontSize: '1.15rem', color: '#dc2626' }}>75.0%</strong>
              </div>
              <div style={{ height: '10px', width: '100%', background: dark ? 'var(--color-surface-300)' : '#e5e7eb', borderRadius: '5px', overflow: 'hidden', marginBottom: '0.4rem' }}>
                <div style={{ width: '75.0%', height: '100%', background: 'linear-gradient(90deg, #f59e0b, #dc2626)', borderRadius: '5px' }} />
              </div>
              <span style={{ fontSize: '0.74rem', color: textColor }}>
                3 de cada 4 adultos en el estado padecen exceso de peso.
              </span>
            </div>

            {/* 2. Sobrepeso Adolescentes */}
            <div style={{ background: innerBg, padding: '1.1rem', borderRadius: 'var(--radius-xl)', border: innerBorder }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: headingColor, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  🎒 Sobrepeso y Obesidad en Adolescentes (12-17 años)
                </span>
                <strong style={{ fontSize: '1.15rem', color: '#ea580c' }}>40.0%</strong>
              </div>
              <div style={{ height: '10px', width: '100%', background: dark ? 'var(--color-surface-300)' : '#e5e7eb', borderRadius: '5px', overflow: 'hidden', marginBottom: '0.4rem' }}>
                <div style={{ width: '40.0%', height: '100%', background: 'linear-gradient(90deg, #fbbf24, #ea580c)', borderRadius: '5px' }} />
              </div>
              <span style={{ fontSize: '0.74rem', color: textColor }}>
                4 de cada 10 jóvenes en etapa escolar en riesgo metabólico.
              </span>
            </div>

            {/* 3. Hipertensión */}
            <div style={{ background: innerBg, padding: '1.1rem', borderRadius: 'var(--radius-xl)', border: innerBorder }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: headingColor, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  ❤️ Hipertensión Arterial (Adultos)
                </span>
                <strong style={{ fontSize: '1.15rem', color: '#b91c1c' }}>30.0%</strong>
              </div>
              <div style={{ height: '10px', width: '100%', background: dark ? 'var(--color-surface-300)' : '#e5e7eb', borderRadius: '5px', overflow: 'hidden', marginBottom: '0.4rem' }}>
                <div style={{ width: '30.0%', height: '100%', background: 'linear-gradient(90deg, #f87171, #b91c1c)', borderRadius: '5px' }} />
              </div>
              <span style={{ fontSize: '0.74rem', color: textColor }}>
                Alta incidencia asintomática en etapa temprana.
              </span>
            </div>

            {/* 4. Diabetes Mellitus */}
            <div style={{ background: innerBg, padding: '1.1rem', borderRadius: 'var(--radius-xl)', border: innerBorder }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: headingColor, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  🩸 Diabetes Mellitus Tipo 2 (Adultos)
                </span>
                <strong style={{ fontSize: '1.15rem', color: dark ? '#fca5b7' : 'var(--color-primary-700)' }}>18.3%</strong>
              </div>
              <div style={{ height: '10px', width: '100%', background: dark ? 'var(--color-surface-300)' : '#e5e7eb', borderRadius: '5px', overflow: 'hidden', marginBottom: '0.4rem' }}>
                <div style={{ width: '18.3%', height: '100%', background: 'linear-gradient(90deg, #d65c7e, #871233)', borderRadius: '5px' }} />
              </div>
              <span style={{ fontSize: '0.74rem', color: textColor }}>
                Por encima de la media nacional, demanda intervención y tamizaje preventivo.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TARJETA 5: REGIONES Y MUNICIPIOS CLAVE (MAPA DE OPORTUNIDAD) */}
      {(selectedDashboard === 'general' || selectedDashboard === 'territory') && (
        <div className="animate-fade-in" style={{
          background: cardBg,
          borderRadius: 'var(--radius-2xl)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-card)',
          border: cardBorder,
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: dark ? 'rgba(212, 169, 106, 0.2)' : 'var(--color-accent-100)',
                color: dark ? '#d4a96a' : 'var(--color-accent-800)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
              }}>
                <FaMapMarkedAlt />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: dark ? '#d4a96a' : 'var(--color-accent-700)', letterSpacing: '0.04em' }}>
                  Tarjeta 5 • Despliegue Geográfico
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: headingColor, margin: 0 }}>
                  Regiones y Municipios Clave (Mapa de Oportunidad)
                </h3>
              </div>
            </div>

            {/* Selector de zona */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {[
                { id: 'norte', label: 'Frontera Norte (51.1%)' },
                { id: 'sur', label: 'Zona Sur (21.8%)' },
                { id: 'centro', label: 'Centro / Capital' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveRegion(tab.id)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: activeRegion === tab.id
                      ? (dark ? 'var(--color-primary-500)' : 'var(--color-primary-600)')
                      : (dark ? 'var(--color-surface-200)' : 'var(--color-surface-100)'),
                    color: activeRegion === tab.id
                      ? 'white'
                      : (dark ? 'var(--color-surface-500)' : 'var(--color-surface-600)'),
                    fontSize: '0.76rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Frontera Norte */}
            <div style={{
              background: activeRegion === 'norte'
                ? (dark ? 'rgba(224, 59, 96, 0.15)' : 'var(--color-primary-50)')
                : innerBg,
              border: activeRegion === 'norte'
                ? (dark ? '1.5px solid var(--color-primary-500)' : '2px solid var(--color-primary-300)')
                : innerBorder,
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem',
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.95rem', color: headingColor }}>Zona Fronteriza Norte</strong>
                <span style={{
                  fontSize: '0.75rem', fontWeight: '800',
                  color: dark ? '#fca5b7' : 'var(--color-primary-700)',
                  background: dark ? 'rgba(224, 59, 96, 0.25)' : 'var(--color-primary-100)',
                  padding: '0.15rem 0.5rem', borderRadius: '4px'
                }}>
                  51.1% Estatal
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: textColor, marginBottom: '0.75rem' }}>
                Mayor concentración industrial y de población joven del estado.
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.82rem', color: headingColor, lineHeight: 1.6 }}>
                <li><strong>Reynosa:</strong> 704,767 habitantes.</li>
                <li><strong>Matamoros:</strong> 541,979 habitantes.</li>
                <li><strong>Nuevo Laredo:</strong> 425,058 habitantes.</li>
              </ul>
            </div>

            {/* Zona Sur */}
            <div style={{
              background: activeRegion === 'sur'
                ? (dark ? 'rgba(212, 169, 106, 0.15)' : 'var(--color-accent-50)')
                : innerBg,
              border: activeRegion === 'sur'
                ? (dark ? '1.5px solid var(--color-accent-500)' : '2px solid var(--color-accent-400)')
                : innerBorder,
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem',
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.95rem', color: headingColor }}>Zona Sur Metropolitana</strong>
                <span style={{
                  fontSize: '0.75rem', fontWeight: '800',
                  color: dark ? '#fde68a' : 'var(--color-accent-900)',
                  background: dark ? 'rgba(212, 169, 106, 0.25)' : 'var(--color-accent-200)',
                  padding: '0.15rem 0.5rem', borderRadius: '4px'
                }}>
                  21.8% Estatal
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: textColor, marginBottom: '0.75rem' }}>
                Conurbación de alta densidad comercial, portuaria y académica.
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.82rem', color: headingColor, lineHeight: 1.6 }}>
                <li><strong>Tampico, Altamira y Cd. Madero:</strong> 773,285 habitantes en conjunto.</li>
              </ul>
            </div>

            {/* Región Centro */}
            <div style={{
              background: activeRegion === 'centro'
                ? (dark ? 'rgba(224, 59, 96, 0.15)' : 'var(--color-primary-50)')
                : innerBg,
              border: activeRegion === 'centro'
                ? (dark ? '1.5px solid var(--color-primary-500)' : '2px solid var(--color-primary-300)')
                : innerBorder,
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem',
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.95rem', color: headingColor }}>Región Centro (Capital)</strong>
                <span style={{
                  fontSize: '0.75rem', fontWeight: '800',
                  color: dark ? '#fca5b7' : 'var(--color-primary-700)',
                  background: dark ? 'rgba(224, 59, 96, 0.25)' : 'var(--color-primary-100)',
                  padding: '0.15rem 0.5rem', borderRadius: '4px'
                }}>
                  Sede de Gobierno
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: textColor, marginBottom: '0.75rem' }}>
                Centro neurálgico institucional y universitario del estado.
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.82rem', color: headingColor, lineHeight: 1.6 }}>
                <li><strong>Ciudad Victoria:</strong> 349,688 habitantes.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TARJETA 6: ESCENARIOS DE ADOPCIÓN A 3 AÑOS (PROYECCIÓN) */}
      {(selectedDashboard === 'general' || selectedDashboard === 'digital') && (
        <div className="animate-fade-in" style={{
          background: cardBg,
          borderRadius: 'var(--radius-2xl)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-card)',
          border: cardBorder,
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
              }}>
                <FaChartLine />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.04em' }}>
                  Tarjeta 6 • Metas y Escalabilidad
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: headingColor, margin: 0 }}>
                  Escenarios de Adopción a 3 Años (Proyección)
                </h3>
              </div>
            </div>

            {/* Scenario toggle */}
            <div style={{ display: 'flex', gap: '0.35rem', background: innerBg, padding: '0.25rem', borderRadius: 'var(--radius-lg)', border: innerBorder }}>
              {[
                { id: 'conservador', label: 'Conservador (5%)' },
                { id: 'moderado', label: 'Moderado (15%)' },
                { id: 'optimista', label: 'Optimista (30%)' },
              ].map(sc => (
                <button
                  key={sc.id}
                  onClick={() => setActiveAdoptionScenario(sc.id)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: activeAdoptionScenario === sc.id
                      ? (dark ? 'var(--color-primary-500)' : 'white')
                      : 'transparent',
                    color: activeAdoptionScenario === sc.id
                      ? (dark ? 'white' : 'var(--color-primary-700)')
                      : textColor,
                    fontWeight: activeAdoptionScenario === sc.id ? '700' : '600',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    boxShadow: activeAdoptionScenario === sc.id ? 'var(--shadow-card)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Display */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* Conservador */}
            <div style={{
              background: activeAdoptionScenario === 'conservador'
                ? (dark ? 'var(--color-surface-200)' : 'linear-gradient(135deg, var(--color-surface-50), white)')
                : (dark ? 'var(--color-surface-200)' : 'white'),
              border: activeAdoptionScenario === 'conservador'
                ? (dark ? '1.5px solid var(--color-surface-400)' : '2px solid var(--color-surface-400)')
                : innerBorder,
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem',
              boxShadow: activeAdoptionScenario === 'conservador' ? 'var(--shadow-card)' : 'none',
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: textColor, textTransform: 'uppercase' }}>
                  Escenario 1 • 5% Adopción
                </span>
                <span style={{
                  fontSize: '0.75rem', fontWeight: '700',
                  color: headingColor,
                  background: dark ? 'var(--color-surface-300)' : 'var(--color-surface-100)',
                  padding: '0.1rem 0.45rem', borderRadius: '4px'
                }}>
                  Base
                </span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '900', color: headingColor, margin: '0.35rem 0' }}>
                122,078
              </div>
              <strong style={{ fontSize: '0.85rem', color: textColor, display: 'block', marginBottom: '0.35rem' }}>
                Personas Beneficiadas (3.5% estatal)
              </strong>
              <p style={{ fontSize: '0.76rem', color: textColor, margin: 0 }}>
                Cobertura alcanzable con despliegue orgánico en escuelas de nivel superior y media superior.
              </p>
            </div>

            {/* Moderado */}
            <div style={{
              background: activeAdoptionScenario === 'moderado'
                ? (dark ? 'rgba(224, 59, 96, 0.15)' : 'linear-gradient(135deg, var(--color-primary-50), white)')
                : (dark ? 'var(--color-surface-200)' : 'white'),
              border: activeAdoptionScenario === 'moderado'
                ? (dark ? '1.5px solid var(--color-primary-500)' : '2px solid var(--color-primary-400)')
                : innerBorder,
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem',
              boxShadow: activeAdoptionScenario === 'moderado' ? 'var(--shadow-card)' : 'none',
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: dark ? '#fca5b7' : 'var(--color-primary-600)', textTransform: 'uppercase' }}>
                  Escenario 2 • 15% Adopción
                </span>
                <span style={{
                  fontSize: '0.75rem', fontWeight: '800',
                  color: dark ? '#fca5b7' : 'var(--color-primary-700)',
                  background: dark ? 'rgba(224, 59, 96, 0.25)' : 'var(--color-primary-100)',
                  padding: '0.1rem 0.45rem', borderRadius: '4px'
                }}>
                  Recomendado
                </span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '900', color: dark ? '#ffffff' : 'var(--color-primary-700)', margin: '0.35rem 0' }}>
                410,180
              </div>
              <strong style={{ fontSize: '0.85rem', color: dark ? '#fca5b7' : 'var(--color-primary-800)', display: 'block', marginBottom: '0.35rem' }}>
                Personas Beneficiadas (11.6% estatal)
              </strong>
              <p style={{ fontSize: '0.76rem', color: textColor, margin: 0 }}>
                Integración con programas estatales del IJT, Secretaría de Salud y universidades públicas.
              </p>
            </div>

            {/* Optimista */}
            <div style={{
              background: activeAdoptionScenario === 'optimista'
                ? (dark ? 'rgba(16, 185, 129, 0.15)' : 'linear-gradient(135deg, #ecfdf5, white)')
                : (dark ? 'var(--color-surface-200)' : 'white'),
              border: activeAdoptionScenario === 'optimista'
                ? (dark ? '1.5px solid #10b981' : '2px solid #34d399')
                : innerBorder,
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem',
              boxShadow: activeAdoptionScenario === 'optimista' ? 'var(--shadow-card)' : 'none',
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: dark ? '#6ee7b7' : '#047857', textTransform: 'uppercase' }}>
                  Escenario 3 • 30% Adopción
                </span>
                <span style={{
                  fontSize: '0.75rem', fontWeight: '800',
                  color: dark ? '#6ee7b7' : '#065f46',
                  background: dark ? 'rgba(16, 185, 129, 0.25)' : '#d1fae5',
                  padding: '0.1rem 0.45rem', borderRadius: '4px'
                }}>
                  Alto Impacto
                </span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '900', color: dark ? '#ffffff' : '#047857', margin: '0.35rem 0' }}>
                937,558
              </div>
              <strong style={{ fontSize: '0.85rem', color: dark ? '#34d399' : '#065f46', display: 'block', marginBottom: '0.35rem' }}>
                Personas Beneficiadas (26.6% estatal)
              </strong>
              <p style={{ fontSize: '0.76rem', color: textColor, margin: 0 }}>
                Campaña institucional masiva con soporte en ferias de salud y credencialización juvenil estatal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TARJETA 7 / TOOLBOX: SUGERENCIAS VISUALES PARA CANVA Y PITCH */}
      <div className="animate-fade-in" style={{
        background: dark ? 'var(--color-surface-100)' : 'linear-gradient(135deg, var(--color-surface-50) 0%, white 100%)',
        borderRadius: 'var(--radius-2xl)',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-card)',
        border: dark ? '1px dashed rgba(212, 169, 106, 0.4)' : '1px dashed var(--color-accent-400)',
        marginBottom: '1.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: dark ? 'rgba(212, 169, 106, 0.2)' : 'var(--color-accent-200)',
            color: dark ? '#d4a96a' : 'var(--color-accent-900)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
          }}>
            <FaLightbulb />
          </div>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: headingColor, margin: 0 }}>
              Sugerencias de Elementos Visuales para Diseñar en Canva / Presentaciones
            </h4>
            <span style={{ fontSize: '0.75rem', color: textColor }}>
              Recomendaciones para transformar estos datos en diapositivas de alto impacto visual.
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', fontSize: '0.82rem' }}>
          <div style={{ background: innerBg, padding: '1rem', borderRadius: 'var(--radius-lg)', border: innerBorder }}>
            <strong style={{ color: dark ? '#fca5b7' : 'var(--color-primary-700)', display: 'block', marginBottom: '0.3rem' }}>
              🍩 1. Gráfica de Dona (Conectividad)
            </strong>
            <p style={{ color: textColor, margin: 0, lineHeight: 1.4 }}>
              Usar para la distribución de internet (<strong style={{ color: headingColor }}>87.7% conectados</strong> vs. <strong style={{ color: headingColor }}>12.3% no conectados</strong>). Resalta el 97.8% de acceso en hogares.
            </p>
          </div>

          <div style={{ background: innerBg, padding: '1rem', borderRadius: 'var(--radius-lg)', border: innerBorder }}>
            <strong style={{ color: dark ? '#fde68a' : 'var(--color-accent-800)', display: 'block', marginBottom: '0.3rem' }}>
              🔻 2. Diagrama de Embudo / Pirámide
            </strong>
            <p style={{ color: textColor, margin: 0, lineHeight: 1.4 }}>
              Colocar en la cúspide a los <strong style={{ color: headingColor }}>976k jóvenes</strong> y abajo a los <strong style={{ color: headingColor }}>2.24M de familiares indirectos</strong> para evidenciar el factor multiplicador 2.26x.
            </p>
          </div>

          <div style={{ background: innerBg, padding: '1rem', borderRadius: 'var(--radius-lg)', border: innerBorder }}>
            <strong style={{ color: dark ? '#f87171' : '#dc2626', display: 'block', marginBottom: '0.3rem' }}>
              📊 3. Indicadores de Barra Progresiva
            </strong>
            <p style={{ color: textColor, margin: 0, lineHeight: 1.4 }}>
              Para los porcentajes de sobrepeso/obesidad (<strong style={{ color: headingColor }}>75%</strong> en adultos, <strong style={{ color: headingColor }}>40%</strong> en adolescentes) y diabetes (<strong style={{ color: headingColor }}>18.3%</strong>).
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN FINAL: DIAGRAMAS DEL MARCO LÓGICO (ÁRBOL DE PROBLEMAS Y OBJETIVOS) */}
      {/* ========================================================================= */}
      <div className="animate-fade-in" style={{
        background: cardBg,
        borderRadius: 'var(--radius-2xl)',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-card)',
        border: cardBorder,
        marginBottom: '1.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: dark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5',
              color: '#059669',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
            }}>
              <FaTree />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: '#059669', letterSpacing: '0.04em' }}>
                Metodología del Marco Lógico • Plan Estatal de Desarrollo
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: headingColor, margin: 0 }}>
                Árbol de Problemas y Árbol de Objetivos
              </h3>
            </div>
          </div>

          <span style={{
            fontSize: '0.76rem',
            fontWeight: '700',
            color: dark ? '#d4a96a' : 'var(--color-accent-800)',
            background: dark ? 'rgba(212, 169, 106, 0.15)' : 'var(--color-accent-100)',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            border: dark ? '1px solid rgba(212, 169, 106, 0.35)' : '1px solid var(--color-accent-300)'
          }}>
            🔍 Haz clic en cualquier diagrama para ampliarlo a pantalla completa
          </span>
        </div>

        <p style={{ fontSize: '0.86rem', color: textColor, margin: '0 0 1.5rem', lineHeight: 1.5 }}>
          Diagnóstico causal y alineación estratégica estructurados para fundamentar el impacto social, tecnológico y en salud pública del proyecto <strong>Jóvenes con Salud</strong> frente al Gobierno de Tamaulipas y organismos multilaterales.
        </p>

        {/* Diagram Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {DIAGRAMS.map((diag, index) => (
            <div
              key={diag.id}
              onClick={() => setActiveLightboxIndex(index)}
              style={{
                background: innerBg,
                borderRadius: 'var(--radius-xl)',
                border: innerBorder,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: dark ? '0 4px 15px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.borderColor = dark ? 'var(--color-primary-500)' : 'var(--color-primary-400)'
                e.currentTarget.style.boxShadow = dark ? '0 8px 25px rgba(224,59,96,0.25)' : '0 8px 20px rgba(135,18,51,0.12)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = dark ? 'var(--color-surface-300)' : 'var(--color-surface-200)'
                e.currentTarget.style.boxShadow = dark ? '0 4px 15px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              {/* Image Preview Container */}
              <div style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/9',
                background: dark ? '#0a090c' : '#f8f9fa',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: innerBorder
              }}>
                <img
                  src={diag.src}
                  alt={diag.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />

                {/* Hover overlay hint */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.45)',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '0.85rem'
                }}
                className="hover-overlay"
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                >
                  <FaSearchPlus size={18} />
                  <span>Ver a tamaño completo</span>
                </div>

                {/* Badge */}
                <span style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: diag.id === 'problemas'
                    ? (dark ? 'rgba(239, 68, 68, 0.85)' : '#dc2626')
                    : (dark ? 'rgba(16, 185, 129, 0.85)' : '#059669'),
                  color: 'white',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  backdropFilter: 'blur(4px)',
                  letterSpacing: '0.03em'
                }}>
                  {diag.badge}
                </span>

                <button
                  type="button"
                  title="Ampliar imagen"
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <FaExpand size={13} />
                </button>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: headingColor, margin: '0 0 0.35rem', lineHeight: 1.3 }}>
                    {diag.title}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: textColor, margin: '0 0 0.75rem', lineHeight: 1.45 }}>
                    {diag.description}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  borderTop: innerBorder,
                  fontSize: '0.78rem'
                }}>
                  <span style={{ color: dark ? '#fca5b7' : 'var(--color-primary-600)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FaExpand size={11} /> Clic para ampliar
                  </span>
                  <span style={{ color: textColor, fontSize: '0.72rem' }}>
                    1080p HD
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LIGHTBOX MODAL PARA VER IMÁGENES A TAMAÑO COMPLETO */}
      {/* ========================================================================= */}
      {activeLightboxIndex !== null && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.92)',
          backdropFilter: 'blur(10px)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          animation: 'fadeIn 0.2s ease-out forwards'
        }}>
          {/* Lightbox Header */}
          <div style={{
            width: '100%',
            maxWidth: '1280px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 1rem',
            color: 'white',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                color: DIAGRAMS[activeLightboxIndex].id === 'problemas' ? '#f87171' : '#34d399',
                letterSpacing: '0.05em'
              }}>
                {DIAGRAMS[activeLightboxIndex].badge} • Diagrama {activeLightboxIndex + 1} de 2
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0.15rem 0 0', color: 'white' }}>
                {DIAGRAMS[activeLightboxIndex].title}
              </h3>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Prev / Next buttons */}
              <button
                onClick={() => setActiveLightboxIndex(prev => (prev === 0 ? 1 : 0))}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s'
                }}
              >
                <FaArrowLeft size={11} /> {activeLightboxIndex === 0 ? 'Ver Objetivos' : 'Ver Problemas'}
              </button>

              <a
                href={DIAGRAMS[activeLightboxIndex].src}
                download={`${DIAGRAMS[activeLightboxIndex].id}_jovenes_con_salud.png`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  textDecoration: 'none',
                  transition: 'all 0.15s'
                }}
              >
                <FaDownload size={11} /> Descargar
              </a>

              {/* Close button */}
              <button
                onClick={() => setActiveLightboxIndex(null)}
                style={{
                  background: 'rgba(239, 68, 68, 0.8)',
                  color: 'white',
                  border: 'none',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'transform 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                title="Cerrar (Esc)"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Lightbox Main Image Display */}
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setActiveLightboxIndex(null)
            }}
            style={{
              flex: 1,
              width: '100%',
              maxWidth: '1360px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              padding: '0.5rem'
            }}
          >
            {/* Side Navigation Arrow Left */}
            <button
              onClick={() => setActiveLightboxIndex(prev => (prev === 0 ? 1 : 0))}
              style={{
                position: 'absolute',
                left: '12px',
                background: 'rgba(0, 0, 0, 0.65)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'all 0.2s'
              }}
              title="Diagrama anterior (Flecha izquierda)"
            >
              <FaArrowLeft size={16} />
            </button>

            <img
              src={DIAGRAMS[activeLightboxIndex].src}
              alt={DIAGRAMS[activeLightboxIndex].title}
              style={{
                maxWidth: '96%',
                maxHeight: '82vh',
                objectFit: 'contain',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            />

            {/* Side Navigation Arrow Right */}
            <button
              onClick={() => setActiveLightboxIndex(prev => (prev === 0 ? 1 : 0))}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'rgba(0, 0, 0, 0.65)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'all 0.2s'
              }}
              title="Siguiente diagrama (Flecha derecha)"
            >
              <FaArrowRight size={16} />
            </button>
          </div>

          {/* Lightbox Footer Caption */}
          <div style={{
            width: '100%',
            maxWidth: '1000px',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.8rem',
            padding: '0.4rem 1rem 0.8rem'
          }}>
            <span>{DIAGRAMS[activeLightboxIndex].subtitle} • Presiona <strong>Esc</strong> para salir o utiliza las flechas para alternar</span>
          </div>
        </div>
      )}

      {/* MODAL CREAR NUEVO DASHBOARD */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div className="animate-scale-in" style={{
            background: cardBg,
            borderRadius: 'var(--radius-2xl)',
            width: '100%',
            maxWidth: '520px',
            padding: '2rem',
            boxShadow: 'var(--shadow-elevated)',
            border: cardBorder,
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaPlus color={dark ? '#fca5b7' : 'var(--color-primary-600)'} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: headingColor, margin: 0 }}>
                  Crear Nuevo Dashboard
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: textColor }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDashboard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: headingColor, marginBottom: '0.35rem' }}>
                  Nombre del Dashboard *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Plan de Despliegue Universitario 2026"
                  value={newDashTitle}
                  onChange={e => setNewDashTitle(e.target.value)}
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                    border: innerBorder, fontSize: '0.88rem', background: innerBg, color: headingColor
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: headingColor, marginBottom: '0.35rem' }}>
                  Objetivo / Meta Clave
                </label>
                <input
                  type="text"
                  placeholder="Ej: Alcanzar 50,000 registros en el primer semestre"
                  value={newDashTarget}
                  onChange={e => setNewDashTarget(e.target.value)}
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                    border: innerBorder, fontSize: '0.88rem', background: innerBg, color: headingColor
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: headingColor, marginBottom: '0.35rem' }}>
                  Descripción Corta
                </label>
                <input
                  type="text"
                  placeholder="Breve resumen del propósito de esta vista..."
                  value={newDashDesc}
                  onChange={e => setNewDashDesc(e.target.value)}
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                    border: innerBorder, fontSize: '0.88rem', background: innerBg, color: headingColor
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: headingColor, marginBottom: '0.35rem' }}>
                  Notas Estratégicas y KPIs Personalizados
                </label>
                <textarea
                  rows={4}
                  placeholder="Escribe aquí las conclusiones, directrices o métricas complementarias para este dashboard..."
                  value={newDashNotes}
                  onChange={e => setNewDashNotes(e.target.value)}
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                    border: innerBorder, fontSize: '0.88rem', fontFamily: 'inherit', background: innerBg, color: headingColor
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)',
                    border: dark ? '1px solid var(--color-surface-300)' : '1px solid var(--color-surface-300)',
                    background: innerBg, color: headingColor, fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-md)',
                    border: 'none', background: dark ? 'var(--color-primary-500)' : 'var(--color-primary-600)',
                    color: 'white', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer'
                  }}
                >
                  Guardar Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
