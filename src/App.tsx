import { Toaster } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import BookingPage from './pages/BookingPage'
import './App.css'

function App() {
  const { i18n } = useTranslation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600">
      <Toaster position="top-center" />
      
      <div className="container mx-auto px-4 py-8">
        <BookingPage />
      </div>

      {/* Language toggle */}
      <button
        onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
        className="fixed bottom-8 left-8 bg-white text-purple-600 px-4 py-2 rounded-lg font-bold hover:bg-purple-100 transition"
      >
        {i18n.language === 'ar' ? 'English' : 'العربية'}
      </button>
    </div>
  )
}

export default App
