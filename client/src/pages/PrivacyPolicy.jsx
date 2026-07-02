import { useTheme } from '../context/ThemeContext'
import { FaShieldAlt, FaCalendarAlt, FaLock, FaUserShield, FaClipboardList } from 'react-icons/fa'

export default function PrivacyPolicy() {
  const { dark } = useTheme()

  const cardStyle = {
    background: 'var(--color-surface-100)',
    borderRadius: '16px',
    border: '1px solid var(--color-surface-200)',
    padding: '1.75rem',
    marginBottom: '1.5rem',
    boxShadow: 'var(--shadow-card)',
  }

  const headingStyle = {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: dark ? '#fff' : '#111827',
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    marginBottom: '1rem',
  }

  const paragraphStyle = {
    fontSize: '0.925rem',
    lineHeight: '1.75',
    color: 'var(--color-surface-600)',
    margin: '0 0 1rem 0',
  }

  const listStyle = {
    margin: '0 0 1.25rem 1.5rem',
    padding: 0,
    fontSize: '0.925rem',
    lineHeight: '1.75',
    color: 'var(--color-surface-600)',
  }

  return (
    <div style={{ padding: '3rem 1.5rem', maxWidth: '850px', margin: '0 auto', background: 'var(--color-surface-50)' }}>
      
      {/* Header section */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.4rem 1rem', borderRadius: '9999px',
          background: 'var(--color-primary-50)', color: 'var(--color-primary-500)',
          fontSize: '0.85rem', fontWeight: '600', marginBottom: '1rem',
        }}>
          <FaShieldAlt /> Seguridad de Datos
        </div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.25rem)', fontWeight: '800', color: 'var(--color-surface-900)', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          Aviso de Privacidad
        </h1>
        <p style={{ color: 'var(--color-surface-500)', fontSize: '0.95rem', maxWidth: '580px', margin: '0 auto', lineHeight: '1.5' }}>
          Conoce cómo el Instituto de la Juventud de Tamaulipas recopila, protege y trata la información de salud de los jóvenes participantes.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--color-surface-400)', fontWeight: '600', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-surface-200)', paddingBottom: '0.75rem' }}>
        <FaCalendarAlt /> Última actualización: 02 de Julio de 2026
      </div>

      {/* 1. Responsable */}
      <div style={cardStyle}>
        <h2 style={headingStyle}>
          <FaUserShield style={{ color: 'var(--color-primary-500)' }} />
          1. Responsable del Tratamiento de Datos
        </h2>
        <p style={paragraphStyle}>
          El <strong>Instituto de la Juventud de Tamaulipas (IJT)</strong>, con domicilio oficial en Ciudad Victoria, Tamaulipas, es el responsable del uso, protección y resguardo seguro de los datos personales recopilados a través de la plataforma digital <strong>Jóvenes con Salud</strong>.
        </p>
        <p style={paragraphStyle}>
          Nos comprometemos a garantizar tu privacidad aplicando los estándares éticos, médicos y tecnológicos necesarios para salvaguardar tu información de acuerdo con las leyes federales y estatales aplicables en materia de protección de datos personales.
        </p>
      </div>

      {/* 2. Datos Recabados */}
      <div style={cardStyle}>
        <h2 style={headingStyle}>
          <FaClipboardList style={{ color: 'var(--color-primary-500)' }} />
          2. Datos Personales que Recabamos
        </h2>
        <p style={paragraphStyle}>
          Para prestar los servicios de la plataforma, recabamos los siguientes datos de forma directa durante el registro y uso de la misma:
        </p>
        <ul style={listStyle}>
          <li><strong>Datos de Identificación</strong>: Nombre completo, correo electrónico y fecha de nacimiento (para validar el rango de edad institucional de 18 a 29 años).</li>
          <li><strong>Métricas de Salud (Registro Voluntario)</strong>: Peso, estatura (para el cálculo de IMC), niveles de glucosa, frecuencia cardíaca, presión arterial, colesterol, triglicéridos y sintomatología clínica.</li>
          <li><strong>Información del Tratamiento</strong>: Medicamentos y suplementos que registres en tus recordatorios de salud.</li>
          <li><strong>Contactos de Emergencia</strong>: Datos de contacto de familiares o tutores de confianza para activar el protocolo de alerta en caso de emergencias médicas.</li>
        </ul>
      </div>

      {/* 3. Finalidades */}
      <div style={cardStyle}>
        <h2 style={headingStyle}>
          <FaLock style={{ color: 'var(--color-primary-500)' }} />
          3. Finalidades del Uso de Datos
        </h2>
        <p style={paragraphStyle}>
          Los datos personales recabados serán utilizados estrictamente para las siguientes finalidades necesarias del servicio:
        </p>
        <ol style={listStyle}>
          <li>Gestionar tu cuenta de usuario e inicio de sesión seguro dentro del portal.</li>
          <li>Asignar un médico calificado del IJT a tu perfil para guiarte en tu estado de salud.</li>
          <li>Habilitar el canal de comunicación por chat directo entre tú y tu médico asignado para consultas clínicas y asesoría personalizada.</li>
          <li>Graficar y analizar el historial de tus indicadores de salud para facilitar el automonitoreo de Enfermedades Crónicas No Transmisibles (ECNT).</li>
          <li>Generar notificaciones y alertas médicas automáticas dirigidas a ti, a tu médico y a tu familiar de contacto registrado cuando tus métricas excedan rangos saludables.</li>
          <li>Elaborar estadísticas de salud de forma totalmente **anónima y agregada** con el fin de desarrollar programas de salud pública eficaces para el Estado de Tamaulipas.</li>
        </ol>
      </div>

      {/* 4. Seguridad */}
      <div style={cardStyle}>
        <h2 style={headingStyle}>
          <FaShieldAlt style={{ color: 'var(--color-primary-500)' }} />
          4. Medidas de Seguridad y Almacenamiento
        </h2>
        <p style={paragraphStyle}>
          Tus datos médicos e historial se procesan bajo estrictos certificados de seguridad **HTTPS/SSL** y se almacenan de manera encriptada en bases de datos con accesos restringidos exclusivamente a tu médico y personal autorizado.
        </p>
        <p style={paragraphStyle}>
          <strong>Nota sobre cookies</strong>: Esta plataforma web utiliza cookies y almacenamiento local (`localStorage`) únicamente de tipo técnico e indispensable para mantener activa tu sesión segura (`jcs_token`) y recordar tu idioma de traducción favorito (`googtrans`). No rastreamos tus actividades en otras páginas web ni compartimos perfiles de navegación.
        </p>
      </div>

      {/* 5. Derechos ARCO */}
      <div style={cardStyle}>
        <h2 style={headingStyle}>
          <FaUserShield style={{ color: 'var(--color-primary-500)' }} />
          5. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
        </h2>
        <p style={paragraphStyle}>
          Tienes derecho en todo momento a conocer qué datos tuyos tenemos (Acceso), solicitar correcciones en caso de que estén desactualizados o incompletos (Rectificación), pedir que los eliminemos de nuestros servidores (Cancelación), o negarte al uso de tus datos para fines específicos (Oposición).
        </p>
        <p style={paragraphStyle}>
          Para ejercer cualquiera de tus Derechos ARCO o solicitar la baja total de tu cuenta y datos asociados, puedes ponerte en contacto directamente con nuestra oficina a través del correo oficial:
          <br />
          <a href="mailto:privacidad.ijt@tamaulipas.gob.mx" style={{ color: 'var(--color-primary-500)', fontWeight: '700', textDecoration: 'none' }}>
            privacidad.ijt@tamaulipas.gob.mx
          </a>
        </p>
      </div>
      
    </div>
  )
}
