import dotenv from 'dotenv'
dotenv.config()

import { sequelize } from '../src/config/database.js'

async function fix() {
  try {
    await sequelize.authenticate()
    console.log('✅ Connected')

    // Drop orphaned foreign key constraints on medications
    try {
      await sequelize.query('ALTER TABLE medications DROP CONSTRAINT IF EXISTS medications_user_id_fkey')
      await sequelize.query('ALTER TABLE medications DROP CONSTRAINT IF EXISTS medications_family_member_id_fkey')
      console.log('✅ Dropped FK constraints on medications')
    } catch (e) { console.log('Skipping medications FK:', e.message) }

    // Drop orphaned foreign key constraints on supplements
    try {
      await sequelize.query('ALTER TABLE supplements DROP CONSTRAINT IF EXISTS supplements_user_id_fkey')
      await sequelize.query('ALTER TABLE supplements DROP CONSTRAINT IF EXISTS supplements_family_member_id_fkey')
      console.log('✅ Dropped FK constraints on supplements')
    } catch (e) { console.log('Skipping supplements FK:', e.message) }

    // Truncate tables with orphaned data
    await sequelize.query('TRUNCATE TABLE medications CASCADE')
    await sequelize.query('TRUNCATE TABLE supplements CASCADE')
    console.log('✅ Truncated medications & supplements')

    // Also clean legacy tables that have no models
    const legacyTables = [
      'social_programs', 'user_favorites', 'program_enrollments',
      'nutraceutical_product_social_programs', 'doctor_patients', 'chat_messages'
    ]
    for (const t of legacyTables) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS "${t}" CASCADE`)
        console.log(`✅ Dropped legacy table: ${t}`)
      } catch (e) { console.log(`Skipping ${t}:`, e.message) }
    }

    console.log('\n🎉 Database fixed!')
    process.exit(0)
  } catch (e) {
    console.error('❌ Error:', e)
    process.exit(1)
  }
}

fix()
