import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase, Booking, Barber, Service } from '@/db/supabase'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { CheckCircle, XCircle } from 'lucide-react'
import { formatTime12HourArabic } from '@/utils/formatTime'

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const [bookings, setBookings] = useState<(Booking & { barber?: Barber; service?: Service })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'today' | 'all'>('today')

  useEffect(() => {
    fetchBookings()
  }, [filter])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('bookings')
        .select(`
          *,
          barbers!barber_id(id, name, phone, email),
          services!service_id(id, name_ar, name_en, price, duration_minutes)
        `)
        .order('booking_date', { ascending: false })

      if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0]
        query = query.eq('booking_date', today)
      }

      const { data, error } = await query

      if (error) {
        console.error('Fetch error:', error)
        throw error
      }

      console.log('✅ Raw booking data:', data)

      setBookings(
        (data || []).map((b: any) => {
          // Handle both array form (barbers[0]) and object form
          const barberData = Array.isArray(b.barbers) ? b.barbers[0] : b.barbers
          const serviceData = Array.isArray(b.services) ? b.services[0] : b.services
          
          console.log(`📦 Booking ${b.id}:`, {
            barber_id: b.barber_id,
            barbers: b.barbers,
            barberData,
            service_id: b.service_id,
            services: b.services,
            serviceData,
          })
          
          return {
            ...b,
            barber: barberData,
            service: serviceData,
          }
        })
      )
    } catch (err: any) {
      console.error('Error fetching bookings:', err)
      toast.error('خطأ في تحميل الحجوزات')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId)

      if (error) throw error

      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: status as any } : b)))
      toast.success('تم تحديث الحالة')
    } catch (err: any) {
      toast.error('خطأ في تحديث الحالة')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">{t('dashboard.todayBookings')}</h1>

          <div className="flex gap-4">
            <button
              onClick={() => setFilter('today')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'today' ? 'bg-gold-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all' ? 'bg-gold-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              جميع الحجوزات
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"></div>
            <p className="text-slate-300 mt-4">جاري التحميل...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-12">
            <p className="text-slate-300 text-lg">لا توجد حجوزات</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 md:p-6 w-full">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-0 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-bold text-white truncate">{booking.customer_name}</h3>
                    <p className="text-slate-400 text-sm truncate">{booking.customer_phone}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium border flex-shrink-0 ${getStatusColor(booking.status)}`}>
                    {t(`booking_status.${booking.status}`)}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-xs md:text-sm divide-y divide-slate-700">
                  <p className="text-slate-300 py-2">
                    <strong className="text-slate-200 block md:inline">الحلاق: </strong><span className="text-white font-semibold">{booking.barber?.name || '—'}</span>
                  </p>
                  <p className="text-slate-300 py-2">
                    <strong className="text-slate-200 block md:inline">الخدمة: </strong><span className="text-white font-semibold">{booking.service?.name_ar || '—'}</span>
                  </p>
                  <p className="text-slate-300 py-2">
                    <strong className="text-slate-200 block md:inline">الموعد: </strong><span className="text-gold-400 font-semibold">{formatTime12HourArabic(booking.booking_time || '')}</span>
                  </p>
                  <p className="text-slate-300 py-2">
                    <strong className="text-slate-200 block md:inline">التاريخ: </strong>
                    <span className="text-white font-semibold text-xs md:text-sm">
                      {format(new Date(booking.booking_date), 'EEEE، d MMMM yyyy', {
                        locale: i18n.language === 'ar' ? ar : undefined,
                      })}
                    </span>
                  </p>
                  {booking.notes && (
                    <p className="text-slate-300 py-2">
                      <strong className="text-slate-200 block md:inline">ملاحظات: </strong><span className="text-white">{booking.notes}</span>
                    </p>
                  )}
                </div>

                {booking.status === 'pending' && (
                  <div className="flex flex-col md:flex-row gap-2 md:gap-2">
                    <button
                      onClick={() => updateStatus(booking.id, 'confirmed')}
                      className="flex-1 px-2 md:px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap"
                    >
                      <CheckCircle size={14} className="hidden md:block" /> <CheckCircle size={12} className="md:hidden" /> تأكيد
                    </button>
                    <button
                      onClick={() => updateStatus(booking.id, 'cancelled')}
                      className="flex-1 px-2 md:px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap"
                    >
                      <XCircle size={14} className="hidden md:block" /> <XCircle size={12} className="md:hidden" /> إلغاء
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
