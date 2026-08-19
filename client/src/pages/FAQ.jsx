import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FaQuestionCircle,
  FaChevronDown,
  FaSearch,
  FaHeartbeat,
  FaMobileAlt,
  FaUserFriends,
  FaUserShield,
  FaStethoscope,
  FaHeadset,
  FaTimes,
  FaPills
} from 'react-icons/fa'
import { useTheme } from '../context/ThemeContext'

const FAQ_SECTIONS = [
  {
    id: 'general',
    category: 'General y Plataforma',
    icon: FaHeartbeat,
    color: '#e03b60',
    questions: [
      {
        q: '¿Qué es Jóvenes con Salud y cuál es su objetivo?',
        a: 'Jóvenes con Salud es el ecosistema digital de salud integral y preventiva del Instituto de la Juventud de Tamaulipas (IJT). Su objetivo es empoderar a la juventud de Tamaulipas (12 a 29 años) y a sus familias mediante herramientas de monitoreo fisiológico en tiempo real, expedientes clínicos digitales, guías nutricionales y acceso a consultas profesionales para prevenir enfermedades cardiometabólicas como diabetes, hipertensión y obesidad.'
      },
      {
        q: '¿Es completamente gratuito el uso de la plataforma?',
        a: 'Sí, el acceso a Jóvenes con Salud es 100% gratuito. Los módulos de monitoreo de signos vitales, registro de medicamentos, catálogo nutracéutico y expedientes no tienen ningún costo para los ciudadanos.'
      },
      {
        q: '¿La aplicación funciona en mi celular como una App?',
        a: '¡Sí! Jóvenes con Salud está desarrollada como una Aplicación Web Progresiva (PWA). Puedes instalarla directamente desde tu navegador (Chrome, Safari o Edge) en tu teléfono Android o iPhone seleccionando "Instalar aplicación" o "Agregar a pantalla de inicio", permitiéndote acceder incluso con conexión intermitente.'
      },
      {
        q: '¿La plataforma sustituye una consulta médica de urgencia?',
        a: 'No. Jóvenes con Salud es una herramienta de medicina preventiva, monitoreo y seguimiento clínico. En caso de una emergencia médica crítica o dolor agudo severo, debes acudir de inmediato a tu centro de salud u hospital más cercano, o comunicarte al 911.'
      }
    ]
  },
  {
    id: 'wearables',
    category: 'Monitoreo, Wearables y Signos Vitales',
    icon: FaMobileAlt,
    color: '#3b82f6',
    questions: [
      {
        q: '¿Qué signos vitales y métricas de salud puedo registrar?',
        a: 'Puedes registrar y graficar de forma histórica: Presión Arterial (sistólica/diastólica), Glucosa en sangre (en ayuno y postprandial), Ritmo Cardíaco (ppm), Peso corporal e IMC (con clasificación automática), Colesterol y Triglicéridos.'
      },
      {
        q: '¿Cómo conecto mi Smartwatch o pulsera inteligente (Wearables)?',
        a: 'En la sección "Mi Salud" o desde el icono del reloj en el menú, puedes vincular tu dispositivo mediante Google Fit, Apple Health, Garmin, Fitbit o Bluetooth SmartBand. Si no cuentas con un wearable físico, la plataforma te permite ingresar tus mediciones manualmente o activar el simulador de telemetría médica en tiempo real.'
      },
      {
        q: '¿Qué significan las alertas de salud automáticas?',
        a: 'El sistema analiza tus mediciones en base a las Guías Clínicas Oficiales (NOM y OMS). Si detecta valores fuera de los rangos seguros (por ejemplo, glucosa superior a 180 mg/dL o presión arterial superior a 140/90 mmHg), emitirá una notificación preventiva en tu panel para que tomes precauciones y consultes a un médico.'
      },
      {
        q: '¿Cómo funciona el recordatorio de medicamentos y dosis?',
        a: 'En el módulo de "Medicamentos", puedes registrar el nombre del fármaco, dosis prescrita y horarios de toma. La plataforma te enviará recordatorios visuales en la barra superior y notificaciones en tu dispositivo para asegurar la adherencia a tu tratamiento.'
      }
    ]
  },
  {
    id: 'familia',
    category: 'Núcleo Familiar y Efecto Multiplicador',
    icon: FaUserFriends,
    color: '#10b981',
    questions: [
      {
        q: '¿Qué es el módulo de Núcleo Familiar?',
        a: 'Es una función diseñada para que los jóvenes puedan cuidar la salud de sus padres, abuelos o tutores en el hogar. Puedes dar de alta a tus familiares y registrar sus tomas de presión, glucosa y medicamentos desde tu misma cuenta, convirtiéndote en el facilitador de salud de tu hogar (Modelo Multiplicador 2.26x).'
      },
      {
        q: '¿Cuántos familiares puedo registrar en mi perfil?',
        a: 'No hay límite estricto. Puedes registrar a los integrantes de tu hogar para llevar un control preventivo centralizado y presentar sus bitácoras en sus citas médicas presenciales.'
      }
    ]
  },
  {
    id: 'citas',
    category: 'Expediente Clínico y Consultas',
    icon: FaStethoscope,
    color: '#f59e0b',
    questions: [
      {
        q: '¿Qué es el Historial Médico Universal (NOM-024)?',
        a: 'Es tu expediente digital portable donde se concentran tus antecedentes heredofamiliares, alergias, tipo de sangre, historial de diagnósticos, cirugías y vacunas. Está diseñado bajo estándares de interoperabilidad para que puedas descargarlo en PDF o compartirlo con cualquier médico que te atienda.'
      },
      {
        q: '¿Cómo agendo una cita médica virtual?',
        a: 'Dentro de "Mi Salud", selecciona "Citas Virtuales", elige la especialidad o médico disponible, selecciona fecha y hora, y confirma el motivo de consulta. Podrás conectarte por videollamada segura directamente desde la plataforma.'
      },
      {
        q: '¿Cómo descargo mis recetas médicas electrónicas?',
        a: 'Cuando tu médico asignado emite una prescripción en tu consulta, la receta queda guardada en tu sección de recetas con un formato formal e institucional listo para imprimir o presentar en farmacia.'
      }
    ]
  },
  {
    id: 'seguridad',
    category: 'Cuenta, Privacidad y Seguridad de Datos',
    icon: FaUserShield,
    color: '#0284c7',
    questions: [
      {
        q: '¿Mis datos médicos y personales están protegidos?',
        a: 'Totalmente. Cumplimos con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y estándares internacionales de confidencialidad en salud. Tus datos viajan encriptados de extremo a extremo mediante protocolos SSL/TLS y no son compartidos con terceros.'
      },
      {
        q: '¿Cómo cambio o recupero mi contraseña?',
        a: 'Si olvidaste tu contraseña, ve a la pantalla de "Iniciar Sesión" y haz clic en "¿Olvidaste tu contraseña?". Ingresa tu correo electrónico registrado y recibirás un enlace de restablecimiento seguro en tu bandeja de entrada.'
      },
      {
        q: '¿Cómo activo o desactivo el Modo Oscuro?',
        a: 'Puedes cambiar entre modo claro y modo oscuro en cualquier momento haciendo clic en el icono de Sol/Luna ubicado en la barra superior (en computadora) o dentro del menú lateral (en teléfono móvil).'
      }
    ]
  }
]

