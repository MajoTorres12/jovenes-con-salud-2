import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaHeartbeat, FaBookMedical, FaHandsHelping, FaChartLine, FaTimes, FaNewspaper, FaThumbtack, FaGlobe, FaMapMarkerAlt } from 'react-icons/fa'
import { HiArrowRight } from 'react-icons/hi'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api, { getApiBaseUrl } from '../services/api'

const API_BASE = getApiBaseUrl()
const newsImgSrc = (p) => !p ? null : p.startsWith('http') ? p : `/${p}`
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

const features = [
  {
    icon: FaBookMedical,
    title: 'Información sobre ECNT',
    description: 'Conoce sobre diabetes, hipertensión, obesidad y otras enfermedades crónicas no transmisibles.',
    to: '/enfermedades',
    color: 'var(--color-info)',
  },
  {
    icon: FaHandsHelping,
    title: 'Programas Sociales',
    description: 'Descubre programas de apoyo gubernamental enfocados en la salud de los jóvenes.',
    to: '/programas',
    color: 'var(--color-accent-500)',
  },
  {
    icon: FaChartLine,
    title: 'Seguimiento de Salud',
    description: 'Registra y monitorea tus indicadores de salud con gráficas personalizadas.',
    to: '/login',
    color: 'var(--color-warning)',
  },
]

const statsMexico = [
  { value: '41.1%', label: 'Sobrepeso y Obesidad', desc: 'En adolescentes y jóvenes, siendo el detonante principal de diabetes e hipertensión prematuras.' },
  { value: '14.6M+', label: 'Diabetes en México', desc: 'Prevalencia total estimada en adultos, con una incidencia alarmante y a menor edad (ENSANUT).' },
  { value: '30M+', label: 'Hipertensión Arterial', desc: 'Estimado de personas viviendo con presión alta; el 65% desconoce que tiene esta condición.' },
  { value: '2 de 3', label: 'Consumo de Azúcar', desc: 'Jóvenes exceden el límite diario de azúcares recomendados por la OMS.' },
  { value: '< 20%', label: 'Detección Oportuna', desc: 'De los jóvenes acuden a realizarse pruebas de tamizaje o control médico anual.' }
]

const statsTamaulipas = [
  { value: '49%', label: 'Malnutrición Escolar', desc: 'De jóvenes entre 10 y 19 años presentan sobrepeso u obesidad en el estado.' },
  { value: '21.4K+', label: 'Diabetes Tipo 2', desc: 'Casos acumulados bajo control en el estado durante el último ciclo epidemiológico.' },
  { value: '37.7K+', label: 'Hipertensión Estatal', desc: 'Casos activos bajo monitoreo y control en el sector de salud pública estatal.' },
  { value: '20 años', label: 'Diagnóstico Precoz', desc: 'Edad promedio en la que comienzan a registrarse casos de diabetes e hipertensión.' },
  { value: '199K+', label: 'Casos en Seguimiento', desc: 'Personas con obesidad o riesgo metabólico bajo monitoreo de salud en el estado.' }
]

