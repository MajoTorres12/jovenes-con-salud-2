import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'
import {
  FaChartBar, FaUsers, FaHeartbeat, FaCapsules, FaNewspaper,
  FaEnvelope, FaCog, FaSignOutAlt, FaExternalLinkAlt,
  FaPlus, FaEdit, FaTrash, FaTimes, FaSearch, FaCheck,
  FaEye, FaEyeSlash, FaThumbtack, FaSave, FaCamera, FaMapMarkerAlt,
  FaBookOpen,
} from 'react-icons/fa'
import { HiMenu } from 'react-icons/hi'

// ═══════════════════════════════════════════════════════
// STYLE CONSTANTS
// ═══════════════════════════════════════════════════════

const SIDEBAR_W = 240
const SIDEBAR_BG = '#1a1520'
const SIDEBAR_ACTIVE = '#871233'
const SIDEBAR_HOVER = 'rgba(135,18,51,0.2)'
const CARD_RADIUS = '16px'

// ═══════════════════════════════════════════════════════
// SIDEBAR NAV ITEMS
// ═══════════════════════════════════════════════════════

const NAV = [
  { key: 'dashboard',      icon: FaChartBar,   label: 'Dashboard' },
  { key: 'users',          icon: FaUsers,      label: 'Usuarios' },
  { key: 'diseases',       icon: FaHeartbeat,  label: 'Enfermedades' },
  { key: 'articles',       icon: FaBookOpen,   label: 'Artículos' },
  { key: 'nutraceuticals', icon: FaCapsules,   label: 'Nutracéuticos' },
  { key: 'news',           icon: FaNewspaper,  label: 'Noticias' },
  { key: 'messages',       icon: FaEnvelope,   label: 'Mensajes' },
  { key: 'contact',        icon: FaCog,        label: 'Config. Contacto' },
]

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

export default function AdminPanel() {
  const { user, logout } = useAuth()
  const { dark } = useTheme()
  const [section, setSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: dark ? '#0c0b0f' : '#f1ede6' }}>
      {/* Sidebar overlay backdrop for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* ── Sidebar ─────────────────────── */}
      <aside 
        className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}
        style={{
          width: SIDEBAR_W,
          background: SIDEBAR_BG,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          zIndex: 50,
        }}
      >
        {/* Brand */}
        <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FaHeartbeat style={{ color: '#e03b60', fontSize: '1.35rem' }} />
            <div>
              <div style={{ color: '#fff', fontWeight: '800', fontSize: '1rem', letterSpacing: '-0.01em' }}>Panel IJT</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: '600' }}>Administración</div>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '0.75rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {NAV.map(n => (
            <button
              key={n.key}
              onClick={() => { setSection(n.key); setSidebarOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.65rem',
                padding: '0.65rem 0.875rem', borderRadius: '10px',
                border: 'none', cursor: 'pointer', width: '100%',
                textAlign: 'left', fontSize: '0.85rem', fontWeight: '600',
                background: section === n.key ? SIDEBAR_ACTIVE : 'transparent',
                color: section === n.key ? '#fff' : 'rgba(255,255,255,0.55)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { if (section !== n.key) e.currentTarget.style.background = SIDEBAR_HOVER }}
              onMouseLeave={e => { if (section !== n.key) e.currentTarget.style.background = 'transparent' }}
            >
              <n.icon size={15} />
              {n.label}
            </button>
          ))}
        </nav>

        {/* Footer links */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.875rem', borderRadius: '10px', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}>
            <FaExternalLinkAlt size={13} /> Ver sitio
          </Link>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.875rem', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'transparent', color: '#ef4444', fontSize: '0.85rem', fontWeight: '600', width: '100%', textAlign: 'left' }}>
            <FaSignOutAlt size={13} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────── */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <header 
          className="admin-header"
          style={{
            padding: '1rem 2rem',
            borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: dark ? '#141319' : '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Mobile Hamburger menu */}
            <button 
              className="admin-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: 'none' }}
            >
              <HiMenu />
            </button>
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', margin: 0 }}>Panel de Administración</h1>
              <p style={{ fontSize: '0.75rem', color: dark ? 'rgba(255,255,255,0.4)' : '#a89580', margin: 0 }}>Jóvenes con Salud — Instituto de la Juventud de Tamaulipas</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <select
              value={(() => {
                const match = document.cookie.match(/googtrans=\/es\/([a-z]{2})/)
                return match ? match[1] : 'es'
              })()}
              onChange={e => {
                const langCode = e.target.value
                if (langCode === 'es') {
                  document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost";
                  document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost";
                } else {
                  document.cookie = `googtrans=/es/${langCode}; path=/`;
                  document.cookie = `googtrans=/es/${langCode}; path=/; domain=localhost`;
                  document.cookie = `googtrans=/es/${langCode}; path=/; domain=.localhost`;
                }
                window.location.reload()
              }}
              style={{
                padding: '0.4rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700',
                border: `1.5px solid ${dark ? '#272530' : '#e8ddd0'}`,
                background: dark ? '#1e1c25' : '#faf8f5', color: dark ? '#fff' : '#1a1715',
                cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="es">Español 🇪🇸</option>
              <option value="en">English 🇺🇸</option>
              <option value="fr">Français 🇫🇷</option>
              <option value="pt">Português 🇵🇹</option>
              <option value="de">Deutsch 🇩🇪</option>
            </select>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.5rem 1rem', borderRadius: '12px',
              background: dark ? 'rgba(224,59,96,0.12)' : '#87123312',
              color: dark ? '#e03b60' : '#871233',
              fontSize: '0.8rem', fontWeight: '700',
            }}>
              <FaHeartbeat size={14} />
              {user?.name || 'Admin'}
            </div>
          </div>
        </header>

        {/* Content area */}
        <div style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
          {section === 'dashboard' && <DashboardSection dark={dark} />}
          {section === 'users' && <UsersSection dark={dark} />}
          {section === 'diseases' && <CrudSection dark={dark} entity="diseases" title="Enfermedades" />}
          {section === 'articles' && <CrudSection dark={dark} entity="articles" title="Artículos" />}
          {section === 'nutraceuticals' && <CrudSection dark={dark} entity="nutraceuticals" title="Nutracéuticos" />}
          {section === 'news' && <CrudSection dark={dark} entity="news" title="Noticias" />}
          {section === 'messages' && <MessagesSection dark={dark} />}
          {section === 'contact' && <ContactSettingsSection dark={dark} />}
        </div>
      </main>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// SHARED UI PIECES
// ═══════════════════════════════════════════════════════

const cardStyle = (dark) => ({
  background: dark ? '#141319' : '#fff',
  borderRadius: CARD_RADIUS,
  border: `1px solid ${dark ? '#1e1c25' : '#e8ddd0'}`,
  boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.04)',
})

function SearchBar({ value, onChange, placeholder, dark }) {
  return (
    <div style={{ position: 'relative', maxWidth: '340px' }}>
      <FaSearch style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: dark ? '#7e7a8c' : '#a89580', fontSize: '0.85rem' }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'Buscar...'}
        style={{
          width: '100%', padding: '0.6rem 1rem 0.6rem 2.4rem',
          borderRadius: '10px', border: `1.5px solid ${dark ? '#272530' : '#e8ddd0'}`,
          background: dark ? '#1e1c25' : '#faf8f5', color: dark ? '#fff' : '#1a1715',
          fontSize: '0.85rem', outline: 'none',
        }}
      />
    </div>
  )
}

