import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

// Pages
import BookingPage from './pages/BookingPage'

// Components
import Header from './components/Header'
import Footer from './components/Footer'

function App() {
  const { i18n } = useTranslation()

  useEffect(() => {
    // Set HTML dir based on language
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
  }, [i18n.language])

  return (
    <>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<BookingPage />} />
              <Route path="*" element={<BookingPage />} />
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
