import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FaArrowLeft, FaHeart, FaRegHeart, FaCalendarAlt, FaTag } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function ArticleDetail() {
  const { slug } = useParams()
  const { isAuthenticated } = useAuth()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/articles/${slug}`)
        setArticle(data.article)

        if (isAuthenticated && data.article) {
          const favRes = await api.get('/articles/user/favorites')
          const isFav = favRes.data.favorites.some(f => f.id === data.article.id)
          setIsFavorite(isFav)
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [slug, isAuthenticated])

  const toggleFavorite = async () => {
    if (!isAuthenticated || !article) return
    setFavoriteLoading(true)
    try {
      const { data } = await api.post(`/articles/${article.id}/favorite`)
      setIsFavorite(data.isFavorite)
    } catch (err) {
      console.error('Error toggling favorite:', err)
    } finally {
      setFavoriteLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ height: '500px', borderRadius: 'var(--radius-xl)', background: 'var(--color-surface-100)' }} />
      </div>
    )
  }

  if (notFound || !article) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '3rem' }}>🔍</p>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-surface-900)', marginTop: '1rem' }}>
          Artículo no encontrado
        </h2>
        <button onClick={() => window.history.back()} style={{
          display: 'inline-block', marginTop: '1rem', border: 'none', cursor: 'pointer',
          padding: '0.6rem 1.5rem', borderRadius: 'var(--radius-lg)',
          background: 'var(--color-primary-500)', color: 'white', fontWeight: '600',
        }}>
          Volver atrás
        </button>
      </div>
    )
  }

  const tags = Array.isArray(article.tags) ? article.tags : (article.tags ? JSON.parse(article.tags) : [])

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link to={article.disease ? `/enfermedades/${article.disease.slug}` : "/enfermedades"} style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          color: 'var(--color-surface-500)', textDecoration: 'none', fontSize: '0.9rem',
          fontWeight: '500', transition: 'color 0.2s',
        }}>
          <FaArrowLeft size={12} /> Volver {article.disease ? `a ${article.disease.name}` : ''}
        </Link>

        {isAuthenticated && (
          <button
            onClick={toggleFavorite}
            disabled={favoriteLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem',
              borderRadius: '2rem', border: `1px solid ${isFavorite ? '#fecaca' : 'var(--color-surface-200)'}`,
              background: isFavorite ? '#fef2f2' : 'white', cursor: favoriteLoading ? 'wait' : 'pointer',
              color: isFavorite ? '#ef4444' : 'var(--color-surface-500)', fontWeight: '600', fontSize: '0.85rem',
              transition: 'all 0.2s'
            }}
          >
            {isFavorite ? <FaHeart color="#ef4444" /> : <FaRegHeart />}
            {isFavorite ? 'En Favoritos' : 'Guardar'}
          </button>
        )}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span style={{
            padding: '0.2rem 0.75rem', borderRadius: '2rem', backgroundColor: 'var(--color-surface-100)',
            color: 'var(--color-surface-600)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase'
          }}>
            {article.category}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-surface-400)', fontSize: '0.8rem' }}>
            <FaCalendarAlt /> {new Date(article.publishedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-surface-900)', lineHeight: 1.2, marginBottom: '1rem' }}>
          {article.title}
        </h1>

        <p style={{ fontSize: '1.05rem', color: 'var(--color-surface-500)', lineHeight: 1.6, fontStyle: 'italic', borderLeft: '3px solid var(--color-primary-500)', paddingLeft: '1rem' }}>
          {article.excerpt}
        </p>
      </div>

      {/* Main Content Render */}
      <div
        className="article-content"
        style={{ fontSize: '1rem', color: 'var(--color-surface-700)', lineHeight: 1.8 }}
        dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br/>') }}
      />

      {tags.length > 0 && (
        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-surface-200)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <FaTag color="var(--color-surface-400)" size={14} />
          {tags.map((tag, i) => (
            <span key={i} style={{ padding: '0.3rem 0.8rem', background: 'var(--color-surface-100)', color: 'var(--color-surface-600)', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500' }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
