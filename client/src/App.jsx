import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Diseases from './pages/Diseases'
import DiseaseDetail from './pages/DiseaseDetail'
import Programs from './pages/Programs'
import Login from './pages/Login'
import Register from './pages/Register'
import Contact from './pages/Contact'
import FAQ from './pages/FAQ'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import AdvancedAnalytics from './pages/AdvancedAnalytics'
import BMICalculator from './pages/BMICalculator'
import News from './pages/News'
import NewsDetail from './pages/NewsDetail'
import Nutraceuticals from './pages/Nutraceuticals'
import NutraceuticalDetail from './pages/NutraceuticalDetail'
import AdminPanel from './pages/AdminPanel'
import AdminRoute from './components/AdminRoute'
import DoctorPanel from './pages/DoctorPanel'
import DoctorRoute from './components/DoctorRoute'
import ChatBubble from './components/chat/ChatBubble'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/enfermedades" element={<Diseases />} />
            <Route path="/enfermedades/:id" element={<DiseaseDetail />} />
            <Route path="/programas" element={<Programs />} />
            <Route path="/noticias" element={<News />} />
            <Route path="/noticias/:slug" element={<NewsDetail />} />
            <Route path="/nutraceuticos" element={<Nutraceuticals />} />
            <Route path="/nutraceuticos/:slug" element={<NutraceuticalDetail />} />
            <Route path="/contacto" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/herramientas/imc" element={<BMICalculator />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <AdvancedAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/perfil" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
          </Route>
          {/* Auth pages without layout (full-screen) */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          {/* Admin panel (full-screen, own layout) */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          } />
          {/* Doctor panel (full-screen, own layout) */}
          <Route path="/doctor" element={
            <DoctorRoute>
              <DoctorPanel />
            </DoctorRoute>
          } />
        </Routes>
        <ChatBubble />
      </AuthProvider>
    </BrowserRouter>
  )
}
