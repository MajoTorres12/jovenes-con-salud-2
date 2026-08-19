import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import api, { getApiBaseUrl } from '../services/api'
import { useTheme } from '../context/ThemeContext'

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
function FullGallery({ images, productName, dark }) {
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
      <div style={{
        aspectRatio: '4/3',
        background: dark ? 'var(--color-surface-200)' : 'linear-gradient(135deg, #f8f4f0, #ede8e2)',
        borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem'
      }}>
        🌿
      </div>
    )
  }

  return (
    <div>
      {/* Main image with arrow buttons */}
      <div
        style={{
          position: 'relative', width: '100%', aspectRatio: '4/3',
          borderRadius: '16px', overflow: 'hidden',
          background: dark ? 'var(--color-surface-200)' : '#f1ece7',
          userSelect: 'none',
          border: dark ? '1px solid var(--color-surface-300)' : '1px solid var(--color-surface-200)'
        }}
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
            background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '1.4rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 3, backdropFilter: 'blur(4px)', transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.75)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
          >‹</button>
        )}

        {/* Right arrow */}
        {len > 1 && (
          <button onClick={next} aria-label="Siguiente imagen" style={{
            position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
            width: '40px', height: '40px', borderRadius: '50%', border: 'none',
            background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '1.4rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 3, backdropFilter: 'blur(4px)', transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.75)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
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
                border: i === current
                  ? (dark ? '2.5px solid var(--color-primary-500)' : '2.5px solid #871233')
                  : '2.5px solid transparent',
                padding: 0, cursor: 'pointer', background: dark ? 'var(--color-surface-200)' : '#f1ece7', flexShrink: 0,
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: i === current ? '0 0 0 2px rgba(224,59,96,0.3)' : 'none',
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

function AccordionSection({ title, icon, children, defaultOpen = false, dark }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{
      border: dark ? '1px solid var(--color-surface-300)' : '1px solid var(--color-surface-200)',
      borderRadius: '12px', overflow: 'hidden', marginBottom: '10px',
      background: dark ? 'var(--color-surface-100)' : 'white'
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '1rem 1.25rem', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: open ? (dark ? 'var(--color-surface-200)' : 'var(--color-surface-50)') : 'transparent',
          transition: 'background 0.2s',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: dark ? '#ffffff' : 'var(--color-surface-900)', fontSize: '0.95rem' }}>
          {icon} {title}
        </span>
        <span style={{ color: dark ? 'var(--color-primary-500)' : 'var(--color-primary-500)', fontSize: '1rem', transition: 'transform 0.25s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', display: 'flex' }}>▾</span>
      </button>
      {open && (
        <div style={{
          padding: '0 1.25rem 1.25rem',
          borderTop: dark ? '1px solid var(--color-surface-300)' : '1px solid var(--color-surface-200)',
          background: open ? (dark ? 'var(--color-surface-200)' : 'var(--color-surface-50)') : 'transparent',
          animation: 'fadeIn 0.2s'
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── Main Detail Page ──────────────────────────────────────────
export default function NutraceuticalDetail() {
  const { dark } = useTheme()
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const logoSrc = dark ? '/images/hecho-en-tamaulipas-dark.png' : '/images/hecho-en-tamaulipas-light.png'

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
      <p style={{ color: dark ? 'var(--color-surface-500)' : '#94a3b8' }}>Cargando detalles del producto...</p>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ fontSize: '3rem' }}>⚠️</p>
      <p style={{ color: '#ef4444', fontWeight: '600' }}>{error}</p>
      <Link to="/hecho-en-tamaulipas" style={{ color: dark ? '#fca5b7' : '#871233', fontWeight: '700', textDecoration: 'none' }}>
        ← Volver a Hecho en Tamaulipas
      </Link>
    </div>
  )

  return (
    <div style={{ background: 'var(--color-surface-50)', minHeight: '100vh' }}>

      {/* Breadcrumb */}
      <div style={{
        background: dark ? 'var(--color-surface-100)' : 'white',
        borderBottom: dark ? '1px solid var(--color-surface-300)' : '1px solid var(--color-surface-200)',
        padding: '0.75rem 1.5rem'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: dark ? 'var(--color-surface-500)' : '#94a3b8' }}>
          <Link to="/" style={{ color: dark ? 'var(--color-surface-500)' : '#94a3b8', textDecoration: 'none' }}>Inicio</Link>
          <span>›</span>
          <Link to="/hecho-en-tamaulipas" style={{ color: dark ? '#fca5b7' : '#871233', textDecoration: 'none', fontWeight: '600' }}>
            Hecho en Tamaulipas
          </Link>
          <span>›</span>
          <span style={{ color: dark ? '#ffffff' : '#1e293b', fontWeight: '700' }}>{product.name}</span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
        <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '3rem', alignItems: 'start' }}>

          {/* Left: Gallery */}
          <FullGallery images={product.images} productName={product.name} dark={dark} />

          {/* Right: Info panel */}
          <div>
            {/* Sello Hecho en Tamaulipas Banner */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: dark ? 'rgba(224, 59, 96, 0.15)' : 'linear-gradient(135deg, rgba(135,18,51,0.08), rgba(212,169,106,0.12))',
              border: dark ? '1px solid rgba(224, 59, 96, 0.35)' : '1px solid rgba(135,18,51,0.2)',
              borderRadius: '12px', padding: '0.65rem 0.9rem', marginBottom: '1rem'
            }}>
              <img
                src={logoSrc}
                alt="Hecho en Tamaulipas"
                style={{ width: '42px', height: '42px', objectFit: 'contain', borderRadius: '50%', flexShrink: 0 }}
              />
              <div>
                <strong style={{ fontSize: '0.82rem', color: dark ? '#ffffff' : '#871233', display: 'block' }}>
                  Acreditado: Hecho en Tamaulipas
                </strong>
                <span style={{ fontSize: '0.72rem', color: dark ? '#d4a96a' : 'var(--color-accent-800)' }}>
                  Producto saludable de origen estatal certificado
                </span>
              </div>
            </div>

            {/* Disease tag */}
            {product.disease && (
              <span style={{
                display: 'inline-block', padding: '4px 12px', borderRadius: '30px',
                background: dark ? 'rgba(59, 130, 246, 0.15)' : '#fff1f3',
                color: dark ? '#60a5fa' : '#871233',
                border: dark ? '1px solid rgba(59, 130, 246, 0.35)' : '1.5px solid #fecdd3',
                fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.9rem',
              }}>
                🏥 Apoyo preventivo: {product.disease.name}
              </span>
            )}

            {/* Product name */}
            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: '900', color: dark ? '#ffffff' : 'var(--color-surface-900)', margin: '0 0 0.6rem', lineHeight: 1.2 }}>
              {product.name}
            </h1>

            {/* Price box */}
            <div style={{
              background: dark ? 'var(--color-surface-100)' : 'white',
              border: dark ? '1px solid var(--color-surface-300)' : '1px solid var(--color-surface-200)',
              borderRadius: '14px', padding: '1.1rem 1.25rem', margin: '1rem 0 1.4rem',
              boxShadow: 'var(--shadow-card)'
            }}>
              <p style={{ margin: '0 0 0.2rem', fontSize: '0.7rem', fontWeight: '800', color: dark ? '#fca5b7' : 'var(--color-primary-500)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Precio Directo
              </p>
              <p style={{ margin: '0 0 0.15rem', fontSize: '2.1rem', fontWeight: '900', color: dark ? '#fca5b7' : 'var(--color-primary-500)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {formatPrice(product.price)}
              </p>
              {product.price && <p style={{ margin: 0, fontSize: '0.75rem', color: dark ? 'var(--color-surface-500)' : 'var(--color-surface-500)' }}>Precio en pesos mexicanos (MXN)</p>}
            </div>

            {/* Buy button */}
            {product.purchaseUrl && (
              <a href={product.purchaseUrl} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%', padding: '1rem', borderRadius: '12px',
                  background: dark
                    ? 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))'
                    : 'linear-gradient(135deg, #871233, #5e0c23)',
                  color: 'white', fontWeight: '800', fontSize: '1rem',
                  textDecoration: 'none', letterSpacing: '0.01em',
                  boxShadow: 'var(--shadow-glow)',
                  transition: 'all 0.2s', marginBottom: '0.85rem',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                🛒 Adquirir Producto Oficial
              </a>
            )}

            {/* Back link */}
            <Link to="/hecho-en-tamaulipas"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                width: '100%', padding: '0.8rem', borderRadius: '10px',
                border: dark ? '1.5px solid var(--color-surface-300)' : '1.5px solid var(--color-surface-200)',
                color: dark ? '#ffffff' : 'var(--color-surface-600)',
                background: dark ? 'var(--color-surface-200)' : 'var(--color-surface-100)',
                fontWeight: '700', fontSize: '0.875rem', textDecoration: 'none',
                marginBottom: '1.75rem', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary-500)'; e.currentTarget.style.color = 'var(--color-primary-500)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? 'var(--color-surface-300)' : 'var(--color-surface-200)'; e.currentTarget.style.color = dark ? '#ffffff' : 'var(--color-surface-600)' }}
            >
              ← Volver al catálogo Hecho en Tamaulipas
            </Link>

            {/* Accordion sections */}
            {product.description && (
              <AccordionSection title="Descripción del Producto" icon="📋" defaultOpen dark={dark}>
                <p style={{ color: dark ? 'var(--color-surface-600)' : '#475569', fontSize: '0.9rem', lineHeight: 1.75, margin: '1rem 0 0' }}>
                  {product.description}
                </p>
              </AccordionSection>
            )}

            {product.ingredients?.length > 0 && (
              <AccordionSection title="Ingredientes de Calidad" icon="🌿" dark={dark}>
                <ul style={{ margin: '1rem 0 0', padding: '0 0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {product.ingredients.map((ing, i) => (
                    <li key={i} style={{ color: dark ? 'var(--color-surface-600)' : '#475569', fontSize: '0.875rem', lineHeight: 1.55 }}>{ing}</li>
                  ))}
                </ul>
              </AccordionSection>
            )}

            {product.benefits?.length > 0 && (
              <AccordionSection title="Propiedades y Beneficios para la Salud" icon="✨" dark={dark}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '1rem' }}>
                  {product.benefits.map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0, marginTop: '1px' }}>✓</span>
                      <p style={{ color: dark ? 'var(--color-surface-600)' : '#475569', fontSize: '0.875rem', lineHeight: 1.55, margin: 0 }}>{b}</p>
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
