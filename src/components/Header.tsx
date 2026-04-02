import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

// Amr Salah Barber Shop - Header Component
// Branding: Amr Salah (عمرو صلاح)

export default function Header() {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')
  }

  return (
    <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-4">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Amr Salah" className="h-12 object-contain" />
            <div>
              <span className="text-2xl font-bold text-gold-400">عمرو صلاح</span>
              <p className="text-xs text-gold-300">Barber Shop</p>
            </div>
          </Link>

          <button
            onClick={toggleLanguage}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors font-medium"
          >
            {i18n.language === 'ar' ? 'EN' : 'AR'}
          </button>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
            <img src="/logo.png" alt="Amr Salah" className="h-10 object-contain" />
            <span className="text-lg font-bold text-gold-400">عمرو صلاح</span>
          </Link>

          <button
            onClick={toggleLanguage}
            className="px-2 py-1 rounded text-xs bg-slate-800 hover:bg-slate-700 text-white font-medium"
          >
            {i18n.language === 'ar' ? 'EN' : 'AR'}
          </button>
        </div>
      </div>
    </header>
  )
}
