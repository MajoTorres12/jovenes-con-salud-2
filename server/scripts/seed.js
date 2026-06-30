import { sequelize } from '../src/config/database.js'
import bcrypt from 'bcryptjs'
import '../src/models/User.js'
import '../src/models/Disease.js'
import '../src/models/Article.js'
import '../src/models/NewsPost.js'

import User from '../src/models/User.js'
import Disease from '../src/models/Disease.js'
import Article from '../src/models/Article.js'
import NewsPost from '../src/models/NewsPost.js'
import FamilyMember from '../src/models/FamilyMember.js'
import HealthRecord from '../src/models/HealthRecord.js'

async function seed() {
  await sequelize.authenticate()
  console.log('✅ Conectado a la base de datos')

  await sequelize.sync({ force: true })
  console.log('✅ Tablas sincronizadas')

  // ── Admin user ──────────────────────────────────
  const existing = await User.findOne({ where: { email: 'admin@ijt.gob.mx' } })
  if (!existing) {
    await User.create({
      name: 'Administrador IJT',
      email: 'admin@ijt.gob.mx',
      password: await bcrypt.hash('Admin@JCS2026!', 12),
      birthDate: '1990-01-01',
      role: 'admin',
      municipality: 'Ciudad Victoria',
    })
    console.log('✅ Usuario administrador creado — admin@ijt.gob.mx / Admin@JCS2026!')
  } else {
    console.log('ℹ️  El usuario administrador ya existe')
  }

  // ── Diseases ────────────────────────────────────
  const diseases = [
    {
      slug: 'cancer',
      name: 'Cáncer',
      category: 'cancer',
      description: 'El cáncer es una enfermedad en la que células anormales se dividen sin control y pueden invadir tejidos cercanos. Existen más de 100 tipos diferentes de cáncer. En jóvenes, los más frecuentes son el cáncer de tiroides, linfoma de Hodgkin, leucemia y melanoma. La detección temprana es clave para el tratamiento exitoso.',
      symptoms: [
        'Cambio en la función intestinal o vesical',
        'Llaga que no cicatriza',
        'Sangrado inusual',
        'Engrosamiento o bultoma en cualquier parte del cuerpo',
        'Indigestión persistente',
        'Tos persistente o ronquera',
        'Pérdida de peso inexplicable',
        'Fatiga extrema sin causa aparente'
      ],
      riskFactors: [
        'Tabaquismo',
        'Exposición a radiación UV sin protección',
        'Consumo excesivo de alcohol',
        'Obesidad',
        'Infecciones virales (VPH, Hepatitis B/C)',
        'Antecedentes familiares',
        'Exposición a carcinógenos'
      ],
      treatment: 'Depende del tipo y estadío del cáncer. Los principales tratamientos son: cirugía, quimioterapia, radioterapia, inmunoterapia y terapia dirigida. El seguimiento médico continuo y el apoyo psicológico son esenciales durante el tratamiento.',
      externalResources: [
        { label: 'NCI - Información sobre el cáncer (en español)', url: 'https://www.cancer.gov/espanol' },
        { label: 'Secretaría de Salud - Cáncer', url: 'https://www.gob.mx/salud/temas/cancer' }
      ],
      youtubeVideos: [
        { title: 'La Enfermedad del Cáncer', youtubeId: 'sTbd8p9H2gM' },
        { title: 'peores personajes de teresa', youtubeId: 'T8-S5QvFf0g' }
      ],
      validatedBy: 'Secretaría de Salud de Tamaulipas',
      iconEmoji: '🎗️',
      colorHex: '#db2777', // pink
    },
    {
      slug: 'diabetes',
      name: 'Diabetes Mellitus',
      category: 'diabetes',
      description: 'La diabetes mellitus es una enfermedad crónica que se caracteriza por niveles elevados de glucosa en sangre. Existen principalmente dos tipos: Tipo 1 (cuando el páncreas no produce insulina) y Tipo 2 (cuando el organismo no utiliza eficazmente la insulina que produce).',
      symptoms: [
        'Sed excesiva (polidipsia)',
        'Orinar con mucha frecuencia (poliuria)',
        'Fatiga extrema',
        'Visión borrosa',
        'Heridas que cicatrizan lentamente',
        'Pérdida de peso inexplicable'
      ],
      riskFactors: [
        'Sobrepeso u obesidad',
        'Sedentarismo',
        'Alimentación alta en azúcares refinados',
        'Antecedentes familiares de diabetes',
        'Presión arterial elevada'
      ],
      treatment: 'El tratamiento incluye cambios en el estilo de vida (dieta balanceada y ejercicio regular), medicamentos orales (como la metformina) e insulina si es necesario. El monitoreo frecuente de glucosa es fundamental.',
      externalResources: [
        { label: 'IMSS - Diabetes', url: 'https://www.imss.gob.mx/salud-en-linea/diabetes' },
        { label: 'Secretaría de Salud México - Diabetes', url: 'https://www.gob.mx/salud/documentos/diabetes' }
      ],
      youtubeVideos: [
        { title: '¿Qué es la Diabetes?', youtubeId: 'X94gG1UqTQA' }
      ],
      validatedBy: 'Secretaría de Salud de Tamaulipas',
      iconEmoji: '🩸',
      colorHex: '#ea580c', // orange
    },
    {
      slug: 'hipertension',
      name: 'Hipertensión Arterial',
      category: 'hipertension',
      description: 'La hipertensión arterial es una condición crónica en la que la presión de la sangre en las arterias es persistentemente elevada (≥130/80 mmHg). Se le conoce como "el asesino silencioso" porque generalmente no presenta síntomas tempranos.',
      symptoms: [
        'Dolor de cabeza fuerte (cefalea)',
        'Visión borrosa o doble',
        'Zumbido en los oídos (tinnitus)',
        'Sangrado nasal frecuente',
        'Dificultad para respirar (disnea)'
      ],
      riskFactors: [
        'Consumo excesivo de sal',
        'Sedentarismo',
        'Estrés crónico',
        'Tabaquismo',
        'Obesidad',
        'Antecedentes familiares'
      ],
      treatment: 'El tratamiento incluye una dieta baja en sodio (como la dieta DASH), ejercicio cardiovascular regular, control del peso y medicamentos antihipertensivos bajo prescripción médica.',
      externalResources: [
        { label: 'IMSS - Hipertensión', url: 'https://www.imss.gob.mx/salud-en-linea/hipertension' }
      ],
      youtubeVideos: [
        { title: '¿Qué es la Hipertensión Arterial?', youtubeId: 'aW_SaeNUXh0' }
      ],
      validatedBy: 'Secretaría de Salud de Tamaulipas',
      iconEmoji: '💓',
      colorHex: '#3b82f6', // blue
    },
    {
      slug: 'enfermedades-cardiovasculares',
      name: 'Enfermedades Cardiovasculares',
      category: 'cardiovascular',
      description: 'Las enfermedades cardiovasculares son un grupo de trastornos del corazón y los vasos sanguíneos. Incluyen la cardiopatía coronaria, enfermedades cerebrovasculares e insuficiencia cardíaca.',
      symptoms: [
        'Dolor o opresión en el pecho',
        'Dificultad para respirar',
        'Palpitaciones rápidas',
        'Fatiga constante sin causa aparente',
        'Mareos o desmayos'
      ],
      riskFactors: [
        'Hipertensión arterial sin control',
        'Niveles elevados de colesterol LDL',
        'Tabaquismo activo o pasivo',
        'Diabetes u obesidad',
        'Dieta rica en grasas saturadas'
      ],
      treatment: 'Requiere valoración cardiológica. El tratamiento varía desde medicamentos (antihipertensivos, estatinas) hasta procedimientos médicos/quirúrgicos y cambios profundos en el estilo de vida.',
      externalResources: [
        { label: 'OPS/OMS - Enfermedades Cardiovasculares', url: 'https://www.paho.org/es/temas/enfermedades-cardiovasculares' }
      ],
      youtubeVideos: [
        { title: 'Salud Cardiovascular en Jóvenes', youtubeId: '2bXqXG63vX0' }
      ],
      validatedBy: 'Secretaría de Salud de Tamaulipas',
      iconEmoji: '❤️',
      colorHex: '#dc2626', // red
    },
    {
      slug: 'enfermedades-respiratorias',
      name: 'Enfermedades Respiratorias Crónicas',
      category: 'respiratoria',
      description: 'Enfermedades crónicas de las vías respiratorias y del tejido pulmonar. Las más comunes son el asma bronquial y la enfermedad pulmonar obstructiva crónica (EPOC).',
      symptoms: [
        'Tos seca o productiva persistente',
        'Silbidos al respirar (sibilancias)',
        'Dificultad respiratoria al realizar esfuerzo',
        'Sensación de opresión en el pecho'
      ],
      riskFactors: [
        'Exposición al humo de tabaco (vapeo o cigarros)',
        'Contaminación del aire en interiores o exteriores',
        'Polvos o productos químicos laborales',
        'Antecedentes familiares de asma'
      ],
      treatment: 'Uso de inhaladores (broncodilatadores y corticosteroides), evitar alérgenos o desencadenantes, y programas de rehabilitación pulmonar.',
      externalResources: [
        { label: 'OMS - Enfermedades Respiratorias Crónicas', url: 'https://www.who.int/es/news-room/fact-sheets/detail/chronic-obstructive-pulmonary-disease-(copd)' }
      ],
      youtubeVideos: [
        { title: 'Prevención de Enfermedades Respiratorias', youtubeId: 'R97c8j-8q9E' }
      ],
      validatedBy: 'Secretaría de Salud de Tamaulipas',
      iconEmoji: '🫁',
      colorHex: '#10b981', // green
    }
  ]

  for (const d of diseases) {
    const exists = await Disease.findOne({ where: { slug: d.slug } })
    if (!exists) {
      await Disease.create(d)
      console.log(`✅ Enfermedad creada: ${d.name}`)
    } else {
      await exists.update(d)
      console.log(`ℹ️  Enfermedad actualizada: ${d.name}`)
    }
  }

  // ── Related Articles ─────────────────────────────
  const cancerObj = await Disease.findOne({ where: { slug: 'cancer' } })
  const diabetesObj = await Disease.findOne({ where: { slug: 'diabetes' } })

  const articles = [
    {
      diseaseId: cancerObj?.id,
      title: 'Prevención y detección temprana del cáncer en jóvenes',
      slug: 'prevencion-deteccion-temprana-cancer',
      excerpt: 'Conoce los principales métodos de prevención y la importancia de la autoexploración para detectar el cáncer a tiempo.',
      content: 'El diagnóstico temprano del cáncer salva vidas. En jóvenes de 12 a 29 años, es importante estar alerta a cambios inusuales en el cuerpo, bultos, lunares que cambian de forma y fatiga extrema.',
      category: 'prevención',
      tags: ['cáncer', 'prevención', 'detección'],
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      diseaseId: diabetesObj?.id,
      title: 'Alimentación saludable para jóvenes con diabetes',
      slug: 'alimentacion-saludable-diabetes',
      excerpt: 'Conoce qué alimentos te ayudan a controlar tu glucosa y cuáles debes moderar para vivir mejor con diabetes.',
      content: 'Una dieta equilibrada es fundamental. Prioriza verduras, proteínas magras y granos integrales, y evita azúcares refinados y bebidas gaseosas.',
      category: 'nutrición',
      tags: ['diabetes', 'nutrición', 'salud'],
      isPublished: true,
      publishedAt: new Date(),
    }
  ]

  for (const a of articles) {
    const exists = await Article.findOne({ where: { slug: a.slug } })
    if (!exists) {
      await Article.create(a)
      console.log(`✅ Artículo creado: ${a.title}`)
    } else {
      await exists.update(a)
      console.log(`ℹ️  Artículo actualizado: ${a.title}`)
    }
  }

  // ── News Posts ───────────────────────────────────
  const newsPosts = [
    {
      title: 'Realiza INJUVE la iniciativa de emprendimiento juvenil "Mercado Joven"',
      slug: 'injuve-iniciativa',
      excerpt: 'Con la participación de 75 jóvenes emprendedores y emprendedoras que suman a la transformación social y económica que vive actualmente nuestro estado',
      content: 'El Instituto de la Juventud de Tamaulipas (INJUVE) llevó a cabo con éxito la iniciativa de emprendimiento juvenil "Mercado Joven". Este espacio tiene como objetivo principal brindar a las y los jóvenes emprendedores de Tamaulipas la oportunidad de exponer y comercializar sus productos, impulsando la economía local y fomentando el autoempleo de calidad en el estado.\n\nDurante el evento, más de 75 jóvenes provenientes de diversos municipios presentaron proyectos innovadores que abarcan desde artesanías y alimentos saludables hasta soluciones tecnológicas y servicios creativos. La Directora del Instituto destacó que este tipo de plataformas no solo incentivan el espíritu emprendedor, sino que también fortalecen la cohesión social y el desarrollo económico regional de nuestra juventud.',
      coverImage: 'images/injuve_iniciativa.jpg',
      author: 'Instituto de la Juventud de Tamaulipas',
      isPinned: true,
      isPublished: true,
      publishedAt: new Date('2026-04-27T10:00:00.000Z'),
    },
    {
      title: 'INJUVE realiza "Encuentro de Juventudes Increíbles" con el voluntariado "Misión Tamaulipas"',
      slug: 'injuve-encuentro',
      excerpt: 'Con la finalidad de compartir experiencias enfocadas a la reflexión y promoción del voluntariado juvenil',
      content: 'El voluntariado juvenil se ha consolidado como una de las herramientas más poderosas para la transformación comunitaria en Tamaulipas. El INJUVE organizó el "Encuentro de Juventudes Increíbles", reuniendo a más de 120 participantes activos del programa "Misión Tamaulipas".\n\nEl encuentro sirvió como plataforma para el intercambio de mejores prácticas de impacto social, reforestación, apoyo a sectores vulnerables y talleres de desarrollo humano. "A través de este voluntariado, los jóvenes tamaulipecos demuestran su gran compromiso social y su capacidad para liderar cambios reales en sus comunidades", apuntó la coordinación general del programa.',
      coverImage: 'images/injuve_encuentro.jpg',
      author: 'Instituto de la Juventud de Tamaulipas',
      isPinned: true,
      isPublished: true,
      publishedAt: new Date('2026-04-27T11:00:00.000Z'),
    },
    {
      title: 'Contribuye INJUVE en la construcción de entornos de paz',
      slug: 'injuve-paz',
      excerpt: 'Creando comunidades libres de violencia y adicciones',
      content: 'A fin de promover ambientes escolares seguros e inclusivos, el INJUVE ha puesto en marcha el programa de construcción de entornos de paz en diversas escuelas secundarias y preparatorias del estado.\n\nEsta iniciativa contempla pláticas informativas sobre prevención de adicciones, resolución pacífica de conflictos, y talleres artísticos y deportivos orientados a canalizar positivamente la energía de los estudiantes. Directores y padres de familia agradecieron la intervención y destacaron los cambios positivos observados en el comportamiento y convivencia escolar.',
      coverImage: 'images/injuve_paz.jpg',
      author: 'Instituto de la Juventud de Tamaulipas',
      isPinned: true,
      isPublished: true,
      publishedAt: new Date('2026-04-27T12:00:00.000Z'),
    },
    {
      title: 'Promueven talleres de alimentación saludable y prevención de la obesidad',
      slug: 'injuve-salud-nutricional',
      excerpt: 'Especialistas en nutrición capacitan a jóvenes estudiantes en la elaboración de platillos saludables y balanceados.',
      content: 'En coordinación con la Secretaría de Salud del Estado, el INJUVE inició una jornada de talleres prácticos de alimentación saludable dirigidos a la población juvenil. La meta es combatir los altos índices de sobrepeso y obesidad en el estado, así como concientizar sobre el consumo responsable de azúcares y grasas.\n\nLos jóvenes participantes aprendieron a leer etiquetas nutrimentales, diseñar menús equilibrados a bajo costo y conocieron alternativas de suplementación natural seguras aprobadas por organismos de salud.',
      coverImage: 'images/injuve_nutri.jpg',
      author: 'Instituto de la Juventud de Tamaulipas',
      isPinned: false,
      isPublished: true,
      publishedAt: new Date('2026-04-27T13:00:00.000Z'),
    },
    {
      title: 'Inauguran centro de atención psicológica gratuita para jóvenes',
      slug: 'injuve-salud-mental',
      excerpt: 'Brindará consultas presenciales y en línea sobre manejo del estrés, ansiedad y prevención de la depresión.',
      content: 'Conscientes de la importancia de la salud mental en el desarrollo integral de la juventud, el INJUVE en alianza con el DIF estatal inauguró el primer Centro de Atención Psicológica para Jóvenes.\n\nEste espacio cuenta con profesionales capacitados para atender de manera confidencial y gratuita problemáticas de ansiedad, depresión, manejo del estrés y orientación vocacional. La atención estará disponible de manera híbrida para llegar a los rincones más alejados del estado.',
      coverImage: 'images/injuve_salud.jpg',
      author: 'Instituto de la Juventud de Tamaulipas',
      isPinned: false,
      isPublished: true,
      publishedAt: new Date('2026-04-27T14:00:00.000Z'),
    },
    {
      title: 'Torneo Estatal de Fútbol Rápido promueve la activación física',
      slug: 'injuve-deporte-comunitario',
      excerpt: 'Más de 50 equipos de diferentes municipios compiten en la fase final del torneo juvenil "Actívate".',
      content: 'Con gran entusiasmo dio inicio la fase final del Torneo Estatal de Fútbol Rápido Juvenil organizado por el INJUVE en Ciudad Victoria. Esta competencia busca incentivar la práctica deportiva como alternativa de sano esparcimiento y prevención social del delito.\n\nLa premiación final incluye becas de estudio y equipamiento deportivo para las escuelas de los equipos ganadores, impulsando el talento local.',
      coverImage: 'images/injuve_salud.jpg',
      author: 'Instituto de la Juventud de Tamaulipas',
      isPinned: false,
      isPublished: true,
      publishedAt: new Date('2026-04-26T10:00:00.000Z'),
    },
    {
      title: 'Campaña "Decídete por la Salud" llega a miles de jóvenes',
      slug: 'injuve-prevencion-adicciones',
      excerpt: 'Mediante testimonios y conferencias interactivas, se advierte sobre las consecuencias de las adicciones.',
      content: 'La campaña estatal "Decídete por la Salud" continúa su recorrido por los municipios de Tamaulipas, llevando información científica sobre el impacto de sustancias nocivas en el organismo de los jóvenes.\n\nLas actividades incluyen dinámicas de realidad virtual que simulan los efectos del alcohol en la conducción, despertando la conciencia y responsabilidad vial en los adolescentes.',
      coverImage: 'images/injuve_iniciativa.jpg',
      author: 'Instituto de la Juventud de Tamaulipas',
      isPinned: false,
      isPublished: true,
      publishedAt: new Date('2026-04-25T10:00:00.000Z'),
    },
    {
      title: 'Distribuyen material de salud sexual y reproductiva en ferias de salud',
      slug: 'injuve-salud-sexual',
      excerpt: 'Orientación profesional y entrega de insumos de prevención para planificar el futuro de la juventud.',
      content: 'En el marco de la Semana Nacional de Salud Reproductiva, el INJUVE instaló módulos informativos en plazas públicas y planteles universitarios para proveer orientación profesional y sin prejuicios sobre sexualidad responsable.\n\nEl personal de salud brindó asesoría personalizada a los asistentes sobre métodos anticonceptivos y prevención de infecciones de transmisión sexual.',
      coverImage: 'images/injuve_encuentro.jpg',
      author: 'Instituto de la Juventud de Tamaulipas',
      isPinned: false,
      isPublished: true,
      publishedAt: new Date('2026-04-24T10:00:00.000Z'),
    },
    {
      title: 'Alertan sobre los graves riesgos a la salud asociados al uso de vapeadores',
      slug: 'injuve-vapeo-riesgos',
      excerpt: 'Estudios médicos revelan daño pulmonar severo en adolescentes provocado por dispositivos electrónicos.',
      content: 'El INJUVE, en coordinación con la COFEPRIS, lanzó una campaña informativa digital e impresa orientada a desmitificar la supuesta inocuidad del vapeo.\n\nLas pláticas impartidas por neumólogos detallan los compuestos químicos nocivos presentes en los cartuchos y los riesgos inminentes de desarrollar lesiones pulmonares agudas.',
      coverImage: 'images/injuve_paz.jpg',
      author: 'Instituto de la Juventud de Tamaulipas',
      isPinned: false,
      isPublished: true,
      publishedAt: new Date('2026-04-23T10:00:00.000Z'),
    }
  ]

  for (const n of newsPosts) {
    const exists = await NewsPost.findOne({ where: { slug: n.slug } })
    if (!exists) {
      await NewsPost.create(n)
      console.log(`✅ Noticia creada: ${n.title}`)
    } else {
      await exists.update(n)
      console.log(`ℹ️  Noticia actualizada: ${n.title}`)
    }
  }

  // ── María López user ─────────────────────────────
  let maria = await User.findOne({ where: { email: 'maria@jcs.com' } })
  if (!maria) {
    maria = await User.create({
      name: 'María López',
      email: 'maria@jcs.com',
      password: await bcrypt.hash('Maria@JCS2026!', 12),
      birthDate: '1998-05-15',
      role: 'user',
      municipality: 'Ciudad Victoria',
    })
    console.log('✅ Usuario María creado — maria@jcs.com / Maria@JCS2026!')
  }

  // ── Family Members ───────────────────────────────
  const familyData = [
    { name: 'Selene López', relationship: 'hermana', birthDate: '2002-08-20', gender: 'femenino', municipality: 'Ciudad Victoria', curp: 'SELR020820HSTLNS01' },
    { name: 'Carlos López', relationship: 'hermano', birthDate: '1995-12-10', gender: 'masculino', municipality: 'Ciudad Victoria', curp: 'CARC951210HSTLNC02' },
    { name: 'Marisol López', relationship: 'madre', birthDate: '1973-04-05', gender: 'femenino', municipality: 'Ciudad Victoria', curp: 'MARS730405HSTLNM03' }
  ]

  const members = []
  for (const f of familyData) {
    let m = await FamilyMember.findOne({ where: { curp: f.curp } })
    if (!m) {
      m = await FamilyMember.create({ ...f, userId: maria.id })
      console.log(`✅ Familiar creado: ${f.name}`)
    } else {
      await m.update(f)
      console.log(`ℹ️  Familiar actualizado: ${f.name}`)
    }
    members.push(m)
  }

  // ── Health Records for María ──────────────────────
  const mariaRecords = [
    { type: 'weight', value: 90, value2: 178, unit: 'kg', recordedAt: '2026-06-04T12:00:00.000Z' },
    { type: 'weight', value: 89, value2: 178, unit: 'kg', recordedAt: '2026-05-15T12:00:00.000Z' },
    { type: 'weight', value: 88, value2: 178, unit: 'kg', recordedAt: '2026-04-10T12:00:00.000Z' },
    { type: 'weight', value: 87.5, value2: 178, unit: 'kg', recordedAt: '2026-03-05T12:00:00.000Z' },
    { type: 'weight', value: 87, value2: 178, unit: 'kg', recordedAt: '2026-02-01T12:00:00.000Z' },
    { type: 'weight', value: 87.2, value2: 178, unit: 'kg', recordedAt: '2026-01-05T12:00:00.000Z' },
    { type: 'glucose', value: 80, unit: 'mg/dL', recordedAt: '2026-05-02T08:00:00.000Z' },
    { type: 'bloodPressure', value: 113.9, value2: 74, unit: 'mmHg', recordedAt: '2026-06-03T10:00:00.000Z' },
    { type: 'heartRate', value: 85.4, unit: 'bpm', recordedAt: '2026-06-03T10:00:00.000Z' }
  ]

  for (const r of mariaRecords) {
    await HealthRecord.create({ ...r, userId: maria.id })
  }
  console.log('✅ Mediciones creadas para María')

  // ── Health Records for Family Members ────────────
  const selene = members.find(m => m.name.startsWith('Selene'))
  const carlos = members.find(m => m.name.startsWith('Carlos'))
  const marisol = members.find(m => m.name.startsWith('Marisol'))

  if (selene) {
    const recs = [
      { type: 'weight', value: 65, value2: 165, unit: 'kg', recordedAt: '2026-06-04T12:00:00.000Z' },
      { type: 'glucose', value: 85, unit: 'mg/dL', recordedAt: '2026-06-04T08:00:00.000Z' },
      { type: 'bloodPressure', value: 120, value2: 80, unit: 'mmHg', recordedAt: '2026-06-04T10:00:00.000Z' },
      { type: 'heartRate', value: 72, unit: 'bpm', recordedAt: '2026-06-04T10:00:00.000Z' }
    ]
    for (const r of recs) {
      await HealthRecord.create({ ...r, userId: maria.id, familyMemberId: selene.id })
    }
    console.log('✅ Mediciones creadas para Selene')
  }

  if (carlos) {
    const recs = [
      { type: 'weight', value: 82, value2: 180, unit: 'kg', recordedAt: '2026-06-04T12:00:00.000Z' },
      { type: 'glucose', value: 95, unit: 'mg/dL', recordedAt: '2026-06-04T08:00:00.000Z' },
      { type: 'bloodPressure', value: 118, value2: 76, unit: 'mmHg', recordedAt: '2026-06-04T10:00:00.000Z' },
      { type: 'heartRate', value: 68, unit: 'bpm', recordedAt: '2026-06-04T10:00:00.000Z' }
    ]
    for (const r of recs) {
      await HealthRecord.create({ ...r, userId: maria.id, familyMemberId: carlos.id })
    }
    console.log('✅ Mediciones creadas para Carlos')
  }

  if (marisol) {
    const recs = [
      { type: 'weight', value: 74, value2: 160, unit: 'kg', recordedAt: '2026-06-04T12:00:00.000Z' },
      { type: 'glucose', value: 110, unit: 'mg/dL', recordedAt: '2026-06-04T08:00:00.000Z' },
      { type: 'bloodPressure', value: 135, value2: 85, unit: 'mmHg', recordedAt: '2026-06-04T10:00:00.000Z' },
      { type: 'heartRate', value: 78, unit: 'bpm', recordedAt: '2026-06-04T10:00:00.000Z' }
    ]
    for (const r of recs) {
      await HealthRecord.create({ ...r, userId: maria.id, familyMemberId: marisol.id })
    }
    console.log('✅ Mediciones creadas para Marisol')
  }

  console.log('\n🎉 Seed completado exitosamente')
  process.exit(0)
}

seed().catch(error => {
  console.error('❌ Error en seed:', error)
  process.exit(1)
})