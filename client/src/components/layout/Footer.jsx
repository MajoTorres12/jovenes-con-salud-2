import { Link } from 'react-router-dom'
import { FaHeartbeat, FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa'
import { HiMail, HiPhone, HiLocationMarker } from 'react-icons/hi'

export default function Footer() {
  return (
    <footer style={{
      background: 'linear-gradient(180deg, var(--color-footer-bg-start), var(--color-footer-bg-end))',
      color: 'var(--color-footer-text)',
      paddingTop: '3rem',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          paddingBottom: '2rem',
        }}>
          {/* About */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <FaHeartbeat style={{ fontSize: '1.5rem', color: '#c2a378' }} />
              <span style={{ fontSize: '1.125rem', fontWeight: '700', color: 'white' }}>
                Jóvenes con Salud
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.7', color: 'var(--color-footer-muted)' }}>
              Plataforma del Instituto de la Juventud de Tamaulipas para jóvenes de 18 a 29 años
              con información sobre enfermedades crónicas y programas de apoyo social.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              {[FaFacebookF, FaTwitter, FaInstagram].map((Icon, i) => (
                <a key={i} href="#" style={{
                  width: '36px', height: '36px',
                  borderRadius: '50%',
                  background: 'var(--color-footer-icon-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-footer-muted)',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#871233'; e.currentTarget.style.color = '#ffffff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-footer-icon-bg)'; e.currentTarget.style.color = 'var(--color-footer-muted)' }}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'white', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Navegación
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { to: '/enfermedades', label: 'Enfermedades Crónicas' },
                { to: '/programas', label: 'Programas Sociales' },
                { to: '/faq', label: 'Preguntas Frecuentes' },
                { to: '/contacto', label: 'Contacto' },
              ].map(link => (
                <Link key={link.to} to={link.to} style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-footer-muted)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-footer-muted)'}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'white', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Contacto
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <HiLocationMarker style={{ color: '#c2a378', flexShrink: 0 }} />
                <span>Cd. Victoria, Tamaulipas, México</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <HiPhone style={{ color: '#c2a378', flexShrink: 0 }} />
                <span>(834) 123-4567</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <HiMail style={{ color: '#c2a378', flexShrink: 0 }} />
                <span>contacto@jovenesconsalud.gob.mx</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid var(--color-footer-border)',
          padding: '1.25rem 0',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8rem',
          color: 'var(--color-footer-muted-light)',
        }}>
          <p>© 2026 Instituto de la Juventud de Tamaulipas. Todos los derechos reservados.</p>
          <p>Gobierno del Estado de Tamaulipas</p>
        </div>
      </div>
    </footer>
  )
}
