import { sequelize } from '../src/config/database.js'
import User from '../src/models/User.js'

async function run() {
  try {
    await sequelize.authenticate()
    console.log('✅ Connected to database')
    
    const [affectedCount] = await User.update(
      { role: 'admin' },
      { where: {} }
    )
    
    console.log(`✅ Updated ${affectedCount} users to 'admin' role.`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Error updating users:', err)
    process.exit(1)
  }
}

run()
