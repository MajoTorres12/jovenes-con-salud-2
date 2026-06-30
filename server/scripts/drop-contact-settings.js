import { sequelize } from '../src/config/database.js'

async function run() {
  try {
    await sequelize.authenticate()
    console.log('✅ Connected to database')
    await sequelize.query('DROP TABLE IF EXISTS contact_settings CASCADE;')
    console.log('✅ Dropped contact_settings table')
    process.exit(0)
  } catch (err) {
    console.error('❌ Error dropping table:', err)
    process.exit(1)
  }
}

run()
