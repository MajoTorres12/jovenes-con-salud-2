import { useTheme } from '../context/ThemeContext'
import {
  FaShieldAlt,
  FaCalendarAlt,
  FaLock,
  FaUserShield,
  FaClipboardList,
  FaHeartbeat,
  FaMobileAlt,
  FaFileMedical,
  FaDatabase
} from 'react-icons/fa'

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
    <div style={{ padding: '3rem 1.5rem', maxWidth: '880px', margin: '0 auto', background: 'var(--color-surface-50)' }}>
      
      {/* Header section */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.4rem 1rem', borderRadius: '9999px',
          background: 'var(--color-primary-50)', color: 'var(--color-primary-500)',
          fontSize: '0.85rem', fontWeight: '600', marginBottom: '1rem',
        }}>
          <FaShieldAlt /> Protección Integral de Datos de Salud
        </div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.35rem)', fontWeight: '800', color: 'var(--color-surface-900)', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          Aviso de Privacidad Integral
        </h1>
        <p style={{ color: 'var(--color-surface-500)', fontSize: '0.95rem', maxWidth: '620px', margin: '0 auto', lineHeight: '1.6' }}>
          Conoce de qué manera el Instituto de la Juventud de Tamaulipas recopila, salvaguarda, procesa y protege la información médica y personal de los usuarios en la plataforma <strong>Jóvenes con Salud</strong>.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--color-surface-400)', fontWeight: '600', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-surface-200)', paddingBottom: '0.75rem' }}>
        <FaCalendarAlt /> Última actualización: 17 de Agosto de 2026
      </div>

      {/* 1. Responsable */}
      <div style={cardStyle}>
        <h2 style={headingStyle}>
          <FaUserShield style={{ color: 'var(--color-primary-500)' }} />
          1. Responsable del Tratamiento de los Datos Personales
        </h2>
        <p style={paragraphStyle}>
          El <strong>Instituto de la Juventud de Tamaulipas (IJT)</strong>, órgano público desconcentrado del Gobierno del Estado de Tamaulipas, con domicilio oficial en Ciudad Victoria, Tamaulipas, es el sujeto obligado y responsable del tratamiento, resguardo y confidencialidad de los datos personales y datos personales sensibles recabados a través de la plataforma web y aplicación móvil <strong>Jóvenes con Salud</strong>.
        </p>
        <p style={paragraphStyle}>
          El tratamiento de la información se apega estrictamente a lo establecido en la <em>Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados (LGPDPPSO)</em>, la legislación estatal aplicable y las directrices de la <em>Norma Oficial Mexicana NOM-004-SSA3-2012</em> relativa al expediente clínico.
        </p>
      </div>

      {/* 2. Datos Personales y Sensibles Recabados */}
      <div style={cardStyle}>
        <h2 style={headingStyle}>
          <FaClipboardList style={{ color: 'var(--color-primary-500)' }} />
          2. Datos Personales y Sensibles que Recabamos
        </h2>
        <p style={paragraphStyle}>
          Para brindarte acceso a las herramientas de monitoreo clínico, telemedicina y programas de apoyo, recabamos las siguientes categorías de datos:
        </p>
        <ul style={listStyle}>
          <li><strong>Datos de Identificación y Contacto</strong>: Nombre completo, correo electrónico, fecha de nacimiento (para validar el rango prioritario de 18 a 29 años), rol de usuario y fotografía de perfil (avatar voluntario).</li>
          <li><strong>Datos de Salud y Expediente Clínico (Datos Sensibles)</strong>:
            <ul style={{ marginTop: '0.25rem', marginBottom: '0.25rem' }}>
              <li>Mediciones antropométricas: Peso, estatura e Índice de Masa Corporal (IMC).</li>
              <li>Signos vitales y biomarcadores: Glucosa capilar, frecuencia cardíaca, presión arterial (sistólica/diastólica), colesterol total y triglicéridos.</li>
              <li>Sintomatología clínica, historial de padecimientos crónicos y diagnósticos asociados.</li>
            </ul>
          </li>
          <li><strong>Dispositivos Inteligentes y Wearables (Bluetooth BLE)</strong>: Frecuencia cardíaca continua, pasos y oxigenación transmitidos voluntariamente mediante la sincronización con relojes inteligentes, pulseras biométricas o glucómetros compatibles.</li>
          <li><strong>Tratamientos y Medicación</strong>: Fármacos prescritos, suplementos nutracéuticos, dosis, horarios agendados y registro de adherencia al tratamiento.</li>
          <li><strong>Consultas Médicas Virtuales y Recetas</strong>: Solicitudes de citas de telemedicina, notas de evolución médica, recetas electrónicas emitidas por médicos acreditados del IJT y mensajes dentro del chat médico seguro.</li>
          <li><strong>Contactos de Emergencia y Red Familiar</strong>: Nombres, parentesco y vías de comunicación de tutores o familiares autorizados para recibir notificaciones ante lecturas biométricas críticas.</li>
        </ul>
      </div>

      {/* 3. Finalidades */}
      <div style={cardStyle}>
        <h2 style={headingStyle}>
          <FaHeartbeat style={{ color: 'var(--color-primary-500)' }} />
          3. Finalidades del Tratamiento de los Datos
        </h2>
        <p style={paragraphStyle}>
          Tus datos serán tratados para las siguientes finalidades:
        </p>
        <p style={{ ...paragraphStyle, fontWeight: '700', marginBottom: '0.5rem', color: 'var(--color-surface-800)' }}>
          A) Finalidades Primarias (necesarias para el servicio):
        </p>
        <ol style={listStyle}>
          <li>Creación, autenticación y administración de tu cuenta de usuario mediante tokens seguros.</li>
          <li>Asignación de un profesional médico del IJT para seguimiento clínico continuo y personalizado.</li>
          <li>Habilitar el canal de telemedicina: videoconsultas, chat médico confidencial y emisión de recetas digitales.</li>
          <li>Generar tu <strong>Expediente Médico Universal</strong> y gráficos evolutivos para el control de Enfermedades Crónicas No Transmisibles (ECNT).</li>
          <li>Detección temprana y emisión de <strong>alertas de salud automáticas</strong> cuando tus lecturas biométricas superen los límites de seguridad clínica.</li>
          <li>Envío de recordatorios programados de tomas de medicamentos y citas médicas mediante notificaciones locales y push.</li>
        </ol>
        <p style={{ ...paragraphStyle, fontWeight: '700', marginBottom: '0.5rem', color: 'var(--color-surface-800)' }}>
          B) Finalidades Secundarias (no indispensables, con fines estadísticos):
        </p>
        <ul style={listStyle}>
          <li>Generación de estadísticas e indicadores epidemiológicos <strong>100% anonimizados y disociados</strong> que orienten el diseño de políticas públicas de salud juvenil en el Estado de Tamaulipas.</li>
        </ul>
      </div>

      {/* 4. Sincronización Offline y App Móvil */}
      <div style={cardStyle}>
        <h2 style={headingStyle}>
          <FaMobileAlt style={{ color: 'var(--color-primary-500)' }} />
          4. Operación Offline, Almacenamiento Local y Notificaciones
        </h2>
        <p style={paragraphStyle}>
          La plataforma cuenta con arquitectura <em>Offline-First</em> (PWA y App Nativa Android):
        </p>
        <ul style={listStyle}>
          <li><strong>Almacenamiento Local Seguro (`IndexedDB` y `localStorage`)</strong>: Tus registros clínicos y recordatorios pueden almacenarse cifrados localmente en tu dispositivo para que puedas consultarlos y registrar tomas sin conexión a internet, sincronizándose con el servidor central al restablecer la red.</li>
          <li><strong>Notificaciones Push</strong>: Empleamos servicios nativos y Firebase Cloud Messaging para recordatorios de salud y avisos de telemedicina. Puedes revocar el permiso de notificaciones en cualquier momento desde los ajustes de tu sistema operativo o navegador.</li>
        </ul>
      </div>

      {/* 5. Confidencialidad y Transferencias */}
      <div style={cardStyle}>
        <h2 style={headingStyle}>
          <FaFileMedical style={{ color: 'var(--color-primary-500)' }} />
          5. Transferencias y Confidencialidad Médica
        </h2>
        <p style={paragraphStyle}>
          El IJT no vende, no comercializa ni transfiere tus datos personales a terceros, empresas privadas o anunciantes. Tus datos de salud únicamente son accesibles por:
        </p>
        <ul style={listStyle}>
          <li>Tú, como titular de la cuenta.</li>
          <li>El personal médico y especialistas asignados expresamente a tu atención bajo secreto profesional.</li>
          <li>Tus familiares o contactos de confianza registrados, únicamente cuando se active una alerta de gravedad médica.</li>
          <li>Autoridades sanitarias o judiciales competentes, exclusivamente bajo mandato legal debidamente fundado y motivado.</li>
        </ul>
      </div>

      {/* 6. Seguridad */}
      <div style={cardStyle}>
        <h2 style={headingStyle}>
          <FaLock style={{ color: 'var(--color-primary-500)' }} />
          6. Medidas de Seguridad y Cifrado
        </h2>
        <p style={paragraphStyle}>
          Implementamos rigurosas salvaguardas técnicas, administrativas y físicas para evitar el daño, pérdida, alteración, destrucción o uso no autorizado de tu información:
        </p>
        <ul style={listStyle}>
          <li>Transmisión de datos mediante protocolos seguros de capa de transporte <strong>TLS/HTTPS</strong>.</li>
          <li>Cifrado irreversible de contraseñas (algoritmo <code>bcrypt</code>) y autenticación tokenizada basada en estándares de la industria (JWT).</li>
          <li>Infraestructura en la nube con cortafuegos (firewalls), cabeceras de protección (Helmet) y respaldos periódicos redundantes.</li>
        </ul>
      </div>

      {/* 7. Derechos ARCO */}
      <div style={cardStyle}>
        <h2 style={headingStyle}>
          <FaDatabase style={{ color: 'var(--color-primary-500)' }} />
          7. Ejercicio de Derechos ARCO y Revocación del Consentimiento
        </h2>
        <p style={paragraphStyle}>
          En cualquier momento tienes derecho a solicitar el <strong>Acceso</strong> a tus datos personales, la <strong>Rectificación</strong> de datos inexactos o incompletos, la <strong>Cancelación</strong> (eliminación) de tu expediente de nuestros servidores, o la <strong>Oposición</strong> al tratamiento de los mismos para fines específicos (Derechos ARCO).
        </p>
        <p style={paragraphStyle}>
          Para ejercer tus Derechos ARCO o solicitar la baja definitiva de tu cuenta y registros clínicos, puedes dirigir tu solicitud a la Unidad de Transparencia y Privacidad del IJT:
        </p>
        <div style={{
          background: dark ? 'rgba(135, 18, 51, 0.15)' : 'var(--color-primary-50)',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--color-primary-200)',
          marginTop: '0.5rem'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-surface-800)' }}>
            📧 <strong>Correo oficial de Privacidad:</strong>{' '}
            <a href="mailto:privacidad.ijt@tamaulipas.gob.mx" style={{ color: 'var(--color-primary-500)', fontWeight: '700', textDecoration: 'none' }}>
              privacidad.ijt@tamaulipas.gob.mx
            </a>
            <br />
            🏛️ <strong>Entidad:</strong> Instituto de la Juventud de Tamaulipas (IJT)
            <br />
            📍 <strong>Ubicación:</strong> Ciudad Victoria, Tamaulipas, México.
          </p>
        </div>
      </div>

      {/* 8. Modificaciones */}
      <div style={cardStyle}>
        <h2 style={headingStyle}>
          <FaShieldAlt style={{ color: 'var(--color-primary-500)' }} />
          8. Cambios y Actualizaciones al Aviso de Privacidad
        </h2>
        <p style={{ ...paragraphStyle, margin: 0 }}>
          El presente Aviso de Privacidad puede sufrir modificaciones o actualizaciones derivadas de reformas legislativas, criterios de salud pública o la integración de nuevas tecnologías en la plataforma. Cualquier cambio sustancial será notificado a través de la propia aplicación o en nuestro portal web institucional.
        </p>
      </div>

    </div>
  )
}
