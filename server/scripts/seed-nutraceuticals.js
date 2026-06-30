/**
 * Seed script for nutraceutical products
 * Run: node --experimental-vm-modules scripts/seed-nutraceuticals.js
 * (from the /server directory)
 */
import dotenv from 'dotenv'
dotenv.config()

import { sequelize } from '../src/config/database.js'
import '../src/models/Disease.js'
import '../src/models/NutraceuticalProduct.js'

import Disease from '../src/models/Disease.js'
import NutraceuticalProduct from '../src/models/NutraceuticalProduct.js'

async function seedNutraceuticals() {
  await sequelize.authenticate()
  console.log('✅ Conectado a la base de datos')

  await sequelize.sync({ alter: true })
  console.log('✅ Tabla nutraceutical_products sincronizada')

  const diabetesDisease = await Disease.findOne({ where: { slug: 'diabetes' } })
  const hipertensionDisease = await Disease.findOne({ where: { slug: 'hipertension' } })

  const products = [
    {
      name: 'Xocolat Ocahta',
      slug: 'xocolat-ocahta',
      description: 'Chocolate Amargo con ingredientes naturales para la regulación de la presión arterial sistólica y diastólica. Elaborado con cacao de alta pureza y extracto de maguey.',
      ingredients: [
        'Cacao puro al 70%',
        'Extracto de maguey',
        'Canela orgánica',
        'Stevia natural',
        'Magnesio',
      ],
      benefits: [
        'Control de la Presión Arterial',
        'Reducción del estrés oxidativo',
        'Mejora la circulación sanguínea',
        'Fuente de antioxidantes naturales',
      ],
      price: 120.00,
      currency: 'MXN',
      images: [
        'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600&q=80',
        'https://images.unsplash.com/photo-1559181567-c3190100191d?w=600&q=80',
        'https://images.unsplash.com/photo-1511381939415-e44015466834?w=600&q=80',
      ],
      purchaseUrl: 'https://heartbliss.mx',
      socialPrograms: [
        { id: '1', name: 'Jóvenes Construyendo el Futuro - Apoyo Económico', type: 'apoyo_economico', isActive: true },
        { id: '2', name: 'Medicamentos Gratuitos para ECNT - SST', type: 'apoyo_especie', isActive: true },
      ],
      diseaseId: hipertensionDisease?.id || null,
      isPublished: true,
      sortOrder: 1,
    },
    {
      name: 'ChocoNeem',
      slug: 'choconeem',
      description: 'Chocolate Amargo con ingredientes naturales para la regulación de la Glucosa en la sangre. Formulado con extracto de hoja de neem y cacao mexicano.',
      ingredients: [
        'Cacao mexicano al 72%',
        'Extracto de hoja de Neem',
        'Cromo orgánico',
        'Inulina de agave',
        'Vitamina D3',
      ],
      benefits: [
        'Regulación de la Glucosa en la sangre',
        'Control del índice glucémico',
        'Apoyo al sistema inmunológico',
        'Rico en fibra soluble',
      ],
      price: 120.00,
      currency: 'MXN',
      images: [
        'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600&q=80',
        'https://images.unsplash.com/photo-1614088685112-0a760b71a3c8?w=600&q=80',
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
        'https://images.unsplash.com/photo-1559181567-c3190100191d?w=600&q=80',
      ],
      purchaseUrl: 'https://heartbliss.mx',
      socialPrograms: [
        { id: '3', name: 'Seguro de Salud para el Bienestar', type: 'atencion_medica', isActive: true },
        { id: '2', name: 'Medicamentos Gratuitos para ECNT - SST', type: 'apoyo_especie', isActive: true },
      ],
      diseaseId: diabetesDisease?.id || null,
      isPublished: true,
      sortOrder: 2,
    },
    {
      name: 'HeartBliss Cench',
      slug: 'heartbliss-cench',
      description: 'Suplemento a base de extracto de cenchritis y cacao para el apoyo integral del sistema cardiovascular. Ayuda a mantener niveles saludables de colesterol.',
      ingredients: [
        'Extracto de Cenchritis',
        'Cacao puro',
        'Coenzima Q10',
        'Omega 3 vegetal',
        'Vitamina E',
      ],
      benefits: [
        'Apoyo cardiovascular integral',
        'Control del colesterol LDL',
        'Antiinflamatorio natural',
        'Protección celular antioxidante',
      ],
      price: 145.00,
      currency: 'MXN',
      images: [
        'https://images.unsplash.com/photo-1559181567-c3190100191d?w=600&q=80',
        'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600&q=80',
      ],
      purchaseUrl: 'https://heartbliss.mx',
      socialPrograms: [
        { id: '3', name: 'Seguro de Salud para el Bienestar', type: 'atencion_medica', isActive: true },
      ],
      diseaseId: hipertensionDisease?.id || null,
      isPublished: true,
      sortOrder: 3,
    },
    {
      name: 'HeartBliss Xocolat Diabetes II',
      slug: 'heartbliss-xocolat-diabetes-ii',
      description: 'Formulación avanzada de chocolate amargo enriquecida con ingredientes funcionales para el manejo de la Diabetes Tipo 2 y el síndrome metabólico.',
      ingredients: [
        'Cacao al 75%',
        'Berberina natural',
        'Extracto de gymnema',
        'Ácido alfa-lipoico',
        'Zinc quelado',
        'Magnesio bisglicinate',
      ],
      benefits: [
        'Control avanzado de glucosa',
        'Mejora la sensibilidad a la insulina',
        'Reducción del síndrome metabólico',
        'Protección neuropática',
        'Antioxidante potente',
      ],
      price: 160.00,
      currency: 'MXN',
      images: [
        'https://images.unsplash.com/photo-1511381939415-e44015466834?w=600&q=80',
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
        'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600&q=80',
        'https://images.unsplash.com/photo-1614088685112-0a760b71a3c8?w=600&q=80',
      ],
      purchaseUrl: 'https://heartbliss.mx',
      socialPrograms: [
        { id: '3', name: 'Seguro de Salud para el Bienestar', type: 'atencion_medica', isActive: true },
        { id: '2', name: 'Medicamentos Gratuitos para ECNT - SST', type: 'apoyo_especie', isActive: true },
      ],
      diseaseId: diabetesDisease?.id || null,
      isPublished: true,
      sortOrder: 4,
    },
  ]

  for (const p of products) {
    const exists = await NutraceuticalProduct.findOne({ where: { slug: p.slug } })
    if (!exists) {
      await NutraceuticalProduct.create(p)
      console.log(`✅ Producto creado: ${p.name}`)
    } else {
      await exists.update(p)
      console.log(`ℹ️  Producto actualizado: ${p.name}`)
    }
  }

  console.log('\n🎉 Seed de nutracéuticos completado exitosamente')
  process.exit(0)
}

seedNutraceuticals().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
