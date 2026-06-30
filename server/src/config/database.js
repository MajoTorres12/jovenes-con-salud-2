import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

// Database configuration
// Supports both DATABASE_URL (for cloud) and individual env vars (for local)
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? {
          require: true,
          rejectUnauthorized: false,
        } : false,
      },
    })
  : new Sequelize(
      process.env.DB_NAME || 'jovenes_con_salud_dev',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      }
    )

export { sequelize }