function Btn({ children, variant = 'primary', onClick, disabled, small, style: extra }) {
  const bg = variant === 'primary' ? '#871233'
    : variant === 'danger' ? '#dc2626'
    : variant === 'success' ? '#059669'
    : 'transparent'
  const c = variant === 'ghost' ? '#871233' : '#fff'
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      padding: small ? '0.35rem 0.7rem' : '0.55rem 1.1rem',
      borderRadius: '10px', border: variant === 'ghost' ? '1.5px solid #871233' : 'none',
      background: bg, color: c, fontSize: small ? '0.75rem' : '0.85rem', fontWeight: '700',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      transition: 'all 0.2s ease', whiteSpace: 'nowrap', ...extra,
    }}>
      {children}
    </button>
  )
}

function Modal({ title, onClose, children, dark, wide }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '3rem 1rem', overflowY: 'auto',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: wide ? '780px' : '560px',
        borderRadius: '20px', overflow: 'hidden',
        background: dark ? '#141319' : '#fff',
        border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.25rem 1.5rem', borderBottom: `1px solid ${dark ? '#1e1c25' : '#e8ddd0'}`,
        }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: dark ? '#7e7a8c' : '#a89580', fontSize: '1.1rem' }}>
            <FaTimes />
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function FormField({ label, children, dark }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: dark ? '#9ea4b0' : '#5c5248', marginBottom: '0.35rem' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function inputStyle(dark) {
  return {
    width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px',
    border: `1.5px solid ${dark ? '#272530' : '#e8ddd0'}`,
    background: dark ? '#1e1c25' : '#faf8f5',
    color: dark ? '#fff' : '#1a1715', fontSize: '0.88rem', outline: 'none',
    fontFamily: 'inherit',
  }
}

function ConfirmModal({ message, onConfirm, onCancel, dark }) {
  return (
    <Modal title="Confirmar" onClose={onCancel} dark={dark}>
      <p style={{ fontSize: '0.95rem', color: dark ? '#c5bfae' : '#5c5248', marginBottom: '1.5rem', lineHeight: 1.5 }}>{message}</p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
        <Btn variant="danger" onClick={onConfirm}><FaTrash size={12} /> Eliminar</Btn>
      </div>
    </Modal>
  )
}

function ImageUploader({ value, onChange, dark }) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)

    setUploading(true)
    try {
      const res = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      onChange(res.data.imageUrl)
    } catch (err) {
      alert(err.response?.data?.error || 'Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {value ? (
          <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${dark ? '#272530' : '#e8ddd0'}` }}>
            <img 
              src={value.startsWith('http') ? value : `/${value}`} 
              alt="Previsualización" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <button
              type="button"
              onClick={() => onChange('')}
              style={{
                position: 'absolute', top: '4px', right: '4px',
                width: '20px', height: '20px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '0.75rem', padding: 0
              }}
              title="Eliminar imagen"
            >
              <FaTimes size={10} />
            </button>
          </div>
        ) : (
          <div style={{
            width: '100px', height: '100px', borderRadius: '12px',
            border: `2px dashed ${dark ? '#272530' : '#e8ddd0'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: dark ? '#7e7a8c' : '#a89580', fontSize: '0.7rem', fontWeight: '600'
          }}>
            <FaCamera size={20} style={{ marginBottom: '0.35rem' }} />
            Sin Imagen
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.45rem 0.9rem', borderRadius: '8px',
            background: dark ? '#1e1c25' : '#faf8f5',
            color: dark ? '#fff' : '#1a1715',
            border: `1.5px solid ${dark ? '#272530' : '#e8ddd0'}`,
            fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            <FaPlus size={10} /> {uploading ? 'Subiendo...' : value ? 'Cambiar Imagen' : 'Subir Imagen'}
          </button>
          {value && (
            <span style={{ fontSize: '0.7rem', color: dark ? '#7e7a8c' : '#a89580', wordBreak: 'break-all', maxWidth: '300px' }}>
              Ruta: /{value}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function MultiImageUploader({ value = [], onChange, dark }) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const limit = 5 - value.length
    if (limit <= 0) {
      alert('Ya has subido el límite máximo de 5 imágenes')
      return
    }

    const filesToUpload = files.slice(0, limit)
    setUploading(true)

    try {
      const uploadedUrls = []
      for (const file of filesToUpload) {
        const formData = new FormData()
        formData.append('image', file)
        const res = await api.post('/admin/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        uploadedUrls.push(res.data.imageUrl)
      }
      onChange([...value, ...uploadedUrls])
    } catch (err) {
      alert(err.response?.data?.error || 'Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = (indexToRemove) => {
    onChange(value.filter((_, idx) => idx !== indexToRemove))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={value.length >= 5}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={value.length >= 5 || uploading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.45rem 0.9rem', borderRadius: '8px',
            background: value.length >= 5 ? 'var(--color-surface-200)' : (dark ? '#1e1c25' : '#faf8f5'),
            color: value.length >= 5 ? 'var(--color-surface-400)' : (dark ? '#fff' : '#1a1715'),
            border: `1.5px solid ${dark ? '#272530' : '#e8ddd0'}`,
            fontSize: '0.8rem', fontWeight: '700',
            cursor: value.length >= 5 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <FaPlus size={10} /> {uploading ? 'Subiendo...' : 'Subir Imágenes'}
        </button>
        <span style={{ fontSize: '0.75rem', color: dark ? '#7e7a8c' : '#a89580' }}>
          {value.length} de 5 imágenes subidas
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {value.map((imgUrl, index) => (
          <div key={index} style={{
            position: 'relative', width: '90px', height: '90px',
            borderRadius: '12px', overflow: 'hidden',
            border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`
          }}>
            <img
              src={imgUrl.startsWith('http') ? imgUrl : `/${imgUrl}`}
              alt={`Imagen ${index + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', bottom: '4px', left: '4px',
              background: 'rgba(0,0,0,0.6)', color: 'white',
              fontSize: '0.65rem', fontWeight: '700', padding: '1px 5px',
              borderRadius: '4px'
            }}>
              {index + 1}
            </div>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              style={{
                position: 'absolute', top: '4px', right: '4px',
                width: '18px', height: '18px', borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.9)', border: 'none', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '0.7rem', padding: 0
              }}
              title="Eliminar imagen"
            >
              <FaTimes size={9} />
            </button>
          </div>
        ))}
        
        {value.length === 0 && (
          <div style={{
            width: '90px', height: '90px', borderRadius: '12px',
            border: `2px dashed ${dark ? '#272530' : '#e8ddd0'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: dark ? '#7e7a8c' : '#a89580', fontSize: '0.65rem', fontWeight: '600'
          }}>
            <FaCamera size={16} style={{ marginBottom: '0.25rem' }} />
            Vacío
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// DASHBOARD SECTION
// ═══════════════════════════════════════════════════════

function DashboardSection({ dark }) {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  if (!stats) return <p style={{ color: dark ? '#7e7a8c' : '#a89580' }}>Cargando estadísticas...</p>

  const cards = [
    { label: 'USUARIOS REGISTRADOS', value: stats.users.total, sub: `${stats.users.active} activos`, color: '#3b82f6', emoji: '👥' },
    { label: 'NUEVOS (30 DÍAS)', value: stats.users.newLast30, color: '#10b981', emoji: '🆕' },
    { label: 'ENFERMEDADES', value: stats.diseases, color: '#e03b60', emoji: '💗' },
    { label: 'ARTÍCULOS', value: stats.articles, color: '#10b981', emoji: '📚' },
    { label: 'NUTRACÉUTICOS', value: stats.nutraceuticals, color: '#f59e0b', emoji: '💊' },
    { label: 'NOTICIAS', value: stats.news, color: '#8b5cf6', emoji: '📰' },
    { label: 'MENSAJES', value: stats.messages.total, sub: `${stats.messages.pending} pendientes`, color: '#f97316', emoji: '✉️' },
    { label: 'REGISTROS DE SALUD', value: stats.healthRecords, color: '#06b6d4', emoji: '📊' },
  ]

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', marginBottom: '1.5rem' }}>Resumen General</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {cards.map((c, i) => (
          <div key={i} style={{
            ...cardStyle(dark),
            padding: '1.25rem 1.35rem',
            display: 'flex', flexDirection: 'column', gap: '0.6rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: dark ? '#7e7a8c' : '#a89580' }}>{c.label}</span>
              <span style={{ fontSize: '1.2rem' }}>{c.emoji}</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715' }}>{c.value}</div>
            {c.sub && <span style={{ fontSize: '0.72rem', color: dark ? '#7e7a8c' : '#a89580' }}>{c.sub}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// USERS SECTION
// ═══════════════════════════════════════════════════════

function UsersSection({ dark }) {
  const [users, setUsers] = useState([])
  const [doctors, setDoctors] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/admin/users', { params: search ? { search } : {} }),
      api.get('/admin/doctors')
    ])
      .then(([resUsers, resDoctors]) => {
        setUsers(resUsers.data.users)
        setDoctors(resDoctors.data.doctors)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => { load() }, [load])

  const toggleActive = async (id) => {
    await api.put(`/admin/users/${id}/toggle-active`)
    load()
  }

  const changeRole = async (id, role) => {
    await api.put(`/admin/users/${id}/role`, { role })
    load()
  }

  const assignDoctor = async (userId, doctorId) => {
    try {
      await api.put(`/admin/users/${userId}/assign-doctor`, { doctorId: doctorId || null })
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al asignar médico')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', margin: 0 }}>Gestión de Usuarios</h2>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre o correo..." dark={dark} />
      </div>
      <div className="admin-table-container" style={{ ...cardStyle(dark), overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: dark ? '#1e1c25' : '#faf8f5', borderBottom: `1px solid ${dark ? '#272530' : '#e8ddd0'}` }}>
              {['NOMBRE', 'CORREO', 'ROL', 'MÉDICO ASIGNADO', 'ESTADO', 'ACCIONES'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.06em', color: dark ? '#e03b60' : '#871233' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: dark ? '#7e7a8c' : '#a89580' }}>Cargando...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: dark ? '#7e7a8c' : '#a89580' }}>Sin resultados</td></tr>
            ) : users.map(u => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${dark ? '#1e1c25' : '#f4efe7'}` }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: dark ? '#e5dfef' : '#1a1715' }}>{u.name}</td>
                <td style={{ padding: '0.75rem 1rem', color: dark ? '#9ea4b0' : '#7d6e5e' }}>{u.email}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <select value={u.role} onChange={e => changeRole(u.id, e.target.value)} style={{
                    padding: '0.3rem 0.5rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600',
                    border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`,
                    background: dark ? '#1e1c25' : '#faf8f5', color: dark ? '#fff' : '#1a1715',
                    cursor: 'pointer',
                  }}>
                    <option value="user">Usuario</option>
                    <option value="doctor">Médico</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  {u.role === 'user' ? (
                    <select
                      value={u.doctorId || ''}
                      onChange={e => assignDoctor(u.id, e.target.value)}
                      style={{
                        padding: '0.3rem 0.5rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600',
                        border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`,
                        background: dark ? '#1e1c25' : '#faf8f5', color: dark ? '#fff' : '#1a1715',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Sin médico</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span style={{ color: dark ? '#7e7a8c' : '#a89580', fontSize: '0.8rem', fontStyle: 'italic' }}>N/A</span>
                  )}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span style={{
                    padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700',
                    background: u.isActive ? '#10b98118' : '#ef444418',
                    color: u.isActive ? '#059669' : '#dc2626',
                  }}>
                    {u.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <Btn variant={u.isActive ? 'danger' : 'success'} small onClick={() => toggleActive(u.id)}>
                    {u.isActive ? '⊘ Desactivar' : '✓ Activar'}
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// GENERIC CRUD SECTION (Diseases, Nutraceuticals, News)
// ═══════════════════════════════════════════════════════

const ENTITY_CONFIG = {
  diseases: {
    endpoint: '/admin/diseases',
    listKey: 'diseases',
    columns: ['coverImage', 'name', 'category', 'isPublished'],
    columnLabels: { coverImage: 'IMAGEN', name: 'NOMBRE', category: 'CATEGORÍA', isPublished: 'ESTADO' },
    fields: [
      { key: 'name', label: 'Nombre', type: 'text', required: true },
      { key: 'category', label: 'Categoría', type: 'text', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea', required: true },
      { key: 'symptoms', label: 'Síntomas (uno por línea)', type: 'jsonarray' },
      { key: 'riskFactors', label: 'Factores de Riesgo (uno por línea)', type: 'jsonarray' },
      { key: 'treatment', label: 'Tratamiento', type: 'textarea' },
      { key: 'iconEmoji', label: 'Emoji de Icono', type: 'text' },
      { key: 'colorHex', label: 'Color Hex', type: 'text' },
      { key: 'coverImage', label: 'Imagen de Portada', type: 'image' },
      { key: 'validatedBy', label: 'Validado por', type: 'text' },
      { key: 'isPublished', label: 'Publicada', type: 'checkbox' },
    ],
  },
  nutraceuticals: {
    endpoint: '/admin/nutraceuticals',
    listKey: 'products',
    columns: ['images', 'name', 'price', 'isPublished'],
    columnLabels: { images: 'IMAGEN', name: 'NOMBRE', price: 'PRECIO', isPublished: 'ESTADO' },
    fields: [
      { key: 'name', label: 'Nombre', type: 'text', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'price', label: 'Precio (MXN)', type: 'number' },
      { key: 'ingredients', label: 'Ingredientes (uno por línea)', type: 'jsonarray' },
      { key: 'benefits', label: 'Beneficios (uno por línea)', type: 'jsonarray' },
      { key: 'purchaseUrl', label: 'URL de Compra', type: 'text' },
      { key: 'images', label: 'Imágenes del Producto (máx. 5)', type: 'multi_image' },
      { key: 'sortOrder', label: 'Orden de Aparición', type: 'number' },
      { key: 'isPublished', label: 'Publicado', type: 'checkbox' },
    ],
  },
  news: {
    endpoint: '/admin/news',
    listKey: 'posts',
    columns: ['coverImage', 'title', 'author', 'isPinned', 'isPublished'],
    columnLabels: { coverImage: 'IMAGEN', title: 'TÍTULO', author: 'AUTOR', isPinned: 'FIJADA', isPublished: 'ESTADO' },
    fields: [
      { key: 'title', label: 'Título', type: 'text', required: true },
      { key: 'excerpt', label: 'Extracto / Resumen', type: 'textarea' },
      { key: 'content', label: 'Contenido', type: 'textarea', required: true },
      { key: 'author', label: 'Autor', type: 'text' },
      { key: 'coverImage', label: 'Imagen de Portada', type: 'image' },
      { key: 'images', label: 'Imágenes Adicionales (para galería o insertar en texto)', type: 'multi_image' },
      { key: 'publishedAt', label: 'Fecha de Publicación', type: 'date' },
      { key: 'isPinned', label: 'Fijada (Pin)', type: 'checkbox' },
      { key: 'isPublished', label: 'Publicada', type: 'checkbox' },
    ],
  },
  articles: {
    endpoint: '/admin/articles',
    listKey: 'articles',
    columns: ['coverImage', 'title', 'category', 'isPublished'],
    columnLabels: { coverImage: 'IMAGEN', title: 'TÍTULO', category: 'CATEGORÍA', isPublished: 'ESTADO' },
    fields: [
      { key: 'title', label: 'Título', type: 'text', required: true },
      { key: 'category', label: 'Categoría', type: 'text', required: true },
      { key: 'diseaseId', label: 'ID de Enfermedad (opcional)', type: 'text' },
      { key: 'excerpt', label: 'Extracto / Resumen', type: 'textarea' },
      { key: 'content', label: 'Contenido', type: 'textarea', required: true },
      { key: 'coverImage', label: 'Imagen de Portada', type: 'image' },
      { key: 'videoUrl', label: 'URL de Video (opcional)', type: 'text' },
      { key: 'isPublished', label: 'Publicado', type: 'checkbox' },
    ],
  },
}

function CrudSection({ dark, entity, title }) {
  const cfg = ENTITY_CONFIG[entity]
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.get(cfg.endpoint, { params: search ? { search } : {} })
      .then(r => setItems(r.data[cfg.listKey] || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search, cfg.endpoint, cfg.listKey])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    const defaults = {}
    cfg.fields.forEach(f => {
      if (f.type === 'checkbox') defaults[f.key] = true
      else if (f.type === 'jsonarray') defaults[f.key] = ''
      else if (f.type === 'date') defaults[f.key] = new Date().toISOString().slice(0, 10)
      else if (f.type === 'multi_image') defaults[f.key] = []
      else defaults[f.key] = ''
    })
    setFormData(defaults)
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (item) => {
    const d = {}
    cfg.fields.forEach(f => {
      if (f.type === 'jsonarray') {
        const arr = item[f.key]
        d[f.key] = Array.isArray(arr) ? arr.join('\n') : ''
      } else if (f.type === 'date') {
        d[f.key] = item[f.key] ? new Date(item[f.key]).toISOString().slice(0, 10) : ''
      } else if (f.type === 'checkbox') {
        d[f.key] = !!item[f.key]
      } else if (f.type === 'multi_image') {
        d[f.key] = Array.isArray(item[f.key]) ? item[f.key] : []
      } else {
        d[f.key] = item[f.key] ?? ''
      }
    })
    setFormData(d)
    setEditing(item)
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...formData }
      // Convert jsonarray fields from newline-separated string to arrays
      cfg.fields.forEach(f => {
        if (f.type === 'jsonarray') {
          payload[f.key] = payload[f.key]
            ? payload[f.key].split('\n').map(s => s.trim()).filter(Boolean)
            : []
        }
        if (f.type === 'number' && payload[f.key] !== '' && payload[f.key] !== undefined) {
          payload[f.key] = Number(payload[f.key])
        }
      })

      if (editing) {
        await api.put(`${cfg.endpoint}/${editing.id}`, payload)
      } else {
        await api.post(cfg.endpoint, payload)
      }
      setShowForm(false)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`${cfg.endpoint}/${deleting.id}`)
      setDeleting(null)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar')
    }
  }

  const handleFormat = (fieldKey, formatType) => {
    const textarea = document.getElementById(`textarea-${fieldKey}`)
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selectedText = text.substring(start, end)

    let prefix = ''
    let suffix = ''

    if (formatType === 'bold') {
      prefix = '**'
      suffix = '**'
    } else if (formatType === 'italic') {
      prefix = '*'
      suffix = '*'
    } else if (formatType === 'underline') {
      prefix = '<u>'
      suffix = '</u>'
    }

    const replacement = prefix + selectedText + suffix
    const newValue = text.substring(0, start) + replacement + text.substring(end)

    setFormData(prev => ({ ...prev, [fieldKey]: newValue }))

    setTimeout(() => {
      textarea.focus()
      const newCursorPosStart = start + prefix.length
      const newCursorPosEnd = end + prefix.length
      textarea.setSelectionRange(newCursorPosStart, newCursorPosEnd)
    }, 0)
  }

  const formatCell = (item, col) => {
    const val = item[col]
    if (col === 'coverImage' || col === 'images') {
      const src = col === 'images'
        ? (Array.isArray(val) && val.length > 0 ? val[0] : null)
        : val

      return src ? (
        <div style={{ width: '48px', height: '32px', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${dark ? '#272530' : '#e8ddd0'}` }}>
          <img src={src.startsWith('http') ? src : `/${src}`} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div style={{ width: '48px', height: '32px', borderRadius: '6px', background: dark ? '#1e1c25' : '#faf8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: dark ? '#7e7a8c' : '#a89580', fontSize: '0.65rem' }}>
          Sin img
        </div>
      )
    }
    if (col === 'isPublished' || col === 'isPinned') {
      return (
        <span style={{
          padding: '0.2rem 0.55rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700',
          background: val ? '#10b98118' : '#ef444418',
          color: val ? '#059669' : '#dc2626',
        }}>
          {col === 'isPublished' ? (val ? 'Publicada' : 'Borrador') : (val ? 'Sí' : 'No')}
        </span>
      )
    }
    if (col === 'price') return val != null ? `$${Number(val).toFixed(2)}` : '—'
    return val || '—'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', margin: 0 }}>Gestión de {title}</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <SearchBar value={search} onChange={setSearch} placeholder={`Buscar ${title.toLowerCase()}...`} dark={dark} />
          <Btn onClick={openCreate}><FaPlus size={12} /> Crear nuevo</Btn>
        </div>
      </div>

      <div className="admin-table-container" style={{ ...cardStyle(dark), overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: dark ? '#1e1c25' : '#faf8f5', borderBottom: `1px solid ${dark ? '#272530' : '#e8ddd0'}` }}>
              {cfg.columns.map(col => (
                <th key={col} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.06em', color: dark ? '#e03b60' : '#871233' }}>
                  {cfg.columnLabels[col] || col.toUpperCase()}
                </th>
              ))}
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.06em', color: dark ? '#e03b60' : '#871233' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={cfg.columns.length + 1} style={{ padding: '2rem', textAlign: 'center', color: dark ? '#7e7a8c' : '#a89580' }}>Cargando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={cfg.columns.length + 1} style={{ padding: '2rem', textAlign: 'center', color: dark ? '#7e7a8c' : '#a89580' }}>Sin resultados</td></tr>
            ) : items.map(item => (
              <tr key={item.id} style={{ borderBottom: `1px solid ${dark ? '#1e1c25' : '#f4efe7'}` }}>
                {cfg.columns.map(col => (
                  <td key={col} style={{ padding: '0.75rem 1rem', color: dark ? '#e5dfef' : '#1a1715', fontWeight: col === cfg.columns[0] ? '600' : '400' }}>
                    {formatCell(item, col)}
                  </td>
                ))}
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Btn small variant="ghost" onClick={() => openEdit(item)}><FaEdit size={12} /> Editar</Btn>
                    <Btn small variant="danger" onClick={() => setDeleting(item)}><FaTrash size={11} /></Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <Modal title={editing ? `Editar ${title.slice(0, -1)}` : `Crear ${title.slice(0, -1)}`} onClose={() => setShowForm(false)} dark={dark} wide>
          {cfg.fields.map(f => (
            <FormField key={f.key} label={f.label} dark={dark}>
              {f.type === 'textarea' || f.type === 'jsonarray' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {f.type === 'textarea' && (
                    <div style={{
                      display: 'flex',
                      gap: '0.3rem',
                      marginBottom: '0.2rem',
                      background: dark ? '#1e1c25' : '#faf8f5',
                      border: `1.5px solid ${dark ? '#272530' : '#e8ddd0'}`,
                      borderRadius: '8px',
                      padding: '0.25rem 0.4rem',
                      alignItems: 'center',
                      width: 'fit-content'
                    }}>
                      <button
                        type="button"
                        onClick={() => handleFormat(f.key, 'bold')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: dark ? '#fff' : '#1a1715',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = dark ? '#272530' : '#e8ddd0' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        title="Negrita"
                      >
                        B
                      </button>
                      <span style={{ height: '14px', width: '1px', background: dark ? '#272530' : '#e8ddd0' }} />
                      <button
                        type="button"
                        onClick={() => handleFormat(f.key, 'italic')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: dark ? '#fff' : '#1a1715',
                          fontStyle: 'italic',
                          cursor: 'pointer',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = dark ? '#272530' : '#e8ddd0' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        title="Cursiva"
                      >
                        I
                      </button>
                      <span style={{ height: '14px', width: '1px', background: dark ? '#272530' : '#e8ddd0' }} />
                      <button
                        type="button"
                        onClick={() => handleFormat(f.key, 'underline')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: dark ? '#fff' : '#1a1715',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = dark ? '#272530' : '#e8ddd0' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        title="Subrayado"
                      >
                        U
                      </button>
                    </div>
                  )}
                  <textarea
                    id={`textarea-${f.key}`}
                    rows={f.type === 'jsonarray' ? 4 : 5}
                    value={formData[f.key] || ''}
                    onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ ...inputStyle(dark), resize: 'vertical' }}
                    placeholder={f.type === 'jsonarray' ? 'Un elemento por línea' : ''}
                  />
                </div>
              ) : f.type === 'checkbox' ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem', color: dark ? '#c5bfae' : '#5c5248' }}>
                  <input
                    type="checkbox"
                    checked={!!formData[f.key]}
                    onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.checked }))}
                    style={{ width: '18px', height: '18px', accentColor: '#871233' }}
                  />
                  {formData[f.key] ? 'Sí' : 'No'}
                </label>
              ) : f.type === 'image' ? (
                <ImageUploader
                  value={formData[f.key]}
                  onChange={val => setFormData(prev => ({ ...prev, [f.key]: val }))}
                  dark={dark}
                />
              ) : f.type === 'multi_image' ? (
                <MultiImageUploader
                  value={formData[f.key]}
                  onChange={val => setFormData(prev => ({ ...prev, [f.key]: val }))}
                  dark={dark}
                />
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                  value={formData[f.key] || ''}
                  onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={inputStyle(dark)}
                  required={f.required}
                  step={f.type === 'number' ? '0.01' : undefined}
                />
              )}
            </FormField>
          ))}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn>
            <Btn onClick={handleSave} disabled={saving}>
              <FaSave size={13} /> {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
            </Btn>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleting && (
        <ConfirmModal
          message={`¿Estás seguro de que deseas eliminar "${deleting.name || deleting.title || deleting.id}"? Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          dark={dark}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// MESSAGES SECTION
// ═══════════════════════════════════════════════════════

function MessagesSection({ dark }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/admin/contact/messages')
      .then(r => setMessages(r.data.messages || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const changeStatus = async (id, status) => {
    await api.put(`/admin/contact/messages/${id}/status`, { status })
    load()
  }

  const handleDelete = async () => {
    await api.delete(`/admin/contact/messages/${deleting.id}`)
    setDeleting(null)
    load()
  }

  const statusColors = {
    pending: { bg: '#f59e0b18', color: '#d97706', label: 'Pendiente' },
    read: { bg: '#3b82f618', color: '#2563eb', label: 'Leído' },
    replied: { bg: '#10b98118', color: '#059669', label: 'Respondido' },
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', marginBottom: '1.5rem' }}>Mensajes de Contacto</h2>
      <div className="admin-table-container" style={{ ...cardStyle(dark), overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: dark ? '#1e1c25' : '#faf8f5', borderBottom: `1px solid ${dark ? '#272530' : '#e8ddd0'}` }}>
              {['NOMBRE', 'CORREO', 'ASUNTO', 'ESTADO', 'FECHA', 'ACCIONES'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.06em', color: dark ? '#e03b60' : '#871233' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: dark ? '#7e7a8c' : '#a89580' }}>Cargando...</td></tr>
            ) : messages.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: dark ? '#7e7a8c' : '#a89580' }}>Sin mensajes</td></tr>
            ) : messages.map(m => {
              const sc = statusColors[m.status] || statusColors.pending
              return (
                <tr key={m.id} style={{ borderBottom: `1px solid ${dark ? '#1e1c25' : '#f4efe7'}` }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: dark ? '#e5dfef' : '#1a1715' }}>{m.name}</td>
                  <td style={{ padding: '0.75rem 1rem', color: dark ? '#9ea4b0' : '#7d6e5e' }}>{m.email}</td>
                  <td style={{ padding: '0.75rem 1rem', color: dark ? '#c5bfae' : '#5c5248', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.subject}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <select
                      value={m.status}
                      onChange={e => changeStatus(m.id, e.target.value)}
                      style={{
                        padding: '0.25rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700',
                        border: `1px solid ${dark ? '#272530' : '#e8ddd0'}`,
                        background: sc.bg, color: sc.color, cursor: 'pointer',
                      }}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="read">Leído</option>
                      <option value="replied">Respondido</option>
                    </select>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: dark ? '#7e7a8c' : '#a89580', fontSize: '0.8rem' }}>
                    {new Date(m.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Btn small variant="danger" onClick={() => setDeleting(m)}><FaTrash size={11} /></Btn>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {deleting && (
        <ConfirmModal
          message={`¿Eliminar el mensaje de "${deleting.name}" sobre "${deleting.subject}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          dark={dark}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// CONTACT SETTINGS SECTION
// ═══════════════════════════════════════════════════════

function ContactSettingsSection({ dark }) {
  const [generalForm, setGeneralForm] = useState({
    address: '',
    phone: '',
    email: '',
    schedule: '',
    latitude: '',
    longitude: '',
    label: '',
  })
  const [generalSaving, setGeneralSaving] = useState(false)
  const [generalSaved, setGeneralSaved] = useState(false)

  // Locations state
  const [locations, setLocations] = useState([])
  const [locationsLoading, setLocationsLoading] = useState(true)
  const [showLocationForm, setShowLocationForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [deletingLocation, setDeletingLocation] = useState(null)
  const [locationFormData, setLocationFormData] = useState({
    label: '',
    address: '',
    latitude: '',
    longitude: '',
  })
  const [locationSaving, setLocationSaving] = useState(false)

  const loadGeneral = () => {
    api.get('/admin/contact/settings').then(r => {
      if (r.data.settings) setGeneralForm(prev => ({ ...prev, ...r.data.settings }))
    }).catch(() => {})
  }

  const loadLocations = () => {
    setLocationsLoading(true)
    api.get('/admin/locations')
      .then(r => setLocations(r.data.locations || []))
      .catch(() => {})
      .finally(() => setLocationsLoading(false))
  }

  useEffect(() => {
    loadGeneral()
    loadLocations()
  }, [])

  const handleGeneralSave = async () => {
    setGeneralSaving(true)
    setGeneralSaved(false)
    try {
      await api.put('/admin/contact/settings', generalForm)
      setGeneralSaved(true)
      setTimeout(() => setGeneralSaved(false), 3000)
    } catch (err) {
      alert('Error al guardar configuración general')
    } finally {
      setGeneralSaving(false)
    }
  }

  const openCreateLocation = () => {
    setLocationFormData({
      label: '',
      address: '',
      latitude: '',
      longitude: '',
    })
    setEditingLocation(null)
    setShowLocationForm(true)
  }

  const openEditLocation = (loc) => {
    setLocationFormData({
      label: loc.label,
      address: loc.address,
      latitude: loc.latitude,
      longitude: loc.longitude,
    })
    setEditingLocation(loc)
    setShowLocationForm(true)
  }

  const handleSaveLocation = async () => {
    setLocationSaving(true)
    try {
      const payload = {
        label: locationFormData.label,
        address: locationFormData.address,
        latitude: parseFloat(locationFormData.latitude),
        longitude: parseFloat(locationFormData.longitude),
      }
      if (editingLocation) {
        await api.put(`/admin/locations/${editingLocation.id}`, payload)
      } else {
        await api.post('/admin/locations', payload)
      }
      setShowLocationForm(false)
      loadLocations()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar sede')
    } finally {
      setLocationSaving(false)
    }
  }

  const handleDeleteLocation = async () => {
    try {
      await api.delete(`/admin/locations/${deletingLocation.id}`)
      setDeletingLocation(null)
      loadLocations()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar sede')
    }
  }

  const getMapUrl = (lat, lng) => {
    const parsedLat = parseFloat(lat)
    const parsedLng = parseFloat(lng)
    if (isNaN(parsedLat) || isNaN(parsedLng)) return null
    return `https://www.openstreetmap.org/export/embed.html?bbox=${parsedLng - 0.008},${parsedLat - 0.005},${parsedLng + 0.008},${parsedLat + 0.005}&layer=mapnik&marker=${parsedLat},${parsedLng}`
  }

  function MapPreview({ latitude, longitude, label, dark }) {
    const mapUrl = getMapUrl(latitude, longitude)

    if (!mapUrl) {
      return (
        <div style={{
          height: '100%',
          minHeight: '260px',
          borderRadius: '12px',
          border: `2px dashed ${dark ? '#272530' : '#e8ddd0'}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: dark ? '#7e7a8c' : '#a89580',
          padding: '2rem',
          textAlign: 'center',
          background: dark ? '#1e1c25' : '#faf8f5',
        }}>
          <FaMapMarkerAlt size={32} style={{ marginBottom: '0.5rem', color: '#e03b60' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Vista previa del mapa no disponible</span>
          <span style={{ fontSize: '0.72rem', marginTop: '0.25rem' }}>Ingrese latitud y longitud válidas</span>
        </div>
      )
    }

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '260px', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${dark ? '#272530' : '#e8ddd0'}` }}>
        <iframe
          title={`Vista previa — ${label || 'Ubicación'}`}
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 'none', minHeight: '260px', display: 'block' }}
          loading="lazy"
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* ── 1. GENERAL CONTACT SETTINGS ── */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', marginBottom: '1.25rem' }}>
          Información General de Contacto
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          ...cardStyle(dark),
          padding: '2rem',
        }}>
          {/* Inputs Column */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FormField label="Teléfono" dark={dark}>
              <input type="text" value={generalForm.phone || ''} onChange={e => setGeneralForm(p => ({ ...p, phone: e.target.value }))} style={inputStyle(dark)} />
            </FormField>
            
            <FormField label="Correo electrónico" dark={dark}>
              <input type="text" value={generalForm.email || ''} onChange={e => setGeneralForm(p => ({ ...p, email: e.target.value }))} style={inputStyle(dark)} />
            </FormField>

            <FormField label="Horario de atención" dark={dark}>
              <textarea rows={3} value={generalForm.schedule || ''} onChange={e => setGeneralForm(p => ({ ...p, schedule: e.target.value }))} style={{ ...inputStyle(dark), resize: 'vertical' }} />
            </FormField>

            <div style={{ height: '1px', background: dark ? '#272530' : '#e8ddd0', margin: '0.75rem 0 1.25rem' }} />

            <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: dark ? '#e03b60' : '#871233', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Ubicación Principal (Oficial)
            </h3>

            <FormField label="Nombre / Etiqueta de la ubicación" dark={dark}>
              <input type="text" value={generalForm.label || ''} onChange={e => setGeneralForm(p => ({ ...p, label: e.target.value }))} style={inputStyle(dark)} />
            </FormField>

            <FormField label="Dirección completa" dark={dark}>
              <input type="text" value={generalForm.address || ''} onChange={e => setGeneralForm(p => ({ ...p, address: e.target.value }))} style={inputStyle(dark)} />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FormField label="Latitud" dark={dark}>
                <input type="number" step="any" value={generalForm.latitude || ''} onChange={e => setGeneralForm(p => ({ ...p, latitude: e.target.value }))} style={inputStyle(dark)} />
              </FormField>
              <FormField label="Longitud" dark={dark}>
                <input type="number" step="any" value={generalForm.longitude || ''} onChange={e => setGeneralForm(p => ({ ...p, longitude: e.target.value }))} style={inputStyle(dark)} />
              </FormField>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
              <Btn onClick={handleGeneralSave} disabled={generalSaving}>
                <FaSave size={13} /> {generalSaving ? 'Guardando...' : 'Guardar Información'}
              </Btn>
              {generalSaved && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#059669', fontSize: '0.85rem', fontWeight: '600' }}>
                  <FaCheck size={13} /> Guardado correctamente
                </span>
              )}
            </div>
          </div>

          {/* Map Preview Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: dark ? '#9ea4b0' : '#5c5248' }}>
              Previsualización del Mapa Oficial
            </span>
            <div style={{ flex: 1, minHeight: '340px' }}>
              <MapPreview latitude={generalForm.latitude} longitude={generalForm.longitude} label={generalForm.label} dark={dark} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. PREDEFINED LOCATIONS CRUD ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: dark ? '#fff' : '#1a1715', margin: 0 }}>
            Directorio de Sedes y Sucursales
          </h2>
          <Btn onClick={openCreateLocation}><FaPlus size={12} /> Agregar nueva sede</Btn>
        </div>

        <div style={{ ...cardStyle(dark), overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: dark ? '#1e1c25' : '#faf8f5', borderBottom: `1px solid ${dark ? '#272530' : '#e8ddd0'}` }}>
                {['MAPA', 'SEDE', 'DIRECCIÓN', 'COORDENADAS', 'ACCIONES'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.06em', color: dark ? '#e03b60' : '#871233' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {locationsLoading ? (
                <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: dark ? '#7e7a8c' : '#a89580' }}>Cargando sedes...</td></tr>
              ) : locations.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: dark ? '#7e7a8c' : '#a89580' }}>No hay sedes registradas.</td></tr>
              ) : locations.map(loc => (
                <tr key={loc.id} style={{ borderBottom: `1px solid ${dark ? '#1e1c25' : '#f4efe7'}` }}>
                  <td style={{ padding: '0.5rem 1rem' }}>
                    <div style={{ width: '64px', height: '48px', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${dark ? '#272530' : '#e8ddd0'}` }}>
                      {getMapUrl(loc.latitude, loc.longitude) ? (
                        <iframe
                          title={`Sede — ${loc.label}`}
                          src={getMapUrl(loc.latitude, loc.longitude)}
                          width="100%"
                          height="100%"
                          style={{ border: 'none', pointerEvents: 'none' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: dark ? '#1e1c25' : '#faf8f5', color: dark ? '#7e7a8c' : '#a89580', fontSize: '0.6rem' }}>Sin mapa</div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: dark ? '#e5dfef' : '#1a1715' }}>
                    {loc.label} {loc.isOfficial && <span style={{ fontSize: '0.65rem', background: '#e03b6018', color: '#e03b60', padding: '1px 5px', borderRadius: '4px', marginLeft: '5px' }}>Principal</span>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: dark ? '#9ea4b0' : '#7d6e5e', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {loc.address}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: dark ? '#7e7a8c' : '#a89580', fontSize: '0.8rem' }}>
                    {parseFloat(loc.latitude).toFixed(5)}, {parseFloat(loc.longitude).toFixed(5)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Btn small variant="ghost" onClick={() => openEditLocation(loc)}><FaEdit size={12} /> Editar</Btn>
                      <Btn small variant="danger" onClick={() => setDeletingLocation(loc)}><FaTrash size={11} /></Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Location Modal */}
      {showLocationForm && (
        <Modal title={editingLocation ? 'Editar Sede' : 'Agregar Nueva Sede'} onClose={() => setShowLocationForm(false)} dark={dark} wide>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Form Fields */}
            <div>
              <FormField label="Nombre de la sede" dark={dark}>
                <input
                  type="text"
                  value={locationFormData.label}
                  onChange={e => setLocationFormData(p => ({ ...p, label: e.target.value }))}
                  style={inputStyle(dark)}
                  required
                />
              </FormField>

              <FormField label="Dirección completa" dark={dark}>
                <input
                  type="text"
                  value={locationFormData.address}
                  onChange={e => setLocationFormData(p => ({ ...p, address: e.target.value }))}
                  style={inputStyle(dark)}
                  required
                />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField label="Latitud" dark={dark}>
                  <input
                    type="number"
                    step="any"
                    value={locationFormData.latitude}
                    onChange={e => setLocationFormData(p => ({ ...p, latitude: e.target.value }))}
                    style={inputStyle(dark)}
                    required
                  />
                </FormField>
                <FormField label="Longitud" dark={dark}>
                  <input
                    type="number"
                    step="any"
                    value={locationFormData.longitude}
                    onChange={e => setLocationFormData(p => ({ ...p, longitude: e.target.value }))}
                    style={inputStyle(dark)}
                    required
                  />
                </FormField>
              </div>
            </div>

            {/* Live Map Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: dark ? '#9ea4b0' : '#5c5248' }}>
                Previsualización en tiempo real
              </span>
              <div style={{ flex: 1, minHeight: '200px' }}>
                <MapPreview latitude={locationFormData.latitude} longitude={locationFormData.longitude} label={locationFormData.label} dark={dark} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <Btn variant="ghost" onClick={() => setShowLocationForm(false)}>Cancelar</Btn>
            <Btn onClick={handleSaveLocation} disabled={locationSaving}>
              <FaSave size={13} /> {locationSaving ? 'Guardando...' : editingLocation ? 'Actualizar' : 'Crear'}
            </Btn>
          </div>
        </Modal>
      )}

      {/* Delete Location Confirm Modal */}
      {deletingLocation && (
        <ConfirmModal
          message={`¿Estás seguro de que deseas eliminar la sede "${deletingLocation.label}"? Esta acción no se puede deshacer.`}
          onConfirm={handleDeleteLocation}
          onCancel={() => setDeletingLocation(null)}
          dark={dark}
        />
      )}
    </div>
  )
}