export default function Home() {
  const { isAuthenticated, user } = useAuth()
  const { dark } = useTheme()
  const [featuredNews, setFeaturedNews] = useState([])

  useEffect(() => {
    api.get('/news/featured').then(r => setFeaturedNews(r.data.posts || [])).catch(() => { })
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        background: 'var(--hero-gradient)',
        overflow: 'hidden',
      }}>
        {/* Background pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.05,
          backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                           radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />

        {/* Floating shapes */}
        <div style={{
          position: 'absolute',
          top: '10%', right: '10%',
          width: '300px', height: '300px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(59, 130, 246, 0.15))',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%', left: '5%',
          width: '200px', height: '200px',
          borderRadius: '50%',
          background: 'rgba(96, 165, 250, 0.1)',
          filter: 'blur(40px)',
        }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem', width: '100%', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3rem', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '650px', flex: '1 1 500px' }}>
            <div className="animate-fade-in-up" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
              borderRadius: '9999px',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.15)',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: 'var(--color-hero-badge)',
            }}>
              <FaHeartbeat />
              Instituto de la Juventud de Tamaulipas
            </div>

            <h1 className="animate-fade-in-up stagger-1" style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: '800',
              color: 'white',
              lineHeight: '1.1',
              marginBottom: '1.5rem',
            }}>
              Tu salud importa,{' '}
              <span style={{ color: 'var(--color-hero-highlight)' }}>infórmate y actúa</span>
            </h1>

            <p className="animate-fade-in-up stagger-2" style={{
              fontSize: '1.125rem',
              color: 'rgba(255,255,255,0.8)',
              lineHeight: '1.8',
              marginBottom: '2rem',
              maxWidth: '560px',
            }}>
              Plataforma digital para jóvenes de 18 a 29 años con información sobre
              enfermedades crónicas, programas de apoyo social y herramientas de
              seguimiento de salud personalizado.
            </p>

            <div className="animate-fade-in-up stagger-3" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {isAuthenticated ? (
                <Link to={user?.role === 'admin' ? '/admin' : user?.role === 'doctor' ? '/doctor' : '/dashboard'} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 2rem',
                  borderRadius: 'var(--radius-xl)',
                  background: 'linear-gradient(135deg, var(--color-accent-400), var(--color-accent-600))',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '1rem',
                  boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)',
                  transition: 'all 0.3s ease',
                }}>
                  {user?.role === 'admin' ? 'Ir al Panel Admin' : user?.role === 'doctor' ? 'Ir al Panel Médico' : 'Ir a Mi Salud'}
                  <HiArrowRight />
                </Link>
              ) : (
                <Link to="/registro" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 2rem',
                  borderRadius: 'var(--radius-xl)',
                  background: 'linear-gradient(135deg, var(--color-accent-400), var(--color-accent-600))',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '1rem',
                  boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)',
                  transition: 'all 0.3s ease',
                }}>
                  Crear Cuenta Gratis
                  <HiArrowRight />
                </Link>
              )}
              <Link to="/enfermedades" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 2rem',
                borderRadius: 'var(--radius-xl)',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
              }}>
                Explorar Información
              </Link>
            </div>
          </div>

          {/* Right Logo Column */}
          <div className="animate-fade-in-up stagger-3" style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '420px', aspectRatio: '1/1' }}>
              <svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                <defs>
                  {/* Background Gradient */}
                  <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={dark ? '#1E1F28' : '#faf8f5'} />
                    <stop offset="100%" stopColor={dark ? '#0E0F14' : '#f4efe7'} />
                  </linearGradient>
                  
                  {/* Heart Gradient */}
                  <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--color-primary-400)" />
                    <stop offset="100%" stopColor="var(--color-primary-600)" />
                  </linearGradient>
                  
                  {/* Glow Filter */}
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  
                  {/* Subtle Shadow for Plate */}
                  <filter id="plateShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="16" stdDeviation="20" floodColor={dark ? '#000000' : '#4e0413'} floodOpacity={dark ? '0.5' : '0.12'} />
                  </filter>
                </defs>

                {/* Outer Plate / Glassmorphism Container */}
                <rect 
                  x="20" y="20" width="360" height="360" rx="40" 
                  fill="url(#bgGrad)" 
                  stroke={dark ? 'rgba(196, 61, 90, 0.25)' : 'rgba(135, 18, 51, 0.15)'} 
                  strokeWidth="2"
                  filter="url(#plateShadow)"
                  style={{ transition: 'all 0.3s ease' }}
                />

                {/* Brand Text */}
                <text 
                  x="200" 
                  y="322" 
                  textAnchor="middle" 
                  fontFamily="var(--font-sans)" 
                  fontSize="22" 
                  fontWeight="800" 
                  fill={dark ? '#EDEEF2' : 'var(--color-primary-500)'} 
                  letterSpacing="2"
                  style={{ transition: 'all 0.3s ease' }}
                >
                  Jóvenes con Salud
                </text>

                <g transform="translate(100, 75) scale(2)">
                  {/* Heart Shape */}
                  <path 
                    d="M 50 15 C 35 -5, 0 0, 0 35 C 0 60, 30 80, 50 95 C 70 80, 100 60, 100 35 C 100 0, 65 -5, 50 15 Z" 
                    fill="url(#heartGrad)" 
                    opacity="0.95"
                    style={{ transition: 'all 0.3s ease' }}
                  />
                  
                  {/* Heartbeat Pulse Line (ECG) */}
                  <path 
                    d="M -15 50 L 20 50 L 28 45 L 35 55 L 45 10 L 55 85 L 63 45 L 70 52 L 78 50 L 115 50" 
                    fill="none" 
                    stroke={dark ? '#ffffff' : 'var(--color-accent-400)'} 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    filter="url(#glow)"
                    style={{ transition: 'all 0.3s ease' }}
                  />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── Institutional Logos Banner ─────────────────────── */}
      <section className="institutions-section" style={{
        background: 'var(--institutions-gradient)',
        padding: '2.25rem 1.5rem 2.5rem',
        borderBottom: '1px solid var(--color-surface-200)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{
            textAlign: 'center',
            fontSize: '0.65rem',
            fontWeight: '700',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
            marginBottom: '1.5rem',
          }}>
            Instituciones que respaldan este proyecto
          </p>

          {/* Logo grid: 4 cols desktop → 2 cols tablet → 2 cols mobile */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            alignItems: 'center',
          }}
            className="logos-grid"
          >
            {[
              { src: '/logo-tamaulipas.png', alt: 'Gobierno del Estado de Tamaulipas', maxW: '240px', href: 'https://www.tamaulipas.gob.mx/' },
              { src: '/logo-injuventud.png', alt: 'Instituto de la Juventud de Tamaulipas', maxW: '180px', href: 'https://www.tamaulipas.gob.mx/jovenes/' },
              { src: '/logo-salud.jpg', alt: 'Secretaría de Salud de Tamaulipas', maxW: '200px', href: 'https://www.tamaulipas.gob.mx/salud/' },
              { src: '/logo-bienestar.png', alt: 'Secretaría del Bienestar', maxW: '240px', href: 'https://www.tamaulipas.gob.mx/bienestarsocial/' },
            ].map((logo, i) => (
              <a key={i} href={logo.href} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: dark ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.97)',
                borderRadius: '16px',
                padding: '1.25rem 1.75rem',
                boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.18)',
                transition: 'transform 0.22s ease, box-shadow 0.22s ease',
                minHeight: '100px',
                textDecoration: 'none',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = dark ? '0 8px 28px rgba(0,0,0,0.55)' : '0 8px 28px rgba(0,0,0,0.25)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = dark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.18)' }}
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  title={logo.alt}
                  style={{
                    height: 'auto',
                    maxHeight: '68px',
                    width: '100%',
                    maxWidth: logo.maxW,
                    objectFit: 'contain',
                  }}
                  onError={e => { e.currentTarget.parentElement.style.display = 'none' }}
                />
              </a>
            ))}
          </div>

          {/* Responsive styles injected via a style tag */}
          <style>{`
            @media (max-width: 640px) {
              .logos-grid { grid-template-columns: repeat(2, 1fr) !important; }
            }
          `}</style>
        </div>
      </section>

      {/* Stats Section with Justifications */}
      <section style={{
        background: 'var(--color-surface-100)',
        padding: '5rem 1.5rem',
        borderBottom: '1px solid var(--color-surface-200)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.3rem 0.875rem',
              borderRadius: '20px',
              background: 'rgba(135,18,51,0.08)',
              color: '#871233',
              fontSize: '0.75rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.75rem'
            }}>
              <FaChartLine size={11} /> Impacto & Justificación
            </div>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              fontWeight: '800',
              color: 'var(--color-surface-900)',
              marginBottom: '1rem',
              letterSpacing: '-0.02em',
            }}>
              El desafío de las ECNT en la juventud
            </h2>
            <p style={{
              fontSize: '1.05rem',
              color: 'var(--color-surface-500)',
              maxWidth: '650px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              Las Enfermedades Crónicas No Transmisibles (ECNT) ya no son exclusivas de la edad avanzada. Conoce la realidad que justifica la necesidad de una prevención activa.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
          }}>
            {/* México Card */}
            <div style={{
              background: 'var(--color-surface-50)',
              borderRadius: '24px',
              padding: '2.5rem',
              border: '1px solid var(--color-surface-200)',
              boxShadow: 'var(--shadow-card)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            className="hover-lift">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3b82f6'
                  }}>
                    <FaGlobe size={20} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-surface-900)' }}>
                    Situación en México (Nacional)
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                  {statsMexico.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                      <div style={{
                        fontSize: '2rem',
                        fontWeight: '800',
                        color: 'var(--color-primary-500)',
                        minWidth: '95px',
                        lineHeight: '1',
                        background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                        {item.value}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-surface-800)', marginBottom: '0.25rem' }}>
                          {item.label}
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-surface-500)', lineHeight: '1.4' }}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tamaulipas Card */}
            <div style={{
              background: 'var(--color-surface-50)',
              borderRadius: '24px',
              padding: '2.5rem',
              border: '1px solid var(--color-surface-200)',
              boxShadow: 'var(--shadow-card)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            className="hover-lift">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981'
                  }}>
                    <FaMapMarkerAlt size={20} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-surface-900)' }}>
                    Situación en Tamaulipas (Estatal)
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                  {statsTamaulipas.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                      <div style={{
                        fontSize: '2rem',
                        fontWeight: '800',
                        color: 'var(--color-accent-500)',
                        minWidth: '95px',
                        lineHeight: '1',
                        background: 'linear-gradient(135deg, var(--color-accent-400), var(--color-accent-600))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                        {item.value}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-surface-800)', marginBottom: '0.25rem' }}>
                          {item.label}
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-surface-500)', lineHeight: '1.4' }}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '5rem 1.5rem', background: 'var(--color-surface-50)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: 'var(--color-surface-900)',
              marginBottom: '0.75rem',
            }}>
              ¿Qué encontrarás aquí?
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--color-surface-500)', maxWidth: '600px', margin: '0 auto' }}>
              Herramientas y recursos diseñados para empoderar a jóvenes tamaulipecos en el cuidado de su salud.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}>
            {features.map((feature, i) => (
              <Link
                key={i}
                to={feature.to}
                className="animate-fade-in-up"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  padding: '2rem',
                  borderRadius: 'var(--radius-xl)',
                  background: 'var(--color-surface-100)',
                  textDecoration: 'none',
                  boxShadow: 'var(--shadow-card)',
                  border: '1px solid var(--color-surface-200)',
                  transition: 'all 0.3s ease',
                  display: 'block',
                }}
              >
                <div style={{
                  width: '48px', height: '48px',
                  borderRadius: 'var(--radius-lg)',
                  background: `${feature.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}>
                  <feature.icon style={{ fontSize: '1.25rem', color: feature.color }} />
                </div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'var(--color-surface-900)',
                  marginBottom: '0.5rem',
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: 'var(--color-surface-500)',
                  lineHeight: '1.6',
                  marginBottom: '1rem',
                }}>
                  {feature.description}
                </p>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: 'var(--color-primary-500)',
                }}>
                  Explorar <HiArrowRight />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Latest News ──────────────────────────────────── */}
      {featuredNews.length > 0 && (
        <section style={{ padding: '5rem 1.5rem', background: 'var(--color-surface-100)' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.875rem', borderRadius: '20px', background: 'rgba(135,18,51,0.08)', color: '#871233', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                  <FaNewspaper size={11} /> Noticias
                </div>
                <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: '800', color: 'var(--color-surface-900)', margin: 0, letterSpacing: '-0.02em' }}>Últimas Noticias</h2>
              </div>
              <Link to="/noticias" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.25rem', borderRadius: '10px', border: '1.5px solid #871233', color: '#871233', fontWeight: '700', textDecoration: 'none', fontSize: '0.875rem', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#871233'; e.currentTarget.style.color = 'white' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#871233' }}>
                Explorar <HiArrowRight />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {featuredNews.map(post => (
                <Link key={post.id} to={`/noticias/${post.slug}`} style={{ display: 'block', textDecoration: 'none', background: 'var(--color-surface-50)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--color-surface-200)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={{ height: '160px', overflow: 'hidden', background: 'linear-gradient(135deg, #871233, #5e0c23)', position: 'relative' }}>
                    {newsImgSrc(post.coverImage)
                      ? <img src={newsImgSrc(post.coverImage)} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>📰</div>
                    }
                    {post.isPinned && <span style={{ position: 'absolute', top: '8px', left: '8px', padding: '2px 8px', borderRadius: '20px', background: '#871233', color: 'white', fontSize: '0.6rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><FaThumbtack size={8} /></span>}
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--color-surface-500)', fontWeight: '700', marginBottom: '0.4rem' }}>{fmtDate(post.publishedAt)}</p>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-surface-900)', marginBottom: '0.4rem', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.title}</h3>
                    {post.excerpt && <p style={{ fontSize: '0.78rem', color: 'var(--color-surface-500)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{
        padding: '5rem 1.5rem',
        background: 'var(--cta-gradient)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'white', marginBottom: '1rem' }}>
            Empieza a cuidar tu salud hoy
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)', marginBottom: '2rem', lineHeight: '1.7' }}>
            Regístrate gratis y accede a herramientas de seguimiento personalizado,
            información confiable y programas de apoyo social.
          </p>
          {isAuthenticated ? (
            <Link to={user?.role === 'admin' ? '/admin' : user?.role === 'doctor' ? '/doctor' : '/dashboard'} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 2.5rem',
              borderRadius: 'var(--radius-xl)',
              background: 'white',
              color: 'var(--color-primary-600)',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '1.05rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            }}>
              {user?.role === 'admin' ? 'Ir al Panel Admin' : user?.role === 'doctor' ? 'Ir al Panel Médico' : 'Ir a Mi Salud'}
              <HiArrowRight />
            </Link>
          ) : (
            <Link to="/registro" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 2.5rem',
              borderRadius: 'var(--radius-xl)',
              background: 'white',
              color: 'var(--color-primary-600)',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '1.05rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            }}>
              Crear Mi Cuenta
              <HiArrowRight />
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