function FaqItem({ question, answer, isOpen, onToggle, dark }) {
  return (
    <div style={{
      borderRadius: 'var(--radius-xl)',
      border: isOpen
        ? (dark ? '1.5px solid var(--color-primary-500)' : '1.5px solid var(--color-primary-400)')
        : (dark ? '1px solid var(--color-surface-300)' : '1px solid var(--color-surface-200)'),
      background: isOpen
        ? (dark ? 'var(--color-surface-200)' : 'var(--color-surface-50)')
        : (dark ? 'var(--color-surface-100)' : 'white'),
      overflow: 'hidden',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: isOpen ? 'var(--shadow-card)' : 'none',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '1.1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{
          fontSize: '0.95rem',
          fontWeight: '700',
          color: isOpen
            ? (dark ? '#ffffff' : 'var(--color-primary-700)')
            : (dark ? '#e5dfef' : 'var(--color-surface-800)'),
          lineHeight: 1.4,
        }}>
          {question}
        </span>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isOpen
            ? (dark ? 'var(--color-primary-500)' : 'var(--color-primary-100)')
            : (dark ? 'var(--color-surface-300)' : 'var(--color-surface-100)'),
          color: isOpen
            ? (dark ? 'white' : 'var(--color-primary-700)')
            : (dark ? 'var(--color-surface-500)' : 'var(--color-surface-500)'),
          flexShrink: 0,
          transition: 'all 0.2s ease',
        }}>
          <FaChevronDown style={{
            fontSize: '0.72rem',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.25s ease',
          }} />
        </div>
      </button>
      {isOpen && (
        <div className="animate-fade-in" style={{
          padding: '0 1.25rem 1.25rem',
          fontSize: '0.9rem',
          color: dark ? 'var(--color-surface-600)' : 'var(--color-surface-600)',
          lineHeight: '1.7',
          borderTop: dark ? '1px solid rgba(255,255,255,0.05)' : '1px solid var(--color-surface-100)',
          paddingTop: '0.85rem',
        }}>
          {answer}
        </div>
      )}
    </div>
  )
}

