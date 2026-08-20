import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const DEFAULT_MODULES = [
  {
    key: 'diseases',
    name: 'Enfermedades Crónicas (ECNT)',
    description: 'Catálogo informativo, síntomas, prevención y tratamientos validados de enfermedades crónicas.',
    category: 'public',
    isEnabled: true,
    sortOrder: 1,
  },
  {
    key: 'hecho_en_tamaulipas',
    name: 'Hecho en Tamaulipas (Nutracéuticos)',
    description: 'Catálogo de productos nutracéuticos, suplementos y medicina natural con distintivo estatal.',
    category: 'public',
    isEnabled: true,
    sortOrder: 2,
  },
  {
    key: 'news',
    name: 'Noticias y Artículos de Salud',
    description: 'Publicaciones oficiales, artículos de prevención y comunicados del Instituto de la Juventud.',
    category: 'public',
    isEnabled: true,
    sortOrder: 3,
  },
  {
    key: 'programs',
    name: 'Programas Sociales',
    description: 'Programas de apoyo social y becas gubernamentales enfocados en el bienestar juvenil.',
    category: 'public',
    isEnabled: true,
    sortOrder: 4,
  },
  {
    key: 'contact',
    name: 'Contacto y Sedes IJT',
    description: 'Formulario de atención ciudadana y mapa interactivo con sedes oficiales en Tamaulipas.',
    category: 'public',
    isEnabled: true,
    sortOrder: 5,
  },
  {
    key: 'faq',
    name: 'Preguntas Frecuentes (FAQ)',
    description: 'Sección de dudas frecuentes sobre la plataforma, salud y programas sociales.',
    category: 'public',
    isEnabled: true,
    sortOrder: 6,
  },
  {
    key: 'bmi_calculator',
    name: 'Calculadora IMC / Tamizaje',
    description: 'Herramienta de cálculo del Índice de Masa Corporal y recomendaciones preventivas.',
    category: 'health',
    isEnabled: true,
    sortOrder: 7,
  },
  {
    key: 'health_tracking',
    name: 'Seguimiento de Salud (Mi Salud)',
    description: 'Monitoreo de signos vitales, glucosa, presión arterial, medicamentos y sincronización con wearables.',
    category: 'health',
    isEnabled: true,
    sortOrder: 8,
  },
  {
    key: 'virtual_appointments',
    name: 'Citas Médicas Virtuales',
    description: 'Módulo de telemedicina y agendamiento de citas virtuales con profesionales de la salud.',
    category: 'health',
    isEnabled: true,
    sortOrder: 9,
  },
  {
    key: 'universal_medical_history',
    name: 'Historial Médico Universal',
    description: 'Expediente clínico digitalizado, antecedentes familiares y registros médicos.',
    category: 'health',
    isEnabled: true,
    sortOrder: 10,
  },
  {
    key: 'chat_assistant',
    name: 'Asistente Virtual IA (Chatbot)',
    description: 'Burbuja flotante de asistencia inteligente para responder dudas médicas y guiar a los jóvenes.',
    category: 'services',
    isEnabled: true,
    sortOrder: 11,
  },
  {
    key: 'download_apk',
    name: 'Descarga de App Móvil (APK en Home)',
    description: 'Botón de descarga directa del archivo APK para dispositivos Android en la página principal.',
    category: 'services',
    isEnabled: true,
    sortOrder: 12,
  },
]

const ModuleVisibility = sequelize.define('ModuleVisibility', {
  key: {
    type: DataTypes.STRING(100),
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: 'public', // 'public' | 'health' | 'services'
  },
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'module_visibilities',
  timestamps: true,
  underscored: true,
})

// Helper to seed or get default modules
export async function ensureDefaultModules() {
  try {
    for (const mod of DEFAULT_MODULES) {
      const existing = await ModuleVisibility.findByPk(mod.key)
      if (!existing) {
        await ModuleVisibility.create(mod)
      }
    }
  } catch (err) {
    console.warn('Could not ensure default module visibilities:', err.message)
  }
}

export default ModuleVisibility
