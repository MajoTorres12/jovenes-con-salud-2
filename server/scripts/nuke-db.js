import dotenv from 'dotenv'
dotenv.config()

import { sequelize } from '../src/config/database.js'

async function nuke() {
  try {
    await sequelize.authenticate()
    console.log('✅ Connected')

    // Get ALL tables
    const [tables] = await sequelize.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `)
    console.log('Tables found:', tables.map(t => t.tablename))

    // Disable FK checks, truncate everything, re-enable
    await sequelize.query('SET session_replication_role = replica')
    
    for (const { tablename } of tables) {
      await sequelize.query(`TRUNCATE TABLE "${tablename}" CASCADE`)
      console.log(`  ✅ Truncated: ${tablename}`)
    }
    
    await sequelize.query('SET session_replication_role = DEFAULT')
    
    // Also drop all FK constraints so sync({alter:true}) can recreate them cleanly
    const [fks] = await sequelize.query(`
      SELECT tc.constraint_name, tc.table_name
      FROM information_schema.table_constraints tc
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    `)
    
    for (const { constraint_name, table_name } of fks) {
      try {
        await sequelize.query(`ALTER TABLE "${table_name}" DROP CONSTRAINT IF EXISTS "${constraint_name}"`)
        console.log(`  ✅ Dropped FK: ${table_name}.${constraint_name}`)
      } catch (e) { /* ignore */ }
    }

    console.log('\n🎉 All tables truncated and FK constraints dropped!')
    process.exit(0)
  } catch (e) {
    console.error('❌ Error:', e)
    process.exit(1)
  }
}

nuke()
