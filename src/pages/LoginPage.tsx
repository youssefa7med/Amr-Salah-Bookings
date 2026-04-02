import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

interface LoginPageProps {
  onLoginSuccess: () => void
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // TODO: Integrate with Supabase staff authentication
      // For now, use a simple mock authentication
      if (email && password.length >= 6) {
        localStorage.setItem('staff_token', email)
        onLoginSuccess()
        navigate('/dashboard')
        toast.success('تم تسجيل الدخول بنجاح')
      } else {
        toast.error('بريد إلكتروني أو كلمة مرور غير صحيحة')
      }
    } catch (err) {
      toast.error('خطأ في تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
          <h1 className="text-3xl font-bold text-white mb-2 text-center">{t('dashboard.title')}</h1>
          <p className="text-slate-300 text-center mb-8">تسجيل الدخول لموظفي المحل</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-2 bg-gold-500 hover:bg-gold-600 disabled:bg-gold-700 text-white rounded-lg font-semibold transition-colors"
            >
              {loading ? 'جاري...' : 'دخول'}
            </button>
          </form>

          <p className="text-slate-400 text-center text-sm mt-6">
            للموظفين فقط. استخدم بيانات الاعتماد الخاصة بك للمحل.
          </p>
        </div>
      </div>
    </main>
  )
}
