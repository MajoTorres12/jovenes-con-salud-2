import app from './src/app.js'
import { sequelize } from './src/config/database.js'
// Import models so Sequelize syncs their tables
// IMPORTANT: FamilyMember must come before Medication and Supplement (foreign key dependency)
import './src/models/User.js'
import './src/models/FamilyMember.js'
import './src/models/HealthRecord.js'
import './src/models/ContactMessage.js'
import './src/models/Disease.js'
import './src/models/NutraceuticalProduct.js'
import './src/models/Article.js'
import './src/models/NewsPost.js'
import './src/models/Medication.js'
import './src/models/Supplement.js'
import './src/models/ContactSettings.js'
import './src/models/Location.js'
import './src/models/ChatMessage.js'
import './src/models/MedicalAlert.js'



const PORT = process.env.PORT || 3001

async function startServer() {
  // Try database connection, but don't crash if it fails
  try {
    await sequelize.authenticate()
    console.log('✅ Conexión a PostgreSQL establecida correctamente')

    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true })
      console.log('✅ Modelos sincronizados con la base de datos')
    }
  } catch (dbError) {
    console.warn('⚠️  No se pudo conectar a PostgreSQL:', dbError.message)
    console.warn('   El servidor arrancará sin base de datos.')
    console.warn('   Las rutas que requieren DB devolverán errores.')
    console.warn('   Instala PostgreSQL y configura .env para habilitar la BD.')
  }

  // Always start the HTTP server — listen on all interfaces (0.0.0.0)
  // so Android devices on the same Wi-Fi can reach the backend.
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║   🏥 API Jóvenes con Salud                    ║
  ║   🚀 Servidor corriendo en puerto ${PORT}        ║
  ║   📍 http://localhost:${PORT}/api/health         ║
  ║   📱 Accesible desde la red local (0.0.0.0)   ║
  ║   🌿 Entorno: ${(process.env.NODE_ENV || 'development').padEnd(30)}║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
    `)
  })
}

startServer()

