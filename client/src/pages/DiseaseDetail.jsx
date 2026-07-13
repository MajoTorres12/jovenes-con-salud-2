import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FaArrowLeft, FaExternalLinkAlt, FaCheckCircle, FaExclamationTriangle, FaHeartbeat, FaBandAid, FaShieldAlt, FaYoutube, FaBookOpen, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'

const parseFormattedText = (text) => {
  if (!text) return '';
  // Escapar caracteres HTML para prevenir XSS
  let safeText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Restaurar etiquetas <u> y </u> permitidas
  safeText = safeText
    .replace(/&lt;u&gt;/gi, '<u>')
    .replace(/&lt;\/u&gt;/gi, '</u>');
  
  // Negrita: **texto** -> <strong>texto</strong>
  safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Cursiva: *texto* -> <em>texto</em>
  safeText = safeText.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  return safeText;
}

export default function DiseaseDetail() {
  const { id: slug } = useParams()
  const { dark } = useTheme()
  const [disease, setDisease] = useState(null)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState('main')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setSelectedVariant(null)
      try {
        const [diseaseRes, articlesRes] = await Promise.allSettled([
          api.get(`/diseases/${slug}`),
          api.get('/articles', { params: { diseaseId: undefined, category: undefined, search: undefined } }),
        ])

        if (diseaseRes.status === 'fulfilled') {
          setDisease(diseaseRes.value.data.disease)
          const dId = diseaseRes.value.data.disease.id
          try {
            const artRes = await api.get('/articles', { params: { diseaseId: dId, limit: 4 } })
            setArticles(artRes.data.articles || [])
          } catch { /* no articles is ok */ }
        } else {
          setNotFound(true)
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [slug])

  if (loading) {
    return (
      <div style={{ padding: '3rem', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ height: '400px', borderRadius: 'var(--radius-xl)', background: 'var(--color-surface-100)' }} />
      </div>
    )
  }

  if (notFound || !disease) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '3rem' }}>🔍</p>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-surface-900)', marginTop: '1rem' }}>
          Enfermedad no encontrada
        </h2>
        <Link to="/enfermedades" style={{
          display: 'inline-block', marginTop: '1rem',
          padding: '0.6rem 1.5rem', borderRadius: 'var(--radius-lg)',
          background: 'var(--color-primary-500)', color: 'white',
          textDecoration: 'none', fontWeight: '600',
        }}>
          Ver todas las enfermedades
        </Link>
      </div>
    )
  }

  const activeName = selectedVariant ? selectedVariant.name : disease.name
  const activeDesc = selectedVariant ? selectedVariant.description : disease.description
  const activeTreatment = selectedVariant ? selectedVariant.treatment : disease.treatment
  const activeValidated = selectedVariant ? selectedVariant.validatedBy : disease.validatedBy

  const symptoms = selectedVariant 
    ? (Array.isArray(selectedVariant.symptoms) ? selectedVariant.symptoms : [])
    : (Array.isArray(disease.symptoms) ? disease.symptoms : (disease.symptoms ? JSON.parse(disease.symptoms) : []))

  const riskFactors = selectedVariant
    ? (Array.isArray(selectedVariant.riskFactors) ? selectedVariant.riskFactors : [])
    : (Array.isArray(disease.riskFactors) ? disease.riskFactors : (disease.riskFactors ? JSON.parse(disease.riskFactors) : []))

  const resources = selectedVariant
    ? (Array.isArray(selectedVariant.externalResources || selectedVariant.external_resources) 
        ? (selectedVariant.externalResources || selectedVariant.external_resources) 
        : [])
    : (Array.isArray(disease.externalResources || disease.external_resources) 
        ? (disease.externalResources || disease.external_resources) 
        : (disease.externalResources ? JSON.parse(disease.externalResources) : (disease.external_resources ? JSON.parse(disease.external_resources) : [])))

  const youtubeVideos = selectedVariant
    ? (Array.isArray(selectedVariant.youtubeVideos || selectedVariant.youtube_videos) 
        ? (selectedVariant.youtubeVideos || selectedVariant.youtube_videos) 
        : [])
    : (disease.youtubeVideos || disease.youtube_videos || [])

  const color = disease.colorHex || '#871233'

  const tabs = [
    { id: 'main', label: 'Ficha Principal', icon: FaBookOpen },
    { id: 'general', label: 'General y Tratamiento', icon: FaBandAid },
    { id: 'symptoms', label: 'Síntomas y Riesgos', icon: FaHeartbeat },
    { id: 'videos', label: 'Videos Informativos', icon: FaYoutube },
    { id: 'resources', label: 'Recursos y Artículos', icon: FaExternalLinkAlt }
  ]
  return (
    <div className="disease-detail-wrapper">
      <div className="disease-detail-container">
        
        {/* Sidebar */}
        <aside className="disease-sidebar">
          {/* Back & Collapse Toggle Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', gap: '0.5rem', width: '100%' }}>
            {isCollapsed ? (
              <Link to="/enfermedades" title="Volver al catálogo" style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'var(--color-surface-100)', color: 'var(--color-surface-500)',
                border: '1px solid var(--color-surface-200)', transition: 'all 0.2s ease'
              }}
                onMouseEnter={e => { e.currentTarget.style.color = color; e.currentTarget.style.borderColor = color + '40' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-surface-500)'; e.currentTarget.style.borderColor = 'var(--color-surface-200)' }}
              >
                <FaArrowLeft size={12} />
              </Link>
            ) : (
              <Link to="/enfermedades" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                color: 'var(--color-surface-500)', textDecoration: 'none', fontSize: '0.82rem',
                fontWeight: '600', transition: 'all 0.2s ease',
                background: 'var(--color-surface-100)',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--color-surface-200)'
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = color
                  e.currentTarget.style.borderColor = color + '40'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--color-surface-500)'
                  e.currentTarget.style.borderColor = 'var(--color-surface-200)'
                }}
              >
                <FaArrowLeft size={10} /> Volver
              </Link>
            )}

            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              className="collapse-toggle-btn"
              title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px', borderRadius: '8px',
                border: '1px solid var(--color-surface-200)',
                background: 'var(--color-surface-100)',
                color: 'var(--color-surface-500)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = color
                e.currentTarget.style.borderColor = color + '40'
                e.currentTarget.style.background = color + '05'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--color-surface-500)'
                e.currentTarget.style.borderColor = 'var(--color-surface-200)'
                e.currentTarget.style.background = 'var(--color-surface-100)'
              }}
            >
              {isCollapsed ? <FaChevronRight size={12} /> : <FaChevronLeft size={12} />}
            </button>
          </div>

          {/* Brand/Disease Header inside Sidebar */}
          <div style={{
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: '0.75rem',
            padding: '0.5rem 0.25rem',
            borderBottom: '1px solid var(--color-surface-200)',
            paddingBottom: '1rem',
            marginTop: '0.25rem',
            width: '100%',
          }}>
            <span style={{ fontSize: isCollapsed ? '2.5rem' : '2.25rem', transition: 'font-size 0.3s' }}>
              {disease.iconEmoji || '🏥'}
            </span>
            {!isCollapsed && (
              <div style={{ minWidth: 0, animation: 'fadeIn 0.2s' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--color-surface-900)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {disease.name}
                </h2>
                <div style={{
                  display: 'inline-block', padding: '0.1rem 0.5rem', borderRadius: '4px',
                  background: color + '15', color, fontSize: '0.65rem', fontWeight: '700',
                  textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: '0.2rem'
                }}>
                  {disease.category}
                </div>
              </div>
            )}
          </div>

          {/* Vertical Menu */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }} className="disease-tabs-nav">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                title={isCollapsed ? t.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: isCollapsed ? '0' : '0.75rem',
                  padding: isCollapsed ? '0.75rem 0' : '0.75rem 1rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === t.id ? (dark ? 'rgba(255,255,255,0.06)' : color + '12') : 'transparent',
                  color: activeTab === t.id ? color : 'var(--color-surface-500)',
                  fontWeight: activeTab === t.id ? '700' : '500',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  width: '100%',
                }}
                onMouseEnter={e => {
                  if (activeTab !== t.id) {
                    e.currentTarget.style.color = color
                    e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.02)' : 'var(--color-surface-100)'
                  }
                }}
                onMouseLeave={e => {
                  if (activeTab !== t.id) {
                    e.currentTarget.style.color = 'var(--color-surface-500)'
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <t.icon size={14} style={{ flexShrink: 0, opacity: activeTab === t.id ? 1 : 0.7 }} />
                {!isCollapsed && <span style={{ animation: 'fadeIn 0.2s', whiteSpace: 'nowrap' }}>{t.label}</span>}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="disease-content-area animate-fade-in">
          {/* Variant Selector Pills */}
          {disease.variants && disease.variants.length > 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              marginBottom: '1.75rem',
              background: dark ? 'rgba(255,255,255,0.02)' : '#faf8f6',
              padding: '1rem 1.25rem',
              borderRadius: '16px',
              border: `1.5px dashed ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(135,18,51,0.12)'}`,
            }}>
              <style>{`
                .no-scrollbar::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: dark ? '#c2a378' : '#871233',
              }}>
                <span>🧬</span> Selección de Variante o Tipo:
              </div>
              <div style={{
                display: 'flex',
                gap: '0.6rem',
                overflowX: 'auto',
                paddingBottom: '0.1rem',
                scrollbarWidth: 'none',
                MsOverflowStyle: 'none',
              }} className="no-scrollbar">
                {/* General Option */}
                <button
                  type="button"
                  onClick={() => setSelectedVariant(null)}
                  style={{
                    flexShrink: 0,
                    padding: '0.55rem 1.1rem',
                    borderRadius: '30px',
                    border: 'none',
                    background: !selectedVariant 
                      ? color 
                      : (dark ? 'rgba(255,255,255,0.05)' : 'rgba(135,18,51,0.06)'),
                    color: !selectedVariant
                      ? '#fff'
                      : (dark ? '#b8a690' : '#871233'),
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: !selectedVariant ? `0 4px 12px ${color}50` : 'none',
                    transform: !selectedVariant ? 'scale(1.03)' : 'scale(1)',
                  }}
                >
                  📋 Ficha General ({disease.name})
                </button>
                {/* Variants Options */}
                {disease.variants.map(v => {
                  const isSelected = selectedVariant?.id === v.id
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      style={{
                        flexShrink: 0,
                        padding: '0.55rem 1.1rem',
                        borderRadius: '30px',
                        border: 'none',
                        background: isSelected 
                          ? color 
                          : (dark ? 'rgba(255,255,255,0.05)' : 'rgba(135,18,51,0.06)'),
                        color: isSelected
                          ? '#fff'
                          : (dark ? '#b8a690' : '#871233'),
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isSelected ? `0 4px 12px ${color}50` : 'none',
                        transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                      }}
                    >
                      🧬 {v.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Ficha Principal Tab */}
          {activeTab === 'main' && (
            <div className="disease-card-content" style={{
              padding: '2rem',
              borderRadius: 'var(--radius-2xl)',
              background: `linear-gradient(135deg, ${color}15, ${color}05)`,
              border: `1px solid ${color}30`,
              position: 'relative', overflow: 'hidden',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '6px', height: '100%',
                background: color,
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', paddingLeft: '0.75rem', minWidth: 0 }}>
                <span style={{ fontSize: '3.5rem', flexShrink: 0 }}>{disease.iconEmoji || '🏥'}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    display: 'inline-block', padding: '0.2rem 0.75rem', borderRadius: '2rem',
                    background: color + '25', color, fontSize: '0.75rem', fontWeight: '700',
                    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem',
                  }}>
                    {disease.category}
                  </div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-surface-900)', lineHeight: 1.2, wordBreak: 'break-word' }}>
                    {activeName}
                  </h1>
                </div>
              </div>
              <p 
                style={{ paddingLeft: '0.75rem', fontSize: '0.98rem', color: 'var(--color-surface-700)', lineHeight: 1.8, maxWidth: '720px', margin: '0 0 1.5rem 0', wordBreak: 'break-word', overflowWrap: 'break-word' }}
                dangerouslySetInnerHTML={{ __html: parseFormattedText(activeDesc) }}
              />
              <div style={{ paddingLeft: '0.75rem', maxWidth: '100%' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.4rem 0.85rem', borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.08)', color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  fontSize: '0.75rem', fontWeight: '700',
                  maxWidth: '100%', boxSizing: 'border-box',
                }}>
                  <FaShieldAlt size={12} style={{ flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    Ficha Médica Validada por: {activeValidated || 'Secretaría de Salud de Tamaulipas'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* General y Tratamiento Tab */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {activeTreatment ? (
                <div className="disease-card-content" style={{
                  padding: '1.75rem', borderRadius: 'var(--radius-xl)',
                  background: 'white', boxShadow: 'var(--shadow-card)',
                  border: '1px solid var(--color-surface-200)',
                }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-surface-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaBandAid style={{ color: '#10b981' }} /> Recomendaciones de Tratamiento
                  </h2>
                  <p 
                    style={{ fontSize: '0.95rem', color: 'var(--color-surface-700)', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}
                    dangerouslySetInnerHTML={{ __html: parseFormattedText(activeTreatment) }}
                  />
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--color-surface-400)', padding: '2rem' }}>No hay información de tratamiento registrada aún.</p>
              )}
            </div>
          )}

          {/* Síntomas y Riesgos Tab */}
          {activeTab === 'symptoms' && (
            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              {/* Symptoms */}
              {symptoms.length > 0 ? (
                <div className="disease-card-content" style={{
                  padding: '1.5rem', borderRadius: 'var(--radius-xl)',
                  background: 'white', boxShadow: 'var(--shadow-card)',
                  border: '1px solid var(--color-surface-200)',
                }}>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-surface-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaHeartbeat style={{ color }} /> Síntomas frecuentes
                  </h2>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {symptoms.map((s, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-surface-700)' }}>
                        <FaCheckCircle style={{ color: color, flexShrink: 0, marginTop: '0.15rem' }} />
                        <span dangerouslySetInnerHTML={{ __html: parseFormattedText(s) }} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', background: 'white', border: '1px solid var(--color-surface-200)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--color-surface-400)', margin: 0 }}>No hay síntomas registrados.</p>
                </div>
              )}

              {/* Risk Factors */}
              {riskFactors.length > 0 ? (
                <div className="disease-card-content" style={{
                  padding: '1.5rem', borderRadius: 'var(--radius-xl)',
                  background: 'white', boxShadow: 'var(--shadow-card)',
                  border: '1px solid var(--color-surface-200)',
                }}>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-surface-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaExclamationTriangle style={{ color: '#f59e0b' }} /> Factores de riesgo
                  </h2>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {riskFactors.map((r, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-surface-700)' }}>
                        <FaExclamationTriangle style={{ color: '#f59e0b', flexShrink: 0, marginTop: '0.15rem', fontSize: '0.8rem' }} />
                        <span dangerouslySetInnerHTML={{ __html: parseFormattedText(r) }} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', background: 'white', border: '1px solid var(--color-surface-200)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--color-surface-400)', margin: 0 }}>No hay factores de riesgo registrados.</p>
                </div>
              )}
            </div>
          )}

          {/* Videos Informativos Tab */}
          {activeTab === 'videos' && (
            <div>
              {youtubeVideos && youtubeVideos.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {youtubeVideos.map((v, i) => (
                    <div key={i} style={{
                      background: 'white', borderRadius: '16px', border: '1px solid var(--color-surface-200)',
                      overflow: 'hidden', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column'
                    }}>
                      <div style={{ position: 'relative', paddingTop: '56.25%', width: '100%', background: '#000' }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${v.youtubeId}`}
                          title={v.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        />
                      </div>
                      <div style={{ padding: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <FaYoutube style={{ color: '#ff0000', fontSize: '1.2rem', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-surface-800)', lineHeight: 1.3 }}>
                          {v.title}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--color-surface-400)' }}>
                  <FaYoutube size={48} style={{ opacity: 0.25, marginBottom: '0.75rem' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600' }}>No hay videos informativos disponibles para esta enfermedad.</p>
                </div>
              )}
            </div>
          )}

          {/* Recursos y Artículos Tab */}
          {activeTab === 'resources' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* External Resources */}
              {resources.length > 0 && (
                <div style={{
                  padding: '1.5rem', borderRadius: 'var(--radius-xl)',
                  background: 'white', boxShadow: 'var(--shadow-card)',
                  border: '1px solid var(--color-surface-200)',
                }}>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-surface-900)', marginBottom: '1rem' }}>
                    Recursos externos validados
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {resources.map((r, i) => (
                      <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          color: color, textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500',
                        }}
                      >
                        <FaExternalLinkAlt size={12} /> {r.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Articles */}
              {articles.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-surface-900)', marginBottom: '1rem' }}>
                    Artículos relacionados
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {articles.map(article => (
                      <Link
                        key={article.id}
                        to={`/articulos/${article.slug}`}
                        style={{
                          padding: '1rem 1.25rem',
                          borderRadius: 'var(--radius-xl)',
                          background: 'white',
                          border: '1px solid var(--color-surface-200)',
                          textDecoration: 'none',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = color + '60'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-surface-200)'}
                      >
                        <div>
                          <p style={{ fontWeight: '600', color: 'var(--color-surface-900)', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{article.title}</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--color-surface-400)', textTransform: 'capitalize' }}>{article.category}</p>
                        </div>
                        <FaExternalLinkAlt size={12} style={{ color: 'var(--color-surface-400)', flexShrink: 0 }} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {resources.length === 0 && articles.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--color-surface-400)', padding: '2rem' }}>No hay artículos o enlaces relacionados.</p>
              )}
            </div>
          )}
        </main>

      </div>

      <style>{`
        .disease-detail-wrapper {
          padding: 2.5rem 2rem;
          max-width: 1350px;
          margin: 0 auto;
          min-height: 80vh;
        }
        .disease-detail-container {
          display: flex;
          gap: 2.5rem;
          align-items: flex-start;
          width: 100%;
        }
        .disease-sidebar {
          width: ${isCollapsed ? '70px' : '250px'};
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          position: sticky;
          top: 6.5rem;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        .disease-content-area {
          flex: 1;
          min-width: 0;
        }
        @media (max-width: 820px) {
          .disease-detail-container {
            flex-direction: column;
            gap: 1.5rem;
          }
          .disease-sidebar {
            width: 100% !important;
            position: relative;
            top: 0;
            gap: 1rem;
            border-bottom: 1.5px solid var(--color-surface-200);
            padding-bottom: 1rem;
          }
          .collapse-toggle-btn {
            display: none !important;
          }
          .disease-tabs-nav {
            flex-direction: row !important;
            overflow-x: auto;
            white-space: nowrap;
            padding-bottom: 0.75rem;
            width: 100%;
            gap: 0.5rem;
            -webkit-overflow-scrolling: touch;
          }
          .disease-tabs-nav::-webkit-scrollbar {
            height: 4px;
          }
          .disease-tabs-nav::-webkit-scrollbar-track {
            background: transparent;
          }
          .disease-tabs-nav::-webkit-scrollbar-thumb {
            background-color: var(--color-surface-300);
            border-radius: 4px;
          }
          .disease-tabs-nav button {
            flex: 0 0 auto !important;
            width: auto !important;
            justify-content: center !important;
            padding: 0.6rem 1.2rem !important;
          }
          .disease-content-area {
            width: 100% !important;
            max-width: 100% !important;
          }
          .disease-card-content {
            padding: 1.25rem 1rem !important;
          }
          .disease-detail-wrapper {
            padding: 1.5rem 1rem;
          }
        }
      `}</style>
    </div>
  )
}
