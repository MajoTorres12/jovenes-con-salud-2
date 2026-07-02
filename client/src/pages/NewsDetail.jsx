import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { getApiBaseUrl } from '../services/api'
import { FaCalendarAlt, FaPen, FaCamera } from 'react-icons/fa'

const API_BASE = getApiBaseUrl()
const imgSrc = (p) => !p ? null : p.startsWith('http') ? p : `${API_BASE}/${p}`
const fmt = (d) => d ? new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

function parseMarkdown(text, images = []) {
  if (!text) return ''
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/g, '<u>$1</u>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*?)$/gm, '<h4 style="font-size:1.15rem;font-weight:700;margin-top:1.5rem;margin-bottom:0.75rem;">$1</h4>')
    .replace(/^## (.*?)$/gm, '<h3 style="font-size:1.3rem;font-weight:800;margin-top:1.75rem;margin-bottom:1rem;color:var(--color-surface-900);">$1</h3>')
    .replace(/^# (.*?)$/gm, '<h2 style="font-size:1.5rem;font-weight:900;margin-top:2rem;margin-bottom:1.25rem;color:var(--color-surface-900);">$1</h2>')

  // Process inline image placeholders: {IMAGEN_1}, {IMAGE_1}, [imagen1] etc.
  if (Array.isArray(images) && images.length > 0) {
    images.forEach((imgUrl, index) => {
      const imgNum = index + 1
      const src = !imgUrl ? null : imgUrl.startsWith('http') ? imgUrl : `${API_BASE}/${imgUrl}`
      if (src) {
        const imgHtml = `
          <div class="inline-news-image-wrapper" style="
            margin: 2.5rem 0;
            display: flex;
            flex-direction: column;
            align-items: center;
          ">
            <img src="${src}" alt="Imagen ${imgNum}" style="width:100%; max-height:480px; object-fit:cover; border-radius:var(--radius-xl); border:1px solid var(--color-surface-300); box-shadow:var(--shadow-card);" />
          </div>
        `
        const placeholders = [
          `{IMAGEN_${imgNum}}`, `{imagen_${imgNum}}`, `{IMAGEN${imgNum}}`, `{imagen${imgNum}}`,
          `{IMAGE_${imgNum}}`, `{image_${imgNum}}`, `{IMAGE${imgNum}}`, `{image${imgNum}}`,
          `[imagen_${imgNum}]`, `[imagen${imgNum}]`, `[image_${imgNum}]`, `[image${imgNum}]`,
          `[IMAGEN_${imgNum}]`, `[IMAGEN${imgNum}]`, `[IMAGE_${imgNum}]`, `[IMAGE${imgNum}]`
        ]
        placeholders.forEach(pl => {
          html = html.split(pl).join(imgHtml)
        })
      }
    })
  }

  return html
    .split('\n\n')
    .map(para => {
      const trimmed = para.trim()
      if (!trimmed) return ''
      if (trimmed.startsWith('<h') || trimmed.startsWith('\n          <div class="inline-news-image-wrapper"') || trimmed.startsWith('<div class="inline-news-image-wrapper"')) return trimmed
      return `<p style="margin-bottom:1.25rem;line-height:1.85;color:var(--color-surface-900);">${trimmed.replace(/\n/g, '<br/>')}</p>`
    })
    .join('\n')
}

export default function NewsDetail() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/news/${slug}`)
      .then(r => setPost(r.data.post))
      .catch(e => setError(e.response?.status === 404 ? 'Noticia no encontrada' : 'Error al cargar'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column', gap: '1rem' }}>
      <div className="spinner" /><p>Cargando noticia...</p>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ fontSize: '3rem' }}>⚠️</p>
      <p style={{ color: '#ef4444', fontWeight: '600' }}>{error}</p>
      <Link to="/noticias" style={{ color: 'var(--color-primary-500)', fontWeight: '600', textDecoration: 'none' }}>← Volver a noticias</Link>
    </div>
  )

  const cover = imgSrc(post.coverImage)

  const contentHasPlaceholder = (index) => {
    if (!post || !post.content) return false
    const imgNum = index + 1
    const placeholders = [
      `{IMAGEN_${imgNum}}`, `{imagen_${imgNum}}`, `{IMAGEN${imgNum}}`, `{imagen${imgNum}}`,
      `{IMAGE_${imgNum}}`, `{image_${imgNum}}`, `{IMAGE${imgNum}}`, `{image${imgNum}}`,
      `[imagen_${imgNum}]`, `[imagen${imgNum}]`, `[image_${imgNum}]`, `[image${imgNum}]`,
      `[IMAGEN_${imgNum}]`, `[IMAGEN${imgNum}]`, `[IMAGE_${imgNum}]`, `[IMAGE${imgNum}]`
    ]
    return placeholders.some(pl => post.content.includes(pl))
  }

  const galleryImages = post && post.images ? post.images.filter((_, idx) => !contentHasPlaceholder(idx)) : []

  return (
    <div style={{ background: 'var(--color-surface-50)', minHeight: '100vh' }}>
      <article style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        
        {/* Meta / Date & Author */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          marginBottom: '1rem',
          fontSize: '0.82rem',
          color: 'var(--color-surface-500)',
          fontWeight: '600'
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <FaCalendarAlt style={{ color: 'var(--color-surface-400)' }} /> {fmt(post.publishedAt)}
          </span>
          <span style={{ color: 'var(--color-surface-300)' }}>|</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <FaPen style={{ color: 'var(--color-surface-400)' }} /> {post.author || 'Instituto de la Juventud de Tamaulipas'}
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(1.75rem, 4.5vw, 2.5rem)',
          fontWeight: '800',
          color: 'var(--color-surface-900)',
          lineHeight: 1.25,
          marginBottom: '2rem',
          letterSpacing: '-0.02em'
        }}>
          {post.title}
        </h1>

        {/* Cover image */}
        {cover && (
          <div style={{
            borderRadius: 'var(--radius-2xl)',
            overflow: 'hidden',
            marginBottom: '2.5rem',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--color-surface-300)'
          }}>
            <img src={cover} alt={post.title} style={{ width: '100%', maxHeight: '480px', objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        {/* Excerpt / Resumen */}
        {post.excerpt && (
          <div style={{
            fontSize: '1.05rem',
            fontWeight: '600',
            color: 'var(--color-surface-800)',
            lineHeight: 1.7,
            marginBottom: '2rem',
            padding: '1.25rem 1.5rem',
            background: 'var(--color-surface-100)',
            borderLeft: '4px solid var(--color-primary-500)',
            borderRadius: '0 var(--radius-lg) var(--radius-lg) 0',
          }}>
            {post.excerpt}
          </div>
        )}

        {/* Content */}
        <div
          style={{
            color: 'var(--color-surface-900)',
            fontSize: '1.025rem',
            lineHeight: 1.85,
            marginBottom: '3rem'
          }}
          dangerouslySetInnerHTML={{ __html: parseMarkdown(post.content, post.images) }}
        />

        {/* Gallery */}
        {galleryImages.length > 0 && (
          <div style={{ marginTop: '3rem', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-surface-900)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaCamera /> Galería
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
              {galleryImages.map((img, i) => (
                <div key={i} style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '4/3', border: '1px solid var(--color-surface-300)', boxShadow: 'var(--shadow-card)' }}>
                  <img src={imgSrc(img)} alt={`Foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div style={{
          marginTop: '3rem',
          paddingTop: '2rem',
          borderTop: '1px solid var(--color-surface-300)',
          display: 'flex',
          justifyContent: 'flex-start'
        }}>
          <Link
            to="/noticias"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.75rem 2rem',
              borderRadius: '2rem',
              border: '1.5px solid var(--color-surface-300)',
              color: 'var(--color-surface-800)',
              fontWeight: '600',
              textDecoration: 'none',
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              background: 'var(--color-surface-100)',
              cursor: 'pointer'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--color-primary-500)'
              e.currentTarget.style.color = 'var(--color-primary-500)'
              e.currentTarget.style.background = 'var(--color-surface-200)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--color-surface-300)'
              e.currentTarget.style.color = 'var(--color-surface-800)'
              e.currentTarget.style.background = 'var(--color-surface-100)'
            }}
          >
            ← Volver a noticias
          </Link>
        </div>
      </article>
    </div>
  )
}
