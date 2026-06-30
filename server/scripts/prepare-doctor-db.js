import dotenv from 'dotenv'
dotenv.config()

import { sequelize } from '../src/config/database.js'

async function run() {
  try {
    await sequelize.authenticate()
    console.log('✅ Connected to database')

    // 1. Add 'doctor' to the enum_users_role type
    try {
      await sequelize.query('ALTER TYPE "enum_users_role" ADD VALUE \'doctor\'')
      console.log('✅ Added "doctor" value to enum_users_role')
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('ℹ️ "doctor" role value already exists in ENUM')
      } else {
        console.warn('⚠️ Warning altering type enum_users_role:', e.message)
      }
    }

    // 2. Add doctor_id column to users table
    try {
      await sequelize.query(`
        ALTER TABLE "users" 
        ADD COLUMN IF NOT EXISTS "doctor_id" UUID REFERENCES "users"("id") ON DELETE SET NULL
      `)
      console.log('✅ Added "doctor_id" column to users table')
    } catch (e) {
      console.error('❌ Error adding doctor_id column:', e.message)
    }

    console.log('🎉 DB migration preparation completed successfully!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Error executing DB prep:', err)
    process.exit(1)
  }
}

run()
