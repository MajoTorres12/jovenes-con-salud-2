import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import api, { getApiBaseUrl } from '../services/api'

const API_BASE = getApiBaseUrl()

// ── Program badge colors ──────────────────────────────────────
const PROGRAM_COLORS = {
  apoyo_economico: { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
  apoyo_especie:   { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' },
  atencion_medica: { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
  orientacion:     { bg: '#ede9fe', color: '#7c3aed', border: '#c4b5fd' },
}

const imgSrc = (img) => {
  if (!img) return ''
  return img.startsWith('http') ? img : `${API_BASE}/${img}`
}

// ── Mini Image Carousel (for cards) ──────────────────────────
function CardCarousel({ images, productName }) {
  const [current, setCurrent] = useState(0)
  const startX = useRef(null)
  const len = images?.length || 0

  const prev = (e) => { e.preventDefault(); e.stopPropagation(); setCurrent(i => (i - 1 + len) % len) }
  const next = (e) => { e.preventDefault(); e.stopPropagation(); setCurrent(i => (i + 1) % len) }

  const onTouchStart = (e) => { startX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (startX.current === null) return
    const delta = startX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 40) setCurrent(i => delta > 0 ? (i + 1) % len : (i - 1 + len) % len)
    startX.current = null
  }

  if (!images || len === 0) {
    return (
      <div style={{ width: '100%', height: '220px', background: 'linear-gradient(135deg, #f8f4f0 0%, #ede8e2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px 12px 0 0' }}>
        <span style={{ fontSize: '3rem' }}>🌿</span>
      </div>
    )
  }

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '220px', overflow: 'hidden', borderRadius: '12px 12px 0 0', userSelect: 'none', background: '#f1ece7' }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      <div style={{ display: 'flex', height: '100%', transition: 'transform 0.35s cubic-bezier(0.25,0.1,0.25,1)', transform: `translateX(-${current * 100}%)`, width: '100%' }}>
        {images.map((img, i) => (
          <div key={i} style={{ flex: '0 0 100%', height: '100%' }}>
            <img src={imgSrc(img)} alt={`${productName} ${i + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.src = `https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&q=70` }}
            />
          </div>
        ))}
      </div>

      {/* Left arrow */}
      {len > 1 && (
        <button onClick={prev} aria-label="Anterior" style={{
          position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
          width: '30px', height: '30px', borderRadius: '50%', border: 'none',
          background: 'rgba(0,0,0,0.45)', color: 'white', cursor: 'pointer',
          fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3,
          backdropFilter: 'blur(4px)', transition: 'background 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.65)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
        >‹</button>
      )}

      {/* Right arrow */}
      {len > 1 && (
        <button onClick={next} aria-label="Siguiente" style={{
          position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
          width: '30px', height: '30px', borderRadius: '50%', border: 'none',
          background: 'rgba(0,0,0,0.45)', color: 'white', cursor: 'pointer',
          fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3,
          backdropFilter: 'blur(4px)', transition: 'background 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.65)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
        >›</button>
      )}

      {/* Image counter badge */}
      {len > 1 && (
        <div style={{
          position: 'absolute', top: '9px', right: '10px',
          background: 'rgba(0,0,0,0.52)', color: 'white',
          fontSize: '0.68rem', fontWeight: '700', padding: '2px 8px',
          borderRadius: '20px', zIndex: 3, letterSpacing: '0.02em',
        }}>
          {current + 1}/{len}
        </div>
      )}

      {/* Dot indicators */}
      {len > 1 && (
        <div style={{ position: 'absolute', bottom: '9px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px', zIndex: 3 }}>
          {images.map((_, i) => (
            <button key={i}
              onClick={e => { e.preventDefault(); e.stopPropagation(); setCurrent(i) }}
              style={{ width: i === current ? '18px' : '7px', height: '7px', borderRadius: '4px', border: 'none', background: i === current ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0, transition: 'all 0.25s' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Product Card ──────────────────────────────────────────────
function ProductCard({ product }) {
  const formatPrice = (price) =>
    price != null
      ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price)
      : 'Consultar precio'

  return (
    <div style={{
      borderRadius: '14px', overflow: 'hidden',
      background: 'var(--color-surface-100)', border: '1px solid var(--color-surface-200)',
      boxShadow: 'var(--shadow-card)',
      display: 'flex', flexDirection: 'column',
      transition: 'box-shadow 0.25s, transform 0.25s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-elevated)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Image carousel */}
      <CardCarousel images={product.images} productName={product.name} />

      {/* Product Name */}
      <div style={{ padding: '14px 14px 0' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--color-surface-900)', margin: 0, lineHeight: 1.35 }}>
          {product.name}
        </h3>
      </div>

      {/* Card body */}
      <div style={{ padding: '10px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#871233', letterSpacing: '-0.01em' }}>
            {formatPrice(product.price)}
          </span>
          {product.price && <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600' }}>MXN</span>}
        </div>

        {/* Description */}
        {product.description && (
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
            {product.description}
          </p>
        )}

        {/* Disease/benefit tag */}
        {product.benefits?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {product.benefits.slice(0, 2).map((b, i) => (
              <span key={i} style={{ fontSize: '0.75rem', color: '#871233', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#871233' }}>✓</span> {b}
              </span>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <Link
            to={`/nutraceuticos/${product.slug}`}
            style={{
              flex: 1, padding: '8px 0', borderRadius: '8px', fontSize: '0.8rem',
              fontWeight: '600', textAlign: 'center', textDecoration: 'none',
              border: '1.5px solid #871233', color: '#871233', background: 'white',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#871233'; e.currentTarget.style.color = 'white' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#871233' }}
          >
            Ver detalles
          </Link>
          {product.purchaseUrl && (
            <a
              href={product.purchaseUrl} target="_blank" rel="noopener noreferrer"
              style={{
                flex: 1.4, padding: '8px 0', borderRadius: '8px', border: 'none',
                background: 'linear-gradient(135deg, #871233, #5e0c23)',
                color: 'white', fontSize: '0.8rem', fontWeight: '700',
                textAlign: 'center', textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              🛒 Compra Aquí
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Filter bar ────────────────────────────────────────────────
function FilterBar({ filter, setFilter }) {
  const filters = [
    { key: 'all', label: 'Todos' },
    { key: 'diabetes', label: 'Diabetes' },
    { key: 'hipertension', label: 'Hipertensión' },
    { key: 'cardiovascular', label: 'Cardiovascular' },
  ]
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {filters.map(f => (
        <button
          key={f.key}
          onClick={() => setFilter(f.key)}
          style={{
            padding: '6px 18px', borderRadius: '30px', fontSize: '0.8rem', fontWeight: '600',
            cursor: 'pointer', border: '1.5px solid',
            borderColor: filter === f.key ? '#871233' : '#e2d8d0',
            background: filter === f.key ? '#871233' : 'white',
            color: filter === f.key ? 'white' : '#64748b',
            transition: 'all 0.2s',
          }}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function Nutraceuticals() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/nutraceuticals')
      .then(r => setProducts(r.data.products || []))
      .catch(() => setError('No se pudo cargar el catálogo. Intenta de nuevo.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all'
    ? products
    : products.filter(p => p.disease?.category === filter || p.disease?.slug?.includes(filter))

  return (
    <div style={{ background: 'var(--color-surface-50)', minHeight: '100vh' }}>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section style={{
        background: 'var(--hero-gradient)',
        padding: '4.5rem 1.5rem 3.5rem',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(194,163,120,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span style={{ display: 'inline-block', padding: '5px 18px', borderRadius: '30px', background: 'rgba(194,163,120,0.18)', border: '1px solid rgba(194,163,120,0.35)', color: '#d4a96a', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.1rem' }}>
            🌿 Bienestar Natural
          </span>
          <h1 style={{ fontSize: 'clamp(1.9rem, 5vw, 2.9rem)', fontWeight: '900', color: 'white', margin: '0 0 0.9rem', lineHeight: 1.15 }}>
            Productos Nutracéuticos
          </h1>
          <p style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', color: 'rgba(255,255,255,0.72)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.7 }}>
            Complementos nutricionales seleccionados para apoyar tu salud. Algunos de estos productos están vinculados a nuestros programas sociales vigentes.
          </p>
        </div>
      </section>

      {/* ── Content ───────────────────────────────────────── */}
      <section style={{ maxWidth: '1320px', margin: '0 auto', padding: '3rem 1.5rem 4rem' }}>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div className="spinner" />
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Cargando productos...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</p>
            <p style={{ color: '#ef4444', fontWeight: '600' }}>{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌿</p>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>Próximamente</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Estamos preparando nuestro catálogo de productos nutracéuticos.</p>
          </div>
        )}

        {/* Catalog */}
        {!loading && !error && products.length > 0 && (
          <>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', margin: '0 0 0.25rem' }}>
                  Catálogo de Productos
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                  {filtered.length} {filtered.length === 1 ? 'producto disponible' : 'productos disponibles'}
                </p>
              </div>
              <FilterBar filter={filter} setFilter={setFilter} />
            </div>

            {/* 4-column grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1.25rem',
            }}
              className="nutra-grid"
            >
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                <p style={{ fontSize: '1rem' }}>No hay productos para este filtro.</p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1100px) { .nutra-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 768px)  { .nutra-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 480px)  { .nutra-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
