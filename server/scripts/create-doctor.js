import { sequelize } from '../src/config/database.js'
import User from '../src/models/User.js'
import bcrypt from 'bcryptjs'

async function run() {
  try {
    await sequelize.authenticate()
    console.log('✅ Connected to database')
    
    // Check if doctor@jcs.com exists
    let doc = await User.findOne({ where: { email: 'doctor@jcs.com' } })
    if (!doc) {
      doc = await User.create({
        name: 'Dr. John Doe',
        email: 'doctor@jcs.com',
        password: await bcrypt.hash('Doctor@JCS2026!', 12),
        birthDate: '1980-05-20',
        role: 'doctor',
        municipality: 'Ciudad Victoria'
      })
      console.log('✅ Created doctor user: doctor@jcs.com / Doctor@JCS2026!')
    } else {
      await doc.update({ role: 'doctor' })
      console.log('✅ Updated existing doctor user to doctor role')
    }
    
    // Also assign maria@jcs.com to this doctor so the doctor has a patient!
    const maria = await User.findOne({ where: { email: 'maria@jcs.com' } })
    if (maria) {
      await maria.update({ doctorId: doc.id })
      console.log('✅ Assigned maria@jcs.com to doctor')
    }
    
    process.exit(0)
  } catch (err) {
    console.error('❌ Error creating doctor:', err)
    process.exit(1)
  }
}

run()
