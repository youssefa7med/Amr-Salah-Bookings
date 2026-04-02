import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/db/supabase'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'

interface StaffUser {
  id: string
  email: string
  name: string
  phone?: string
  role: 'staff' | 'manager' | 'admin'
  is_active: boolean
}

export default function StaffManagementPage() {
  const { t } = useTranslation()
  const [staff, setStaff] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'staff' as 'staff' | 'manager' | 'admin',
  })

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('staff_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setStaff(data || [])
    } catch (err: any) {
      console.error(err)
      toast.error('خطأ في تحميل الموظفين')
    } finally {
      setLoading(false)
    }
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password || !formData.name) {
      toast.error(t('validation.required'))
      return
    }

    try {
      setLoading(true)

      // Hash password (في الإنتاج استخدم bcrypt على الخادم)
      const passwordHash = btoa(formData.password)

      const { error } = await supabase.from('staff_users').insert([
        {
          email: formData.email,
          password_hash: passwordHash,
          name: formData.name,
          phone: formData.phone || null,
          role: formData.role,
          is_active: true,
        },
      ])

      if (error) throw error

      toast.success('تم إضافة الموظف بنجاح')
      setFormData({ email: '', password: '', name: '', phone: '', role: 'staff' })
      setShowForm(false)
      fetchStaff()
    } catch (err: any) {
      console.error(err)
      toast.error('خطأ في إضافة الموظف')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('هل تأكد من حذف هذا الموظف؟')) return

    try {
      const { error } = await supabase.from('staff_users').delete().eq('id', id)

      if (error) throw error

      toast.success('تم حذف الموظف')
      fetchStaff()
    } catch (err: any) {
      toast.error('خطأ في حذف الموظف')
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('staff_users')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error

      fetchStaff()
      toast.success(currentStatus ? 'تم تضغيل الموظف' : 'تم تفعيل الموظف')
    } catch (err: any) {
      toast.error('خطأ في التحديث')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">إدارة الموظفين</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={20} /> إضافة موظف
          </button>
        </div>

        {showForm && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">موظف جديد</h2>

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">الاسم</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500"
                    placeholder="اسم الموظف"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500"
                    placeholder="0501234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">الصلاحية</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500"
                  >
                    <option value="staff">موظف عادي</option>
                    <option value="manager">مدير</option>
                    <option value="admin">مسؤول</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">كلمة المرور</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? 'جاري...' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {loading && !showForm ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"></div>
            <p className="text-slate-300 mt-4">جاري التحميل...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {staff.map((member) => (
              <div key={member.id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{member.name}</h3>
                    <p className="text-slate-400 text-sm">{member.email}</p>
                    {member.phone && <p className="text-slate-400 text-sm">{member.phone}</p>}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.role === 'admin'
                        ? 'bg-red-500/20 text-red-400'
                        : member.role === 'manager'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-slate-500/20 text-slate-400'
                    }`}
                  >
                    {member.role === 'admin' ? 'مسؤول' : member.role === 'manager' ? 'مدير' : 'موظف'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(member.id, member.is_active)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      member.is_active
                        ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                        : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                    }`}
                  >
                    {member.is_active ? 'مفعّل' : 'معطّل'}
                  </button>
                  <button
                    onClick={() => handleDeleteStaff(member.id)}
                    className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
