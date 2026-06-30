import { useState } from 'react'
import { FaChevronDown, FaQuestionCircle } from 'react-icons/fa'

const faqs = [
  {
    category: 'General',
    questions: [
      { q: '¿Qué es Jóvenes con Salud?', a: 'Es una plataforma digital del Instituto de la Juventud de Tamaulipas dirigida a jóvenes de 18 a 29 años. Ofrece información sobre enfermedades crónicas no transmisibles, un catálogo de programas sociales y herramientas de seguimiento de salud personal.' },
      { q: '¿Es gratuito utilizar la plataforma?', a: 'Sí, la plataforma es completamente gratuita. Solo necesitas crear una cuenta para acceder a las funciones de seguimiento de salud personalizado.' },
      { q: '¿Necesito ser de Tamaulipas para usar la plataforma?', a: 'La información sobre enfermedades y artículos está disponible para todos. Sin embargo, algunos programas sociales son específicos del estado de Tamaulipas.' },
    ],
  },
  {
    category: 'Cuenta y Registro',
    questions: [
      { q: '¿Cómo creo mi cuenta?', a: 'Haz clic en "Crear Cuenta" en la página de inicio, completa el formulario con tus datos personales y verifica tu correo electrónico. El proceso toma menos de 2 minutos.' },
      { q: '¿Mis datos están seguros?', a: 'Sí, utilizamos encriptación y protocolos de seguridad estándar de la industria para proteger tu información personal. Cumplimos con las leyes de protección de datos de México.' },
      { q: '¿Qué hago si olvido mi contraseña?', a: 'En la página de inicio de sesión, haz clic en "¿Olvidaste tu contraseña?" e ingresa tu correo electrónico. Recibirás un enlace para restablecerla.' },
    ],
  },
  {
    category: 'Seguimiento de Salud',
    questions: [
      { q: '¿Qué indicadores puedo registrar?', a: 'Puedes registrar presión arterial, peso, glucosa en sangre, medicamentos, síntomas y otras mediciones de salud. Las gráficas te mostrarán tu evolución a lo largo del tiempo.' },
      { q: '¿La plataforma reemplaza a mi médico?', a: 'No. Jóvenes con Salud es una herramienta informativa y de seguimiento. No sustituye la consulta médica profesional. Siempre consulta a tu médico para diagnósticos y tratamientos.' },
    ],
  },
  {
    category: 'Programas Sociales',
    questions: [
      { q: '¿Cómo puedo inscribirme a un programa?', a: 'Cada programa tiene sus propios requisitos y proceso de inscripción. En la página de detalle del programa encontrarás los pasos a seguir y los datos de contacto de la institución responsable.' },
      { q: '¿Los programas cambian con el tiempo?', a: 'Sí, los programas se actualizan periódicamente. Te recomendamos revisar el catálogo regularmente o activar notificaciones para estar al tanto de nuevos programas.' },
    ],
  },
]

function FaqItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div style={{
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-surface-200)',
      background: 'var(--color-surface-100)',
      overflow: 'hidden',
      transition: 'all 0.2s',
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', padding: '1rem 1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
          background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-surface-800)' }}>{question}</span>
        <FaChevronDown style={{
          fontSize: '0.75rem', color: 'var(--color-surface-400)', flexShrink: 0,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s',
        }} />
      </button>
      {isOpen && (
        <div className="animate-fade-in" style={{
          padding: '0 1.25rem 1rem', fontSize: '0.9rem',
          color: 'var(--color-surface-500)', lineHeight: '1.7',
        }}>
          {answer}
        </div>
      )}
    </div>
  )
}

export default function FAQ() {
  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', paddingTop: '1rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.4rem 1rem', borderRadius: '9999px',
          background: 'var(--color-primary-50)', color: 'var(--color-primary-500)',
          fontSize: '0.85rem', fontWeight: '600', marginBottom: '1rem',
        }}>
          <FaQuestionCircle /> FAQ
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-surface-900)', marginBottom: '0.5rem' }}>
          Preguntas Frecuentes
        </h1>
        <p style={{ color: 'var(--color-surface-500)' }}>
          Encuentra respuestas a las dudas más comunes sobre la plataforma.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {faqs.map((section, i) => (
          <div key={i}>
            <h2 style={{
              fontSize: '1rem', fontWeight: '700', color: 'var(--color-primary-600)',
              marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {section.category}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {section.questions.map((faq, j) => (
                <FaqItem key={j} question={faq.q} answer={faq.a} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
