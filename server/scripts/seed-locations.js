import { sequelize } from '../src/config/database.js'
import Location from '../src/models/Location.js'

const locations = [
  {
    key: 'torre_bicentenario',
    label: 'Torre Bicentenario Injuve (piso 18)',
    address: 'Parque Bicentenario, Blvrd Praxedis Balboa, Sin Nombre de Col 13, 87083 Cdad. Victoria, Tamps.',
    latitude: 23.75166,
    longitude: -99.09692,
    isOfficial: true
  },
  {
    key: 'imss_hosp_general',
    label: 'IMSS Hospital General',
    address: 'i m s s Justo Sierra SN-S I.M.S.S, Centro Universitario, Cdad. Victoria, Tamps.',
    latitude: 23.738,
    longitude: -99.131,
    isOfficial: false
  },
  {
    key: 'cruz_roja',
    label: 'Cruz Roja',
    address: 'C. Lomas de Calamaco 462, Lomas de Calamaco, 87018 Cdad. Victoria, Tamps.',
    latitude: 23.7548,
    longitude: -99.1675,
    isOfficial: false
  },
  {
    key: 'clinica_issste',
    label: 'Clínica Hospital Issste',
    address: '19 Oaxaca y San Luis Potosí, Fovissste, 87020 Cdad. Victoria, Tamps.',
    latitude: 23.75424,
    longitude: -99.15119,
    isOfficial: false
  },
  {
    key: 'hosp_general_vic',
    label: 'Hospital General Victoria',
    address: 'Blvd. Fidel Velazquez 1845, Revolución Verde, 87024 Cdad. Victoria, Tamps.',
    latitude: 23.748455,
    longitude: -99.137461,
    isOfficial: false
  }
]

async function seed() {
  try {
    await sequelize.authenticate()
    console.log('✅ Connected to database for seeding.')

    // Clear existing locations
    await Location.destroy({ where: {} })
    console.log('✅ Cleared existing locations.')

    // Bulk create locations
    await Location.bulkCreate(locations)
    console.log('✅ Successfully seeded predefined locations!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Error seeding locations:', err)
    process.exit(1)
  }
}

seed()
