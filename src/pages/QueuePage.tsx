import { useState, useEffect } from 'react'
import { supabase, Booking } from '@/db/supabase'
import toast from 'react-hot-toast'
import { Check, X, Clock, Phone } from 'lucide-react'

// Format date to Arabic format
const formatDateArabic = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00')
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  return `${days[date.getDay()]}، ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

export default function QueuePage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [barbers, setBarbers] = useState<{ [key: string]: string }>({})
  const [services, setServices] = useState<{ [key: string]: any }>({})
  const [loading, setLoading] = useState(true)
  const [refreshTime, setRefreshTime] = useState(14)
  const [incompleteBookings, setIncompleteBookings] = useState<number>(0)

  useEffect(() => {
    fetchData()
    
    // Fetch every 14 seconds
    const interval = setInterval(fetchData, 14000)
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('bookings-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, () => {
        console.log('Real-time update detected')
        fetchData()
      })
      .subscribe()
    
    return () => {
      clearInterval(interval)
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTime((prev) => (prev === 0 ? 14 : prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Fetch today's pending bookings sorted by time
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', today)
        .neq('status', 'cancelled')
        .neq('status', 'completed')
        .order('booking_time', { ascending: true })

      if (bookingsError) throw bookingsError

      // Count incomplete bookings
      const incomplete = (bookingsData || []).filter(
        b => !b.barber_id || b.barber_id === '' || !b.service_id || b.service_id === ''
      ).length
      setIncompleteBookings(incomplete)

      // Fetch barbers for mapping
      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select('id, name')

      if (barbersError) throw barbersError

      // Fetch services for mapping
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, name_ar, price, duration_minutes')

      if (servicesError) throw servicesError

      const barbersMap: { [key: string]: string } = {}
      ;(barbersData || []).forEach((b: any) => {
        barbersMap[b.id] = b.name
      })

      const servicesMap: { [key: string]: any } = {}
      ;(servicesData || []).forEach((s: any) => {
        servicesMap[s.id] = s
      })

      setBookings(bookingsData || [])
      setBarbers(barbersMap)
      setServices(servicesMap)
    } catch (err: any) {
      console.error('Error fetching queue:', err)
      toast.error('خطأ في تحميل الطابور')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId)

      if (error) throw error

      toast.success('تم إكمال الحجز')
      fetchData()
    } catch (err: any) {
      console.error('Error completing booking:', err)
      toast.error('خطأ في التحديث')
    }
  }

  const handleCancel = async (bookingId: string) => {
    if (!window.confirm('هل تريد ملغاء هذا الحجز؟')) return

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)

      if (error) throw error

      toast.success('تم إلغاء الحجز')
      fetchData()
    } catch (err: any) {
      console.error('Error cancelling booking:', err)
      toast.error('خطأ في الإلغاء')
    }
  }

  const currentBooking = bookings.length > 0 ? bookings[0] : null
  const nextBookings = bookings.slice(1)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-4 md:py-8">
      <div className="max-w-6xl mx-auto px-3 md:px-4">
        {/* Top Info */}
        <div className="flex items-center justify-between mb-8 md:mb-12 flex-col md:flex-row gap-3">
          <h1 className="text-2xl md:text-4xl font-bold text-white">🎯 الطابور</h1>
          <div className="flex items-center gap-2 text-slate-400 text-sm md:text-base">
            <Clock size={18} />
            <span>التحديث بعد {refreshTime}ث</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 text-lg">جاري التحميل...</div>
        ) : (
          <>
            {incompleteBookings > 0 && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-8 flex gap-3">
                <div className="text-red-300 font-semibold">⚠️ تحذير</div>
                <div className="text-red-200 text-sm">
                  يوجد <strong>{incompleteBookings}</strong> حجز {incompleteBookings === 1 ? 'بيانات ناقصة' : 'بيانات ناقصة'} (بدون حلاق أو خدمة). 
                  يرجى تصحيح البيانات مباشرة من قاعدة البيانات.
                </div>
              </div>
            )}

            {currentBooking ? (
          <>
            {/* Current Customer - Big Hero */}
            <div className="bg-gradient-to-br from-gold-500 to-gold-600 rounded-xl md:rounded-2xl p-6 md:p-12 mb-8 md:mb-12 shadow-2xl border-2 border-gold-400">
              <div className="text-center">
                <p className="text-gold-100 text-sm md:text-lg mb-3">العميل الحالي</p>
                <h2 className="text-white text-4xl md:text-6xl font-bold mb-6 break-words">{currentBooking.customer_name}</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
                  <div className="bg-white/20 rounded-lg p-2 md:p-4">
                    <p className="text-gold-100 text-xs md:text-sm mb-1">الهاتف</p>
                    <div className="flex items-center justify-center gap-1 md:gap-2 text-white font-semibold text-xs md:text-lg">
                      <Phone size={16} className="hidden md:block" />
                      <span className="text-xs md:text-base">{currentBooking.customer_phone}</span>
                    </div>
                  </div>

                  <div className="bg-white/20 rounded-lg p-2 md:p-4">
                    <p className="text-gold-100 text-xs md:text-sm mb-1">التاريخ</p>
                    <p className="text-white font-semibold text-xs md:text-lg">{formatDateArabic(currentBooking.booking_date)}</p>
                  </div>

                  <div className="bg-white/20 rounded-lg p-2 md:p-4">
                    <p className="text-gold-100 text-xs md:text-sm mb-1">الوقت</p>
                    <p className="text-white font-semibold text-xs md:text-lg">{currentBooking.booking_time}</p>
                  </div>

                  <div className="bg-white/20 rounded-lg p-2 md:p-4">
                    <p className="text-gold-100 text-xs md:text-sm mb-1">الحلاق</p>
                    <p className="text-white font-semibold text-xs md:text-lg truncate">
                      {barbers[currentBooking.barber_id] 
                        ? barbers[currentBooking.barber_id] 
                        : currentBooking.barber_id ? '⚠️ غير موجود' : '❌ لم يتم التحديد'}
                    </p>
                  </div>

                  <div className="bg-white/20 rounded-lg p-2 md:p-4">
                    <p className="text-gold-100 text-xs md:text-sm mb-1">الخدمة</p>
                    <p className="text-white font-semibold text-xs md:text-lg truncate">
                      {services[currentBooking.service_id]?.name_ar 
                        ? services[currentBooking.service_id]?.name_ar 
                        : currentBooking.service_id ? '⚠️ غير موجودة' : '❌ لم يتم التحديد'}
                    </p>
                  </div>

                  <div className="bg-white/20 rounded-lg p-2 md:p-4">
                    <p className="text-gold-100 text-xs md:text-sm mb-1">المدة</p>
                    <p className="text-white font-semibold text-xs md:text-lg">{services[currentBooking.service_id]?.duration_minutes || '-'} دقيقة</p>
                  </div>

                  <div className="bg-white/20 rounded-lg p-2 md:p-4">
                    <p className="text-gold-100 text-xs md:text-sm mb-1">السعر</p>
                    <p className="text-white font-semibold text-xs md:text-lg">{services[currentBooking.service_id]?.price || '-'} ج.م</p>
                  </div>

                  <div className="bg-white/20 rounded-lg p-2 md:p-4">
                    <p className="text-gold-100 text-xs md:text-sm mb-1">الحالة</p>
                    <p className="text-white font-semibold text-xs md:text-lg">🔔 جاري</p>
                  </div>
                </div>

                {currentBooking.notes && (
                  <div className="bg-white/10 rounded-lg p-3 md:p-4 mb-6 md:mb-8">
                    <p className="text-gold-100 text-xs md:text-sm mb-2">ملاحظات:</p>
                    <p className="text-white text-xs md:text-lg">{currentBooking.notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 md:gap-4 justify-center flex-col md:flex-row">
                  <button
                    onClick={() => handleComplete(currentBooking.id)}
                    className="flex items-center justify-center gap-2 px-4 md:px-8 py-2 md:py-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-xs md:text-lg transition-colors shadow-lg"
                  >
                    <Check size={20} />
                    اكتمل ✓
                  </button>
                  <button
                    onClick={() => handleCancel(currentBooking.id)}
                    className="flex items-center justify-center gap-2 px-4 md:px-8 py-2 md:py-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-xs md:text-lg transition-colors shadow-lg"
                  >
                    <X size={20} />
                    ملغي ✗
                  </button>
                </div>
              </div>
            </div>

            {/* Next Customers List */}
            {nextBookings.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg md:rounded-xl p-4 md:p-6">
                <h3 className="text-lg md:text-2xl font-bold text-white mb-4 md:mb-6">📋 الانتظار</h3>

                <div className="space-y-2 md:space-y-3">
                  {nextBookings.map((booking, index) => (
                    <div key={booking.id} className="flex items-start md:items-center justify-between p-3 md:p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors border border-slate-600 flex-col md:flex-row gap-2">
                      <div className="flex items-start gap-2 md:gap-4 flex-1 w-full">
                        <div className="text-xl md:text-3xl font-bold text-gold-500 w-8 md:w-12 text-center flex-shrink-0">{index + 2}</div>

                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm md:text-lg truncate">{booking.customer_name}</p>
                          <div className="flex flex-wrap items-center gap-1 md:gap-2 text-slate-300 text-xs md:text-sm mt-1">
                            <span className="flex items-center gap-1 flex-shrink-0">
                              📅 {formatDateArabic(booking.booking_date)}
                            </span>
                            <span className="hidden md:flex items-center gap-1">•</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1 md:gap-2 text-slate-300 text-xs md:text-sm">
                            <span className="flex items-center gap-1 flex-shrink-0">
                              <Phone size={14} />
                              <span className="truncate">{booking.customer_phone}</span>
                            </span>
                            <span className="flex items-center gap-1 flex-shrink-0">
                              <Clock size={14} />
                              {booking.booking_time}
                            </span>
                            <span className="truncate">
                              ⚡ {barbers[booking.barber_id] 
                                ? barbers[booking.barber_id] 
                                : booking.barber_id ? '⚠️ غير موجود' : '❌ بلا حلاق'}
                            </span>
                            <span className="truncate">
                              🛠️ {services[booking.service_id]?.name_ar 
                                ? services[booking.service_id]?.name_ar 
                                : booking.service_id ? '⚠️ غير موجودة' : '❌ بلا خدمة'}
                            </span>
                            {services[booking.service_id]?.price && (
                              <span className="truncate">💰 {services[booking.service_id]?.price} ج.م</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-slate-400 text-xs md:text-sm hidden md:block flex-shrink-0">
                        {booking.booking_date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bookings.length === 1 && (
              <div className="text-center mt-12 text-slate-400 text-xl">
                ✅ لا يوجد عملاء منتظرين حالياً
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-slate-400 text-2xl mb-4">✅ لا يوجد حجوزات اليوم</p>
            <p className="text-slate-500">استرخ، لا حاجة للعمل الآن!</p>
          </div>
        )}
          </>
        )}
      </div>
    </main>
  )
}
