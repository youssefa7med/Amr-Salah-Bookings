import { Toaster } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import BookingPage from './pages/BookingPage'
import Logo from './components/Logo'
import './App.css'

function App() {
  const { i18n } = useTranslation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600">
      <Toaster position="top-center" />
      
      {/* Header with Logo */}
      <div className="bg-white bg-opacity-10 backdrop-blur-md border-b border-white border-opacity-20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <h1 className="text-white text-2xl font-bold">امر سلاح</h1>
          </div>
        </div>
      </div>
      
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
