import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FaArrowLeft, FaExternalLinkAlt, FaCheckCircle, FaExclamationTriangle, FaHeartbeat, FaBandAid, FaShieldAlt, FaYoutube } from 'react-icons/fa'
import api from '../services/api'

export default function DiseaseDetail() {
  const { id: slug } = useParams()
  const [disease, setDisease] = useState(null)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
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

  const symptoms = Array.isArray(disease.symptoms) ? disease.symptoms : (disease.symptoms ? JSON.parse(disease.symptoms) : [])
  const riskFactors = Array.isArray(disease.riskFactors) ? disease.riskFactors : (disease.riskFactors ? JSON.parse(disease.riskFactors) : [])
  const resources = Array.isArray(disease.externalResources) ? disease.externalResources : (disease.externalResources ? JSON.parse(disease.externalResources) : [])
  const color = disease.colorHex || '#871233'

  const tabs = [
    { id: 'general', label: 'General y Tratamiento' },
    { id: 'symptoms', label: 'Síntomas y Riesgos' },
    { id: 'videos', label: 'Videos Informativos' },
    { id: 'resources', label: 'Recursos y Artículos' }
  ]

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Back */}
      <Link to="/enfermedades" style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        color: 'var(--color-surface-500)', textDecoration: 'none', fontSize: '0.9rem',
        fontWeight: '500', marginBottom: '1.5rem',
        transition: 'color 0.2s',
      }}>
        <FaArrowLeft size={12} /> Volver al catálogo
      </Link>

      {/* Hero */}
      <div style={{
        padding: '2rem', marginBottom: '2rem',
        borderRadius: 'var(--radius-2xl)',
        background: `linear-gradient(135deg, ${color}15, ${color}05)`,
        border: `1px solid ${color}30`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '6px', height: '100%',
          background: color,
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', paddingLeft: '0.75rem' }}>
          <span style={{ fontSize: '3rem' }}>{disease.iconEmoji || '🏥'}</span>
          <div>
            <div style={{
              display: 'inline-block', padding: '0.2rem 0.75rem', borderRadius: '2rem',
              background: color + '25', color, fontSize: '0.75rem', fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem',
            }}>
              {disease.category}
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-surface-900)', lineHeight: 1.2 }}>
              {disease.name}
            </h1>
          </div>
        </div>
        <p style={{ paddingLeft: '0.75rem', fontSize: '0.95rem', color: 'var(--color-surface-600)', lineHeight: 1.8, maxWidth: '700px', margin: '0 0 1.25rem 0' }}>
          {disease.description}
        </p>
        <div style={{ paddingLeft: '0.75rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 0.85rem', borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.08)', color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            fontSize: '0.75rem', fontWeight: '700',
          }}>
            <FaShieldAlt size={12} />
            Ficha Médica Validada por: {disease.validatedBy || 'Secretaría de Salud de Tamaulipas'}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid var(--color-surface-200)',
        marginBottom: '1.5rem',
        gap: '0.5rem',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
      }} className="hide-scrollbar">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '0.75rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: `3px solid ${activeTab === t.id ? color : 'transparent'}`,
              color: activeTab === t.id ? 'var(--color-surface-900)' : 'var(--color-surface-500)',
              fontWeight: activeTab === t.id ? '700' : '500',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: 'none',
              marginBottom: '-2px',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {disease.treatment ? (
            <div style={{
              padding: '1.75rem', borderRadius: 'var(--radius-xl)',
              background: 'white', boxShadow: 'var(--shadow-card)',
              border: '1px solid var(--color-surface-200)',
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-surface-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaBandAid style={{ color: '#10b981' }} /> Recomendaciones de Tratamiento
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-surface-700)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {disease.treatment}
              </p>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--color-surface-400)', padding: '2rem' }}>No hay información de tratamiento registrada aún.</p>
          )}
        </div>
      )}

      {activeTab === 'symptoms' && (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {/* Symptoms */}
          {symptoms.length > 0 ? (
            <div style={{
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
                    {s}
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
            <div style={{
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
                    {r}
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

      {activeTab === 'videos' && (
        <div>
          {disease.youtubeVideos && disease.youtubeVideos.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {disease.youtubeVideos.map((v, i) => (
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
    </div>
  )
}
