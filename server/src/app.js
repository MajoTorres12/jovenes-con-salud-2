import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Import routes
import authRoutes from './routes/auth.routes.js'
import healthRoutes from './routes/health.routes.js'
import profileRoutes from './routes/profile.routes.js'
import contactRoutes from './routes/contact.routes.js'
import diseaseRoutes from './routes/disease.routes.js'
import articleRoutes from './routes/article.routes.js'
import newsRoutes from './routes/news.routes.js'
import familyRoutes from './routes/family.routes.js'
import medicationRoutes from './routes/medication.routes.js'
import supplementRoutes from './routes/supplement.routes.js'
import nutraceuticalRoutes from './routes/nutraceutical.routes.js'
import adminRoutes from './routes/admin.routes.js'
import doctorRoutes from './routes/doctor.routes.js'
import chatRoutes from './routes/chat.routes.js'
import notificationRoutes from './routes/notification.routes.js'
import analyticsRoutes from './routes/analytics.routes.js'
import ContactSettings from './models/ContactSettings.js'

const app = express()

// ========================================
// Middleware
// ========================================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: false,
}))

// Serve static images
app.use('/images', express.static('public/images'))

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.CLIENT_URL || 'http://localhost:5173')
    : true,
  credentials: true,
}))

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 min
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: { error: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' },
// })
// app.use('/api/', limiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// ========================================
// Routes
// ========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API Jóvenes con Salud funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/health-tracking', healthRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/diseases', diseaseRoutes)
app.use('/api/articles', articleRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/family', familyRoutes)
app.use('/api/medications', medicationRoutes)
app.use('/api/supplements', supplementRoutes)
app.use('/api/nutraceuticals', nutraceuticalRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/doctor', doctorRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/analytics', analyticsRoutes)

// ========================================
// Error handling
// ========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
  })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message,
  })
})

export default app
