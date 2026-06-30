import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FaNewspaper, FaThumbtack } from 'react-icons/fa'
import api, { getApiBaseUrl } from '../services/api'

const API_BASE = getApiBaseUrl()
const imgSrc = (p) => !p ? null : p.startsWith('http') ? p : `/${p}`

const fmt = (d) => d ? new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

function NewsCard({ post }) {
  return (
    <Link
      to={`/noticias/${post.slug}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        background: 'var(--color-surface-100)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: '1px solid var(--color-surface-300)',
        boxShadow: 'var(--shadow-card)',
        transition: 'all 0.25s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-elevated)'
        e.currentTarget.style.borderColor = 'rgba(135, 18, 51, 0.3)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'var(--shadow-card)'
        e.currentTarget.style.borderColor = 'var(--color-surface-300)'
      }}
    >
      {/* Cover image */}
      <div style={{ height: '210px', overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))' }}>
        {imgSrc(post.coverImage)
          ? <img src={imgSrc(post.coverImage)} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaNewspaper size={48} color="rgba(255,255,255,0.3)" /></div>
        }
        {post.isPinned && (
          <span style={{
            position: 'absolute', top: '12px', left: '12px',
            padding: '4px 12px', borderRadius: '20px',
            background: 'var(--color-primary-500)', color: 'white',
            fontSize: '0.68rem', fontWeight: '700',
            display: 'flex', alignItems: 'center', gap: '5px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
          }}>
            <FaThumbtack size={9} /> Destacada
          </span>
        )}
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--color-surface-500)', fontWeight: '600', margin: 0 }}>{fmt(post.publishedAt)}</p>
        
        <h3 style={{
          fontSize: '1.05rem',
          fontWeight: '700',
          color: 'var(--color-surface-900)',
          lineHeight: 1.4,
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '2.8rem'
        }}>
          {post.title}
        </h3>
        
        {post.excerpt && (
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--color-surface-600)',
            lineHeight: 1.6,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '4.08rem'
          }}>
            {post.excerpt}
          </p>
        )}
        
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: '0.5rem',
          fontSize: '0.8rem',
          fontWeight: '700',
          color: 'var(--color-primary-500)',
        }}>
          Leer más →
        </span>
      </div>
    </Link>
  )
}

export default function News() {
  const [posts, setPosts] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get('page') || '1')

  useEffect(() => {
    setLoading(true)
    api.get(`/news?page=${page}&limit=9`)
      .then(r => {
        setPosts(r.data.posts)
        setTotal(r.data.total)
        setTotalPages(r.data.totalPages)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  const goPage = (p) => {
    setSearchParams({ page: p })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div style={{ background: 'var(--color-surface-50)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Banner Superior / Hero */}
      <section style={{
        background: 'var(--hero-gradient)',
        padding: '5rem 1.5rem',
        textAlign: 'center',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{
          fontSize: '0.8rem',
          fontWeight: '700',
          letterSpacing: '0.2em',
          color: 'rgba(255, 255, 255, 0.7)',
          textTransform: 'uppercase',
          marginBottom: '0.75rem',
          fontFamily: 'var(--font-sans)',
        }}>
          Jóvenes con Salud
        </p>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
          fontWeight: '800',
          color: 'white',
          marginBottom: '1rem',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}>
          Noticias
        </h1>
        <p style={{
          color: 'rgba(255, 255, 255, 0.85)',
          fontSize: '1.05rem',
          maxWidth: '550px',
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          Mantente informado con las últimas noticias y novedades del Instituto de la Juventud de Tamaulipas.
        </p>
      </section>

      {/* Main Content Area */}
      <div style={{ maxWidth: '1140px', width: '100%', margin: '0 auto', padding: '2.5rem 1.5rem', flex: 1 }}>
        {/* Count indicator */}
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--color-surface-500)',
          marginBottom: '2rem',
          fontWeight: '600'
        }}>
          {loading ? 'Cargando...' : `${total} noticia${total !== 1 ? 's' : ''} publicada${total !== 1 ? 's' : ''}`}
        </p>

        {/* Loading / Empty / Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: '380px',
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(90deg, var(--color-surface-100) 25%, var(--color-surface-200) 37%, var(--color-surface-100) 63%)',
                backgroundSize: '400% 100%',
                animation: 'pulse-soft 1.5s infinite'
              }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--color-surface-100)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-surface-300)' }}>
            <FaNewspaper size={48} style={{ marginBottom: '1.25rem', color: 'var(--color-surface-400)' }} />
            <p style={{ fontWeight: '600', color: 'var(--color-surface-800)', margin: 0 }}>No hay noticias publicadas aún</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {posts.map(p => <NewsCard key={p.id} post={p} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '3.5rem' }}>
            <button
              onClick={() => goPage(page - 1)}
              disabled={page === 1}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '10px',
                border: '1.5px solid var(--color-surface-300)',
                background: 'var(--color-surface-100)',
                color: page === 1 ? 'var(--color-surface-400)' : 'var(--color-surface-800)',
                fontWeight: '600',
                cursor: page === 1 ? 'default' : 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s',
              }}
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => goPage(n)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  border: n === page ? 'none' : '1.5px solid var(--color-surface-300)',
                  background: n === page ? 'var(--color-primary-500)' : 'var(--color-surface-100)',
                  color: n === page ? 'white' : 'var(--color-surface-800)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s',
                }}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => goPage(page + 1)}
              disabled={page === totalPages}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '10px',
                border: '1.5px solid var(--color-surface-300)',
                background: 'var(--color-surface-100)',
                color: page === totalPages ? 'var(--color-surface-400)' : 'var(--color-surface-800)',
                fontWeight: '600',
                cursor: page === totalPages ? 'default' : 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s',
              }}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