export default function FAQ() {
  const { dark } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [openItems, setOpenItems] = useState({})

  // Toggle single item
  const toggleItem = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}_${questionIndex}`
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Filter questions based on search query and category tab
  const filteredSections = useMemo(() => {
    return FAQ_SECTIONS.map((section, sIdx) => {
      // Category filter
      if (selectedCategory !== 'all' && section.id !== selectedCategory) {
        return null
      }

      // Search query filter
      if (!searchQuery.trim()) {
        return { ...section, sIdx }
      }

      const qLow = searchQuery.toLowerCase().trim()
      const matchingQuestions = section.questions.filter(
        item => item.q.toLowerCase().includes(qLow) || item.a.toLowerCase().includes(qLow)
      )

      if (matchingQuestions.length === 0) return null

      return {
        ...section,
        questions: matchingQuestions,
        sIdx
      }
    }).filter(Boolean)
  }, [searchQuery, selectedCategory])

  const totalQuestions = useMemo(() => {
    return filteredSections.reduce((acc, s) => acc + s.questions.length, 0)
  }, [filteredSections])

  return (
    <div style={{ padding: '2rem 1.5rem 4rem', maxWidth: '880px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '2.5rem', paddingTop: '1rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
          padding: '0.35rem 0.95rem', borderRadius: 'var(--radius-full)',
          background: dark ? 'rgba(224, 59, 96, 0.15)' : 'var(--color-primary-50)',
          color: dark ? '#fca5b7' : 'var(--color-primary-600)',
          border: dark ? '1px solid rgba(224, 59, 96, 0.3)' : '1px solid var(--color-primary-200)',
          fontSize: '0.82rem', fontWeight: '700', marginBottom: '1rem',
          letterSpacing: '0.03em', textTransform: 'uppercase'
        }}>
          <FaQuestionCircle /> Centro de Ayuda y Preguntas Frecuentes
        </div>

        <h1 style={{
          fontSize: '2.25rem',
          fontWeight: '800',
          color: dark ? '#ffffff' : 'var(--color-surface-900)',
          marginBottom: '0.6rem',
          lineHeight: 1.2
        }}>
          ¿En qué podemos ayudarte?
        </h1>
        <p style={{
          fontSize: '0.95rem',
          color: dark ? 'var(--color-surface-500)' : 'var(--color-surface-600)',
          maxWidth: '580px',
          margin: '0 auto 1.75rem',
          lineHeight: 1.5
        }}>
          Encuentra respuestas rápidas y claras sobre el monitoreo de signos vitales, uso de wearables, consultas médicas, expediente digital y seguridad en Jóvenes con Salud.
        </p>

        {/* Live Search Bar */}
        <div style={{
          position: 'relative',
          maxWidth: '580px',
          margin: '0 auto',
        }}>
          <FaSearch style={{
            position: 'absolute',
            left: '1.1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: dark ? 'var(--color-surface-500)' : 'var(--color-surface-400)',
            fontSize: '0.95rem'
          }} />
          <input
            type="text"
            placeholder="Buscar por palabra clave (ej. wearables, glucosa, expediente, citas, medicamentos)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.85rem 2.8rem 0.85rem 2.8rem',
              borderRadius: 'var(--radius-xl)',
              border: dark ? '1.5px solid var(--color-surface-300)' : '1.5px solid var(--color-surface-200)',
              background: dark ? 'var(--color-surface-100)' : 'white',
              color: dark ? '#ffffff' : 'var(--color-surface-900)',
              fontSize: '0.92rem',
              outline: 'none',
              boxShadow: 'var(--shadow-card)',
              transition: 'all 0.2s',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: dark ? 'var(--color-surface-500)' : 'var(--color-surface-400)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Limpiar búsqueda"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.65rem',
        marginBottom: '2rem',
        scrollbarWidth: 'none',
      }}>
        <button
          onClick={() => setSelectedCategory('all')}
          style={{
            whiteSpace: 'nowrap',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-full)',
            border: selectedCategory === 'all'
              ? (dark ? '1.5px solid var(--color-primary-500)' : '1.5px solid var(--color-primary-600)')
              : (dark ? '1px solid var(--color-surface-300)' : '1px solid var(--color-surface-200)'),
            background: selectedCategory === 'all'
              ? (dark ? 'var(--color-primary-500)' : 'var(--color-primary-600)')
              : (dark ? 'var(--color-surface-100)' : 'white'),
            color: selectedCategory === 'all'
              ? 'white'
              : (dark ? 'var(--color-surface-500)' : 'var(--color-surface-600)'),
            fontSize: '0.82rem',
            fontWeight: selectedCategory === 'all' ? '700' : '600',
            cursor: 'pointer',
            boxShadow: selectedCategory === 'all' ? 'var(--shadow-card)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          🌟 Todas las categorías
        </button>

        {FAQ_SECTIONS.map(cat => {
          const Icon = cat.icon
          const isSelected = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 0.95rem',
                borderRadius: 'var(--radius-full)',
                border: isSelected
                  ? (dark ? '1.5px solid var(--color-primary-500)' : '1.5px solid var(--color-primary-600)')
                  : (dark ? '1px solid var(--color-surface-300)' : '1px solid var(--color-surface-200)'),
                background: isSelected
                  ? (dark ? 'var(--color-primary-500)' : 'var(--color-primary-600)')
                  : (dark ? 'var(--color-surface-100)' : 'white'),
                color: isSelected
                  ? 'white'
                  : (dark ? 'var(--color-surface-500)' : 'var(--color-surface-600)'),
                fontSize: '0.82rem',
                fontWeight: isSelected ? '700' : '600',
                cursor: 'pointer',
                boxShadow: isSelected ? 'var(--shadow-card)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={12} />
              <span>{cat.category}</span>
            </button>
          )
        })}
      </div>

      {/* FAQ Accordion List */}
      {filteredSections.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1.5rem',
          background: dark ? 'var(--color-surface-100)' : 'white',
          borderRadius: 'var(--radius-2xl)',
          border: dark ? '1px solid var(--color-surface-300)' : '1px solid var(--color-surface-200)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: dark ? '#ffffff' : 'var(--color-surface-900)', margin: '0 0 0.5rem' }}>
            No encontramos resultados para tu búsqueda
          </h3>
          <p style={{ fontSize: '0.88rem', color: dark ? 'var(--color-surface-500)' : 'var(--color-surface-600)', margin: '0 0 1.25rem' }}>
            Intenta con términos más generales o explora las categorías disponibles.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: 'var(--radius-lg)',
              background: dark ? 'var(--color-surface-200)' : 'var(--color-primary-50)',
              color: dark ? '#fca5b7' : 'var(--color-primary-600)',
              border: dark ? '1px solid var(--color-surface-300)' : '1px solid var(--color-primary-200)',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Restablecer búsqueda
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
          {filteredSections.map((section) => {
            const Icon = section.icon
            const originalSectionIdx = FAQ_SECTIONS.findIndex(s => s.id === section.id)
            return (
              <div key={section.id} className="animate-fade-in">
                {/* Category Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.9rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: dark ? 'var(--color-surface-200)' : 'var(--color-primary-50)',
                    color: dark ? '#fca5b7' : 'var(--color-primary-600)',
                    border: dark ? '1px solid var(--color-surface-300)' : '1px solid var(--color-primary-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.95rem'
                  }}>
                    <Icon />
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '1.05rem',
                      fontWeight: '800',
                      color: dark ? '#ffffff' : 'var(--color-surface-900)',
                      margin: 0,
                      lineHeight: 1.2
                    }}>
                      {section.category}
                    </h2>
                    <span style={{ fontSize: '0.74rem', color: dark ? 'var(--color-surface-500)' : 'var(--color-surface-500)' }}>
                      {section.questions.length} {section.questions.length === 1 ? 'pregunta' : 'preguntas'}
                    </span>
                  </div>
                </div>

                {/* Question Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {section.questions.map((faq, j) => {
                    const originalQIdx = FAQ_SECTIONS[originalSectionIdx].questions.findIndex(q => q.q === faq.q)
                    const isItemOpen = !!openItems[`${originalSectionIdx}_${originalQIdx}`]
                    return (
                      <FaqItem
                        key={j}
                        question={faq.q}
                        answer={faq.a}
                        isOpen={isItemOpen}
                        onToggle={() => toggleItem(originalSectionIdx, originalQIdx)}
                        dark={dark}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Need more help CTA Banner */}
      <div className="animate-fade-in" style={{
        marginTop: '3.5rem',
        background: dark
          ? 'linear-gradient(135deg, #18080f 0%, #2e0813 60%, #1e1308 100%)'
          : 'linear-gradient(135deg, #750f2c 0%, #871233 60%, #9a7a4e 100%)',
        borderRadius: 'var(--radius-2xl)',
        padding: '2rem',
        color: 'white',
        boxShadow: dark ? '0 10px 30px rgba(0,0,0,0.6)' : 'var(--shadow-elevated)',
        border: dark ? '1px solid rgba(224, 59, 96, 0.35)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ maxWidth: '500px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)',
            padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)',
            fontSize: '0.76rem', fontWeight: '700', textTransform: 'uppercase',
            marginBottom: '0.6rem'
          }}>
            <FaHeadset /> Soporte Continuo
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '0 0 0.35rem', color: 'white' }}>
            ¿Tienes alguna otra duda o consulta?
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.5 }}>
            Nuestro equipo del Instituto de la Juventud de Tamaulipas y profesionales de salud están disponibles para orientarte.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            to="/contacto"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'white',
              color: 'var(--color-primary-800)',
              padding: '0.7rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '0.85rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'transform 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <FaHeadset /> Contáctanos
          </Link>

          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '0.7rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '0.85rem',
              transition: 'transform 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <FaHeartbeat /> Ir a Mi Salud
          </Link>
        </div>
      </div>
    </div>
  )
}
