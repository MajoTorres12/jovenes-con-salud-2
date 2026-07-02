import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { FaCookieBite, FaTimes } from 'react-icons/fa'

export default function CookieConsent() {
  const { dark } = useTheme()
  const [isVisible, setIsVisible] = useState(false)
  const [isRendered, setIsRendered] = useState(false)

  useEffect(() => {
    // Check if user has already accepted cookies
    const accepted = localStorage.getItem('jcs_cookies_accepted')
    if (accepted !== 'true') {
      // Delay showing the banner slightly for a smoother entry effect
      const timer = setTimeout(() => {
        setIsRendered(true)
        setIsVisible(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    setIsVisible(false)
    localStorage.setItem('jcs_cookies_accepted', 'true')
    // Remove from DOM after transition completes
    setTimeout(() => {
      setIsRendered(false)
    }, 400)
  }

  const handleDecline = () => {
    setIsVisible(false)
    // We respect their decline but hide the banner for this session
    setTimeout(() => {
      setIsRendered(false)
    }, 400)
  }

  if (!isRendered) return null

  // Styles
  const bannerStyle = {
    position: 'fixed',
    bottom: '24px',
    left: '24px',
    zIndex: 9999,
    maxWidth: '420px',
    width: 'calc(100% - 48px)',
    padding: '1.5rem',
    borderRadius: '16px',
    boxShadow: dark 
      ? '0 10px 30px -5px rgba(0,0,0,0.6), 0 0 1px 1px rgba(255,255,255,0.08)' 
      : '0 10px 30px -5px rgba(135,18,51,0.08), 0 0 1px 1px rgba(135,18,51,0.05)',
    background: dark 
      ? 'rgba(26, 21, 32, 0.85)' 
      : 'rgba(255, 254, 252, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(135, 18, 51, 0.12)'}`,
    color: dark ? '#f3f4f6' : '#1f2937',
    fontFamily: 'var(--font-sans)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
    transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
    opacity: isVisible ? 1 : 0,
  }

  const btnAcceptStyle = {
    flex: 1,
    padding: '0.65rem 1.25rem',
    borderRadius: '10px',
    background: '#871233',
    color: 'white',
    border: 'none',
    fontWeight: '700',
    fontSize: '0.82rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(135,18,51,0.15)',
  }

  const btnDeclineStyle = {
    padding: '0.65rem 1.25rem',
    borderRadius: '10px',
    background: 'transparent',
    color: dark ? '#9ca3af' : '#6b7280',
    border: `1.5px solid ${dark ? '#374151' : '#e5e7eb'}`,
    fontWeight: '600',
    fontSize: '0.82rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <div style={bannerStyle} className="cookie-consent-banner">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '50%', 
            background: dark ? 'rgba(194, 163, 120, 0.15)' : 'rgba(135, 18, 51, 0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: dark ? '#c2a378' : '#871233', fontSize: '1.1rem'
          }}>
            <FaCookieBite />
          </div>
          <span style={{ fontWeight: '800', fontSize: '0.95rem', letterSpacing: '-0.01em', color: dark ? '#fff' : '#111827' }}>
            Aviso de Cookies
          </span>
        </div>
        <button 
          onClick={handleDecline} 
          style={{ background: 'none', border: 'none', color: dark ? '#6b7280' : '#9ca3af', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
          title="Cerrar"
        >
          <FaTimes size={14} />
        </button>
      </div>

      {/* Description */}
      <p style={{ fontSize: '0.82rem', lineHeight: '1.5', margin: 0, color: dark ? '#9ca3af' : '#4b5563' }}>
        Utilizamos cookies y almacenamiento local técnico indispensable para optimizar tu experiencia, gestionar el inicio de sesión seguro y mantener tus preferencias de idioma. Al continuar navegando, aceptas nuestro{' '}
        <Link 
          to="/faq" 
          style={{ color: dark ? '#c2a378' : '#871233', textDecoration: 'underline', fontWeight: '600' }}
          onClick={() => {
            // Smoothly dismiss banner on navigation to policy to avoid obstruction
            setIsVisible(false);
            setTimeout(() => setIsRendered(false), 400);
          }}
        >
          Aviso de Privacidad
        </Link>.
      </p>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.25rem' }}>
        <button 
          onClick={handleDecline}
          style={btnDeclineStyle}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = dark ? '#4b5563' : '#9ca3af'
            e.currentTarget.style.color = dark ? '#d1d5db' : '#374151'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = dark ? '#374151' : '#e5e7eb'
            e.currentTarget.style.color = dark ? '#9ca3af' : '#6b7280'
          }}
        >
          Rechazar
        </button>
        <button 
          onClick={handleAccept}
          style={btnAcceptStyle}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#750f2c'
            e.currentTarget.style.transform = 'scale(1.02)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#871233'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          Aceptar
        </button>
      </div>

      {/* Responsive mobile media query overrides */}
      <style>{`
        @media (max-width: 640px) {
          .cookie-consent-banner {
            left: 12px !important;
            bottom: 12px !important;
            width: calc(100% - 24px) !important;
            max-width: 100% !important;
            padding: 1.25rem !important;
            border-radius: 12px !important;
          }
        }
      `}</style>
    </div>
  )
}
