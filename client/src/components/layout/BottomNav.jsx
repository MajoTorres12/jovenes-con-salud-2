import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
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
import { FaChartLine, FaHeartbeat } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useModules } from '../../context/ModuleContext'
import api, { getApiBaseUrl } from '../../services/api'

const API_BASE = getApiBaseUrl()

export default function BottomNav() {
  const isNative = Capacitor.isNativePlatform()
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
  const isNutraceuticalsActive = location.pathname.startsWith('/hecho-en-tamaulipas') || location.pathname.startsWith('/nutraceuticos')
  const isNewsActive = location.pathname.startsWith('/noticias') || location.pathname.startsWith('/articulos')
  const isHealthActive = ['/dashboard', '/analytics', '/citas-virtuales', '/historial-medico-universal'].some(p => location.pathname.startsWith(p))
  const isProfileActive = ['/perfil', '/login', '/registro', '/recuperar', '/reset-password'].some(p => location.pathname.startsWith(p))

  const { isModuleEnabled } = useModules()

  // 1. Left items (Inicio, Enfermedades)
  const leftItems = [
    {
      key: 'home',
      to: '/',
      label: 'Inicio',
      active: isHomeActive,
      iconActive: <RiHome5Fill size={21} />,
      iconInactive: <RiHome5Line size={21} />,
    },
    {
      key: 'diseases',
      to: '/enfermedades',
      label: 'Enfermedades',
      active: isDiseasesActive,
      iconActive: <RiHeartPulseFill size={21} />,
      iconInactive: <RiHeartPulseLine size={21} />,
    },
  ].filter(item => item.key === 'home' || isModuleEnabled(item.key))

  // 2. Center items (Mi Salud & Mi Perfil)
  const showHealth = isModuleEnabled('health_tracking')

  const healthItem = {
    key: 'health_tracking',
    to: isAuthenticated ? '/dashboard' : '/login',
    label: 'Mi Salud',
    active: isHealthActive,
    iconActive: <FaChartLine size={17} />,
    iconInactive: <FaChartLine size={17} />,
    badge: unreadAlertsCount > 0 ? (unreadAlertsCount > 9 ? '9+' : unreadAlertsCount) : null
  }

  const profileItem = {
    key: 'profile',
    to: isAuthenticated ? '/perfil' : '/login',
    label: 'Mi Perfil',
    active: isProfileActive,
    isAvatar: true,
    iconActive: <RiUser3Fill size={18} />,
    iconInactive: <RiUser3Line size={18} />,
  }

  // 3. Right items (Hecho en Tam., Noticias)
  const rightItems = [
    {
      key: 'hecho_en_tamaulipas',
      to: '/hecho-en-tamaulipas',
      label: 'Hecho en Tam.',
      active: isNutraceuticalsActive,
      iconActive: <RiCapsuleFill size={21} />,
      iconInactive: <RiCapsuleLine size={21} />,
    },
    {
      key: 'news',
      to: '/noticias',
      label: 'Noticias',
      active: isNewsActive,
      iconActive: <RiNewspaperFill size={21} />,
      iconInactive: <RiNewspaperLine size={21} />,
    },
  ].filter(item => isModuleEnabled(item.key))

  const activeColor = dark ? 'var(--color-primary-400)' : 'var(--color-primary-500)'
  const inactiveColor = dark ? '#7e7a8c' : '#7d6e5e'
  const activeBgPill = dark ? 'rgba(214, 92, 126, 0.12)' : 'rgba(135, 18, 51, 0.08)'

  const renderStandardItem = (item) => {
    const isCurrent = item.active

    return (
      <Link
        key={item.key}
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
          padding: '2px',
          gap: '2px',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {isCurrent && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              width: '36px',
              height: '26px',
              borderRadius: '13px',
              background: activeBgPill,
              zIndex: 0,
              animation: 'fadeIn 0.2s ease-out'
            }}
          />
        )}

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            width: '24px',
            height: '24px',
            transform: isCurrent ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 0.2s ease',
          }}
        >
          {isCurrent ? item.iconActive : item.iconInactive}
        </div>

        <span
          style={{
            fontSize: '0.62rem',
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
  }

  return (
    <nav
      aria-label="Navegación móvil principal"
      className={`mobile-bottom-nav ${isNative ? 'is-native-app' : ''}`}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9998,
        height: 'calc(62px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: '0.35rem',
        paddingRight: '0.35rem',
        background: dark
          ? 'rgba(16, 15, 22, 0.94)'
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: `1px solid ${dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(135, 18, 51, 0.1)'}`,
        boxShadow: dark
          ? '0 -4px 25px rgba(0, 0, 0, 0.55)'
          : '0 -2px 20px rgba(135, 18, 51, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        userSelect: 'none',
      }}
    >
      {/* ── Left Items (Inicio, Enfermedades) ──────────────── */}
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-around', height: '100%' }}>
        {leftItems.map(renderStandardItem)}
      </div>

      {/* ── Central Highlighted Hub (Mi Salud & Mi Perfil) ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          padding: '4px 6px',
          borderRadius: '24px',
          background: dark
            ? 'linear-gradient(135deg, rgba(135, 18, 51, 0.3), rgba(28, 25, 36, 0.95))'
            : 'linear-gradient(135deg, rgba(135, 18, 51, 0.12), rgba(255, 255, 255, 0.98))',
          border: `1.5px solid ${dark ? 'rgba(224, 59, 96, 0.4)' : 'rgba(135, 18, 51, 0.25)'}`,
          boxShadow: dark
            ? '0 4px 18px rgba(0, 0, 0, 0.6), 0 0 14px rgba(135, 18, 51, 0.3)'
            : '0 4px 16px rgba(135, 18, 51, 0.16), 0 2px 6px rgba(0, 0, 0, 0.04)',
          transform: 'translateY(-3px)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          margin: '0 3px',
          flexShrink: 0,
        }}
      >
        {/* Mi Salud */}
        {showHealth && (
          <Link
            to={healthItem.to}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 8px',
              minWidth: '54px',
              borderRadius: '16px',
              textDecoration: 'none',
              background: healthItem.active
                ? 'linear-gradient(135deg, #871233, #e03b60)'
                : (dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(135, 18, 51, 0.05)'),
              color: healthItem.active ? '#ffffff' : (dark ? '#e03b60' : '#871233'),
              boxShadow: healthItem.active
                ? '0 2px 10px rgba(135, 18, 51, 0.5)'
                : 'none',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}>
              <FaChartLine
                size={16}
                style={{
                  color: healthItem.active ? '#ffffff' : (dark ? '#e03b60' : '#871233'),
                  transform: healthItem.active ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.2s ease'
                }}
              />
              {healthItem.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-9px',
                    minWidth: '15px',
                    height: '15px',
                    padding: '0 3px',
                    borderRadius: '8px',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: '0.55rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1.5px solid ${dark ? '#141319' : '#ffffff'}`,
                    lineHeight: 1,
                  }}
                >
                  {healthItem.badge}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: '800',
                letterSpacing: '-0.01em',
                marginTop: '2px',
                whiteSpace: 'nowrap',
                color: healthItem.active ? '#ffffff' : (dark ? '#e03b60' : '#871233'),
              }}
            >
              Mi Salud
            </span>
          </Link>
        )}

        {/* Mi Perfil */}
        <Link
          to={profileItem.to}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 8px',
            minWidth: '54px',
            borderRadius: '16px',
            textDecoration: 'none',
            background: profileItem.active
              ? 'linear-gradient(135deg, #871233, #e03b60)'
              : (dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(135, 18, 51, 0.05)'),
            color: profileItem.active ? '#ffffff' : (dark ? '#e03b60' : '#871233'),
            boxShadow: profileItem.active
              ? '0 2px 10px rgba(135, 18, 51, 0.5)'
              : 'none',
            transition: 'all 0.2s ease',
            position: 'relative',
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}>
            {isAuthenticated && user?.avatar ? (
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: `1.5px solid ${profileItem.active ? '#ffffff' : (dark ? '#e03b60' : '#871233')}`,
                  boxSizing: 'border-box',
                }}
              >
                <img
                  src={user.avatar.startsWith('http') ? user.avatar : `${API_BASE}/${user.avatar}`}
                  alt={user.name || 'Perfil'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              </div>
            ) : (
              <RiUser3Fill
                size={17}
                style={{
                  color: profileItem.active ? '#ffffff' : (dark ? '#e03b60' : '#871233'),
                  transform: profileItem.active ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.2s ease'
                }}
              />
            )}
          </div>
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: '800',
              letterSpacing: '-0.01em',
              marginTop: '2px',
              whiteSpace: 'nowrap',
              color: profileItem.active ? '#ffffff' : (dark ? '#e03b60' : '#871233'),
            }}
          >
            Mi Perfil
          </span>
        </Link>
      </div>

      {/* ── Right Items (Hecho en Tam., Noticias) ─────────────── */}
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-around', height: '100%' }}>
        {rightItems.map(renderStandardItem)}
      </div>
    </nav>
  )
}
