import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  RiHome5Fill,
  RiHome5Line,
  RiHeartPulseFill,
  RiHeartPulseLine,
  RiCapsuleFill,
  RiCapsuleLine,
  RiNewspaperFill,
  RiNewspaperLine,
  RiUser3Fill,
  RiUser3Line
} from 'react-icons/ri'
import { FaChartLine } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api, { getApiBaseUrl } from '../../services/api'

const API_BASE = getApiBaseUrl()

export default function BottomNav() {
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()
  const { dark } = useTheme()
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0)

  // Fetch unread alerts for health badge
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadAlertsCount(0)
      return
    }

    const checkAlerts = () => {
      api.get('/health-tracking/alerts')
        .then(res => {
          if (res.data?.alerts) {
            let readIds = []
            try {
              const stored = localStorage.getItem('jcs_alerts_read_ids')
              readIds = stored ? JSON.parse(stored) : []
            } catch (e) {}
            const unread = res.data.alerts.filter(a => !readIds.includes(a.id)).length
            setUnreadAlertsCount(unread)
          }
        })
        .catch(() => {})
    }

    checkAlerts()
    const interval = setInterval(checkAlerts, 60000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  const isHomeActive = location.pathname === '/'
  const isDiseasesActive = location.pathname.startsWith('/enfermedades')
  const isNutraceuticalsActive = location.pathname.startsWith('/nutraceuticos')
  const isNewsActive = location.pathname.startsWith('/noticias') || location.pathname.startsWith('/articulos')
  const isHealthActive = ['/dashboard', '/analytics', '/citas-virtuales', '/historial-medico-universal'].some(p => location.pathname.startsWith(p))
  const isProfileActive = ['/perfil', '/login', '/registro', '/recuperar', '/reset-password'].some(p => location.pathname.startsWith(p))

  const navItems = [
    {
      to: '/',
      label: 'Inicio',
      active: isHomeActive,
      iconActive: <RiHome5Fill size={22} />,
      iconInactive: <RiHome5Line size={22} />,
      badge: null
    },
    {
      to: '/enfermedades',
      label: 'Enfermedades',
      active: isDiseasesActive,
      iconActive: <RiHeartPulseFill size={22} />,
      iconInactive: <RiHeartPulseLine size={22} />,
      badge: null
    },
    {
      to: '/nutraceuticos',
      label: 'Nutracéuticos',
      active: isNutraceuticalsActive,
      iconActive: <RiCapsuleFill size={22} />,
      iconInactive: <RiCapsuleLine size={22} />,
      badge: null
    },
    {
      to: '/noticias',
      label: 'Noticias',
      active: isNewsActive,
      iconActive: <RiNewspaperFill size={22} />,
      iconInactive: <RiNewspaperLine size={22} />,
      badge: null
    },
    {
      to: isAuthenticated ? '/dashboard' : '/login',
      label: 'Mi Salud',
      active: isHealthActive,
      iconActive: <FaChartLine size={20} />,
      iconInactive: <FaChartLine size={20} style={{ opacity: 0.85 }} />,
      badge: unreadAlertsCount > 0 ? (unreadAlertsCount > 9 ? '9+' : unreadAlertsCount) : null
    },
    {
      to: isAuthenticated ? '/perfil' : '/login',
      label: 'Mi Perfil',
      active: isProfileActive,
      isAvatar: true,
      iconActive: <RiUser3Fill size={22} />,
      iconInactive: <RiUser3Line size={22} />,
      badge: null
    }
  ]

  const activeColor = dark ? 'var(--color-primary-400)' : 'var(--color-primary-500)'
  const inactiveColor = dark ? '#7e7a8c' : '#7d6e5e'
  const activeBgPill = dark ? 'rgba(214, 92, 126, 0.12)' : 'rgba(135, 18, 51, 0.08)'

  return (
    <nav
      aria-label="Navegación móvil principal"
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9998,
        height: 'calc(58px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: dark
          ? 'rgba(18, 17, 24, 0.92)'
          : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: `1px solid ${dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)'}`,
        boxShadow: dark
          ? '0 -4px 24px rgba(0, 0, 0, 0.4)'
          : '0 -2px 16px rgba(78, 4, 19, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        userSelect: 'none',
      }}
    >
      {navItems.map((item, index) => {
        const isCurrent = item.active

        return (
          <Link
            key={item.label + index}
            to={item.to}
            className="bottom-nav-item"
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              height: '100%',
              minWidth: 0,
              textDecoration: 'none',
              color: isCurrent ? activeColor : inactiveColor,
              transition: 'transform 0.15s ease, color 0.2s ease',
              padding: '4px 2px',
              gap: '2px',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* Active Pill Glow/Background */}
            {isCurrent && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  width: '38px',
                  height: '28px',
                  borderRadius: '14px',
                  background: activeBgPill,
                  zIndex: 0,
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: 'fadeIn 0.2s ease-out'
                }}
              />
            )}

            {/* Icon Container with Badge */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
                width: '26px',
                height: '26px',
                transform: isCurrent ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {item.isAvatar && isAuthenticated && user ? (
                /* Profile Avatar */
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    boxSizing: 'border-box',
                    border: isCurrent
                      ? `2px solid ${activeColor}`
                      : `1.5px solid ${dark ? '#3f3b4e' : '#d4c4b0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-500))',
                    color: 'white',
                    fontSize: '0.68rem',
                    fontWeight: '700',
                    boxShadow: isCurrent ? '0 0 8px rgba(135, 18, 51, 0.35)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar.startsWith('http') ? user.avatar : `${API_BASE}/${user.avatar}`}
                      alt={user.name || 'Perfil'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <span>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </div>
              ) : (
                /* Standard Icon */
                isCurrent ? item.iconActive : item.iconInactive
              )}

              {/* Notification / Alert Badge */}
              {item.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-6px',
                    minWidth: '15px',
                    height: '15px',
                    padding: '0 3.5px',
                    borderRadius: '8px',
                    background: '#dc2626',
                    color: 'white',
                    fontSize: '0.58rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1.5px solid ${dark ? '#141319' : '#fff'}`,
                    boxShadow: '0 1px 4px rgba(220, 38, 38, 0.4)',
                    lineHeight: 1,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>

            {/* Label */}
            <span
              style={{
                fontSize: '0.65rem',
                lineHeight: 1.1,
                fontWeight: isCurrent ? '700' : '500',
                color: isCurrent ? activeColor : inactiveColor,
                zIndex: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                letterSpacing: '-0.01em',
                transition: 'color 0.2s ease',
              }}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
