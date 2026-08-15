import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main className="layout-main-content" style={{ flex: 1, paddingTop: '4rem' }}>
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}

