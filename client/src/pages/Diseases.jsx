import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { FaSearch, FaFilter, FaChevronRight, FaHospital } from 'react-icons/fa'
import api from '../services/api'

const CATEGORIES = [
  { key: '', label: 'Todas' },
  { key: 'diabetes', label: 'Diabetes' },
  { key: 'hipertension', label: 'Hipertensión' },
  { key: 'cardiovascular', label: 'Cardiovascular' },
  { key: 'respiratoria', label: 'Respiratoria' },
  { key: 'cancer', label: 'Cáncer' },
]

export default function Diseases() {
  const [diseases, setDiseases] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const fetchDiseases = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (category) params.category = category
      if (search) params.search = search
      const res = await api.get('/diseases', { params })
      setDiseases(res.data.diseases)
    } catch (err) {
      console.error('Error fetching diseases:', err)
    } finally {
      setLoading(false)
    }
  }, [search, category])

  useEffect(() => {
    const timer = setTimeout(fetchDiseases, 300)
    return () => clearTimeout(timer)
  }, [fetchDiseases])

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-surface-900)', marginBottom: '0.5rem' }}>
          Enfermedades Crónicas
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--color-surface-500)', maxWidth: '600px' }}>
          Información confiable sobre las enfermedades crónicas de mayor prevalencia en jóvenes de Tamaulipas.
          Cada ficha está validada por fuentes institucionales.
        </p>
      </div>

      {/* Search and Filters */}
      <div style={{
        padding: '1.25rem',
        background: 'white',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--color-surface-200)',
        marginBottom: '2rem',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <FaSearch style={{
            position: 'absolute', left: '0.875rem', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--color-surface-400)', fontSize: '0.85rem'
          }} />
          <input
            id="disease-search"
            type="text"
            placeholder="Buscar enfermedad..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '0.7rem 1rem 0.7rem 2.4rem',
              borderRadius: 'var(--radius-lg)', border: '2px solid var(--color-surface-200)',
              fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <FaFilter style={{ color: 'var(--color-surface-400)', fontSize: '0.85rem' }} />
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '2rem',
                border: `2px solid ${category === c.key ? 'var(--color-primary-500)' : 'var(--color-surface-200)'}`,
                background: category === c.key ? 'var(--color-primary-500)' : 'white',
                color: category === c.key ? 'white' : 'var(--color-surface-600)',
                fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Diseases Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{
              height: '180px',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(90deg, var(--color-surface-100), var(--color-surface-200), var(--color-surface-100))',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }} />
          ))}
        </div>
      ) : diseases.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          color: 'var(--color-surface-500)',
        }}>
          <FaSearch size={48} style={{ marginBottom: '1rem', opacity: 0.25 }} />
          <p style={{ fontSize: '1.1rem', marginTop: '1rem' }}>No se encontraron enfermedades con esos criterios.</p>
          <button onClick={() => { setSearch(''); setCategory('') }} style={{
            marginTop: '1rem', padding: '0.6rem 1.5rem', borderRadius: 'var(--radius-lg)',
            border: 'none', background: 'var(--color-primary-500)', color: 'white',
            fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
          }}>
            Ver todos
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {diseases.map(disease => (
            <Link
              key={disease.id}
              to={`/enfermedades/${disease.slug}`}
              className="animate-fade-in-up"
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-xl)',
                background: 'white',
                boxShadow: 'var(--shadow-card)',
                border: '1px solid var(--color-surface-200)',
                transition: 'all 0.25s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-elevated)'
                  e.currentTarget.style.borderColor = disease.colorHex + '60'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)'
                  e.currentTarget.style.borderColor = 'var(--color-surface-200)'
                }}
              >
                {/* Accent bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                  background: disease.colorHex || 'var(--color-primary-500)',
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  {disease.iconEmoji
                    ? <span style={{ fontSize: '2rem' }}>{disease.iconEmoji}</span>
                    : <FaHospital size={32} style={{ color: disease.colorHex || '#871233' }} />}
                  <div style={{
                    padding: '0.25rem 0.75rem', borderRadius: '2rem',
                    background: (disease.colorHex || '#871233') + '15',
                    color: disease.colorHex || 'var(--color-primary-500)',
                    fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {disease.category}
                  </div>
                </div>

                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-surface-900)', marginBottom: '0.5rem' }}>
                  {disease.name}
                </h2>
                <p style={{
                  fontSize: '0.85rem', color: 'var(--color-surface-500)',
                  lineHeight: 1.6,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  marginBottom: '1rem',
                }}>
                  {disease.description}
                </p>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                  color: disease.colorHex || 'var(--color-primary-500)',
                  fontSize: '0.85rem', fontWeight: '600', gap: '0.3rem',
                }}>
                  Ver ficha completa <FaChevronRight size={12} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}