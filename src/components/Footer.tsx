import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-xs text-slate-500">
            {isArabic ? '© تطوير بواسطة' : '© Developed by'} <span className="text-slate-400 font-semibold">Youssef & Mohamed</span>
          </p>
          <p className="text-xs text-slate-600">
            {isArabic ? 'للتواصل:' : 'Contact:'} <span className="text-slate-500 font-mono">01000139417</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
