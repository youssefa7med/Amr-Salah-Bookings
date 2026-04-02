import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

// Pages
import BookingPage from './pages/BookingPage'
import LoginPage from './pages/LoginPage'
import StaffManagementPage from './pages/StaffManagementPage'
import AdminSettingsPage from './pages/AdminSettingsPage'
import QueuePage from './pages/QueuePage'
import WorkingHoursPage from './pages/WorkingHoursPage'

// Components
import Header from './components/Header'
import Footer from './components/Footer'

function App() {
  const { i18n } = useTranslation()
  const [isStaff, setIsStaff] = useState(false)

  useEffect(() => {
    const staffToken = localStorage.getItem('staff_token')
    setIsStaff(!!staffToken)

    // Set HTML dir based on language
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
  }, [i18n.language])

  return (
    <>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Header isStaff={isStaff} onLogout={() => setIsStaff(false)} />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<BookingPage />} />
              <Route path="/login" element={<LoginPage onLoginSuccess={() => setIsStaff(true)} />} />
              <Route path="/queue" element={isStaff ? <QueuePage /> : <Navigate to="/login" />} />
              <Route path="/staff-management" element={isStaff ? <StaffManagementPage /> : <Navigate to="/login" />} />
              <Route path="/admin-settings" element={isStaff ? <AdminSettingsPage /> : <Navigate to="/login" />} />
              <Route path="/working-hours" element={isStaff ? <WorkingHoursPage /> : <Navigate to="/login" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
      <Toaster position="top-center" />
      <Analytics />
      <SpeedInsights />
    </>
  )
}

export default App
