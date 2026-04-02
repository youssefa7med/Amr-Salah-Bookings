import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

// Amr Salah Barber Shop - Header Component
// Branding: Amr Salah (عمرو صلاح)

interface HeaderProps {
  isStaff: boolean
  onLogout: () => void
}

export default function Header({ isStaff, onLogout }: HeaderProps) {
  const { i18n } = useTranslation()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')
  }

  const handleLogout = () => {
    localStorage.removeItem('staff_token')
    onLogout()
    setMobileMenuOpen(false)
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const navLinkClass = (path: string) => {
    const baseClass = "px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base"
    if (isActive(path)) {
      return `${baseClass} bg-gold-500 text-white shadow-lg`
    }
    return `${baseClass} bg-slate-800 hover:bg-slate-700 text-white`
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
              <p className="text-xs text-gold-300">Barber Shop</p>\n            </div>\n          </Link>
            </div>
          </Link>

          <nav className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors font-medium"
            >
              {i18n.language === 'ar' ? 'EN' : 'AR'}
            </button>

            {isStaff && (
              <>
                <Link to="/queue" className={navLinkClass('/queue')}>
                  🎯 الطابور
                </Link>
                <Link to="/staff-management" className={navLinkClass('/staff-management')}>
                  👥 الموظفين
                </Link>
                <Link to="/admin-settings" className={navLinkClass('/admin-settings')}>
                  ⚙️ الإدارة
                </Link>
                <Link to="/working-hours" className={navLinkClass('/working-hours')}>
                  🕒 أوقات العمل
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors font-medium"
                >
                  خروج
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden w-full">
          <div className="flex items-center justify-between gap-2 w-full">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
              <img src="/logo.png" alt="Amr Salah" className="h-10 object-contain" />
              <span className="text-lg font-bold text-gold-400">عمرو صلاح</span>
            </Link>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={toggleLanguage}
                className="px-2 py-1 rounded text-xs bg-slate-800 hover:bg-slate-700 text-white font-medium"
              >
                {i18n.language === 'ar' ? 'EN' : 'AR'}
              </button>

              {isStaff && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 bg-gold-500 hover:bg-gold-600 rounded text-white font-bold text-lg transition-colors z-40 relative"
                  aria-label="فتح قائمة التنقل"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu - Visible when staff is logged in */}
          {isStaff && mobileMenuOpen && (
            <nav className="mt-3 flex flex-col gap-2 bg-slate-800/50 p-3 rounded-lg border border-slate-700 animate-in fade-in slide-in-from-top-2 z-30 relative">
              <Link
                to="/queue"
                className={`${navLinkClass('/queue')} text-center text-sm`}
                onClick={() => setMobileMenuOpen(false)}
              >
                🎯 الطابور
              </Link>
              <Link
                to="/staff-management"
                className={`${navLinkClass('/staff-management')} text-center text-sm`}
                onClick={() => setMobileMenuOpen(false)}
              >
                👥 الموظفين
              </Link>
              <Link
                to="/admin-settings"
                className={`${navLinkClass('/admin-settings')} text-center text-sm`}
                onClick={() => setMobileMenuOpen(false)}
              >
                ⚙️ الإدارة
              </Link>
              <Link
                to="/working-hours"
                className={`${navLinkClass('/working-hours')} text-center text-sm`}
                onClick={() => setMobileMenuOpen(false)}
              >
                🕒 أوقات العمل
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors text-center text-sm"
              >
                خروج
              </button>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}
