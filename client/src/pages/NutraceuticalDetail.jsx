import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import api, { getApiBaseUrl } from '../services/api'

const API_BASE = getApiBaseUrl()

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

// ── Full gallery with side arrows + thumbnail strip ───────────
function FullGallery({ images, productName }) {
  const [current, setCurrent] = useState(0)
  const startX = useRef(null)
  const len = images?.length || 0

  const prev = () => setCurrent(i => (i - 1 + len) % len)
  const next = () => setCurrent(i => (i + 1) % len)

  const onTouchStart = (e) => { startX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (startX.current === null) return
    const delta = startX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 40) setCurrent(i => delta > 0 ? (i + 1) % len : (i - 1 + len) % len)
    startX.current = null
  }

  if (!images || len === 0) {
    return (
      <div style={{ aspectRatio: '4/3', background: 'linear-gradient(135deg, #f8f4f0, #ede8e2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>
        🌿
      </div>
    )
  }

  return (
    <div>
      {/* Main image with arrow buttons */}
      <div
        style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: '16px', overflow: 'hidden', background: '#f1ece7', userSelect: 'none' }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      >
        <img
          key={current}
          src={imgSrc(images[current])}
          alt={`${productName} ${current + 1}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeIn 0.25s' }}
          onError={e => { e.target.src = `https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600&q=80` }}
        />

        {/* Left arrow */}
        {len > 1 && (
          <button onClick={prev} aria-label="Imagen anterior" style={{
            position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
            width: '40px', height: '40px', borderRadius: '50%', border: 'none',
            background: 'rgba(0,0,0,0.42)', color: 'white', fontSize: '1.4rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 3, backdropFilter: 'blur(4px)', transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.65)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.42)'}
          >‹</button>
        )}

        {/* Right arrow */}
        {len > 1 && (
          <button onClick={next} aria-label="Siguiente imagen" style={{
            position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
            width: '40px', height: '40px', borderRadius: '50%', border: 'none',
            background: 'rgba(0,0,0,0.42)', color: 'white', fontSize: '1.4rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 3, backdropFilter: 'blur(4px)', transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.65)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.42)'}
          >›</button>
        )}

        {/* Dot indicators */}
        {len > 1 && (
          <div style={{ position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 3 }}>
            {images.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                style={{ width: i === current ? '22px' : '8px', height: '8px', borderRadius: '4px', border: 'none', background: i === current ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0, transition: 'all 0.25s' }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip below main image */}
      {len > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
          {images.map((img, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              style={{
                width: '70px', height: '70px', borderRadius: '10px', overflow: 'hidden',
                border: i === current ? '2.5px solid #871233' : '2.5px solid transparent',
                padding: 0, cursor: 'pointer', background: '#f1ece7', flexShrink: 0,
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: i === current ? '0 0 0 2px rgba(135,18,51,0.2)' : 'none',
              }}
            >
              <img src={imgSrc(img)} alt={`Miniatura ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.src = `https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=150&q=70` }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AccordionSection({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ border: '1px solid var(--color-surface-200)', borderRadius: '12px', overflow: 'hidden', marginBottom: '10px' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '1rem 1.25rem', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: open ? 'var(--color-surface-200)' : 'var(--color-surface-100)', transition: 'background 0.2s',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: 'var(--color-surface-900)', fontSize: '0.95rem' }}>
          {icon} {title}
        </span>
        <span style={{ color: 'var(--color-primary-500)', fontSize: '1rem', transition: 'transform 0.25s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', display: 'flex' }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--color-surface-200)', background: 'var(--color-surface-200)', animation: 'fadeIn 0.2s' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── Main Detail Page ──────────────────────────────────────────
export default function NutraceuticalDetail() {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/nutraceuticals/${slug}`)
      .then(r => setProduct(r.data.product))
      .catch(err => {
        if (err.response?.status === 404) setError('Producto no encontrado')
        else setError('Error al cargar el producto')
      })
      .finally(() => setLoading(false))
  }, [slug])

  const formatPrice = (price) =>
    price != null
      ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price)
      : 'Consultar precio'

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <div className="spinner" />
      <p style={{ color: '#94a3b8' }}>Cargando producto...</p>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ fontSize: '3rem' }}>⚠️</p>
      <p style={{ color: '#ef4444', fontWeight: '600' }}>{error}</p>
      <Link to="/nutraceuticos" style={{ color: '#871233', fontWeight: '600', textDecoration: 'none' }}>← Volver al catálogo</Link>
    </div>
  )

  return (
    <div style={{ background: 'var(--color-surface-50)', minHeight: '100vh' }}>

      {/* Breadcrumb */}
      <div style={{ background: 'var(--color-surface-100)', borderBottom: '1px solid var(--color-surface-200)', padding: '0.75rem 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Inicio</Link>
          <span>›</span>
          <Link to="/nutraceuticos" style={{ color: '#94a3b8', textDecoration: 'none' }}>Nutracéuticos</Link>
          <span>›</span>
          <span style={{ color: '#1e293b', fontWeight: '600' }}>{product.name}</span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
        <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '3rem', alignItems: 'start' }}>

          {/* Left: Gallery */}
          <FullGallery images={product.images} productName={product.name} />

          {/* Right: Info panel */}
          <div>
            {/* Program badges */}
            {product.socialPrograms?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1.1rem' }}>
                {product.socialPrograms.filter(p => p.isActive).map((prog, idx) => {
                  const c = PROGRAM_COLORS[prog.type] || { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' }
                  return (
                    <span key={idx} style={{
                      padding: '5px 14px', borderRadius: '8px',
                      background: c.bg, color: c.color,
                      border: `1px solid ${c.border}`,
                      fontSize: '0.78rem', fontWeight: '700',
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                    }}>
                      📋 Vinculado: {prog.name}
                    </span>
                  )
                })}
              </div>
            )}

            {/* Disease tag */}
            {product.disease && (
              <span style={{
                display: 'inline-block', padding: '4px 12px', borderRadius: '30px',
                background: '#fff1f3', color: '#871233', border: '1.5px solid #fecdd3',
                fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.9rem',
              }}>
                🏥 {product.disease.name}
              </span>
            )}

            {/* Product name */}
            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: '900', color: 'var(--color-surface-900)', margin: '0 0 0.6rem', lineHeight: 1.2 }}>
              {product.name}
            </h1>

            {/* Price box */}
            <div style={{ background: 'var(--color-surface-100)', border: '1px solid var(--color-surface-200)', borderRadius: '14px', padding: '1.1rem 1.25rem', margin: '1rem 0 1.4rem', boxShadow: 'var(--shadow-card)' }}>
              <p style={{ margin: '0 0 0.2rem', fontSize: '0.7rem', fontWeight: '800', color: 'var(--color-primary-500)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Precio</p>
              <p style={{ margin: '0 0 0.15rem', fontSize: '2.1rem', fontWeight: '900', color: 'var(--color-primary-500)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {formatPrice(product.price)}
              </p>
              {product.price && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>Precio en pesos mexicanos (MXN)</p>}
            </div>

            {/* Buy button */}
            {product.purchaseUrl && (
              <a href={product.purchaseUrl} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%', padding: '1rem', borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
                  color: 'white', fontWeight: '800', fontSize: '1rem',
                  textDecoration: 'none', letterSpacing: '0.01em',
                  boxShadow: 'var(--shadow-glow)',
                  transition: 'all 0.2s', marginBottom: '0.85rem',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                🛒 Compra Aquí
              </a>
            )}

            {/* Back link */}
            <Link to="/nutraceuticos"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                width: '100%', padding: '0.8rem', borderRadius: '10px',
                border: '1.5px solid var(--color-surface-200)', color: 'var(--color-surface-600)', background: 'var(--color-surface-100)',
                fontWeight: '600', fontSize: '0.875rem', textDecoration: 'none',
                marginBottom: '1.75rem', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary-500)'; e.currentTarget.style.color = 'var(--color-primary-500)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-surface-200)'; e.currentTarget.style.color = 'var(--color-surface-600)' }}
            >
              ← Volver al catálogo
            </Link>

            {/* Accordion sections */}
            {product.description && (
              <AccordionSection title="Descripción" icon="📋" defaultOpen>
                <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.75, margin: '1rem 0 0' }}>
                  {product.description}
                </p>
              </AccordionSection>
            )}

            {product.ingredients?.length > 0 && (
              <AccordionSection title="Ingredientes" icon="🌿">
                <ul style={{ margin: '1rem 0 0', padding: '0 0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {product.ingredients.map((ing, i) => (
                    <li key={i} style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.55 }}>{ing}</li>
                  ))}
                </ul>
              </AccordionSection>
            )}

            {product.benefits?.length > 0 && (
              <AccordionSection title="Beneficios" icon="✨">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '1rem' }}>
                  {product.benefits.map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#16a34a', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0, marginTop: '1px' }}>✓</span>
                      <p style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.55, margin: 0 }}>{b}</p>
                    </div>
                  ))}
                </div>
              </AccordionSection>
            )}
          </div>
        </div>
      </div>

      {/* Responsive + animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @media (max-width: 768px) {
          .detail-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
        }
      `}</style>
    </div>
  )
}
