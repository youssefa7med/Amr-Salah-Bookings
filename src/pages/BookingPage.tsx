import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase, Barber, Service, Booking } from '@/db/supabase'
import { useSettings } from '@/hooks/useSettings'
import toast from 'react-hot-toast'
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import { formatTime12Hour, formatTime12HourArabic } from '@/utils/formatTime'

// Generate time slots based on opening and closing hours
const generateTimeSlots = (openingHour: number, closingHour: number): string[] => {
  const slots: string[] = []
  for (let hour = openingHour; hour < closingHour; hour++) {
    slots.push(`${String(hour).padStart(2, '0')}:00`)
  }
  return slots
}

interface WorkingHours {
  id: string
  barber_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_working: boolean
}

// Format date to Arabic format
const formatDateArabic = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00')
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  return `${days[date.getDay()]}، ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

// Normalize Egyptian phone numbers
const normalizePhone = (phone: string) => {
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, '')
  
  // If starts with 0, keep it (e.g., 01000139417)
  if (normalized.startsWith('0')) {
    return normalized
  }
  
  // If starts with 2 (country code), convert to 0 (e.g., 201000139417 -> 01000139417)
  if (normalized.startsWith('2')) {
    return '0' + normalized.substring(1)
  }
  
  return normalized
}

// Get current date in Egypt timezone as YYYY-MM-DD string
const getEgyptDateString = (): string => {
  const now = new Date()
  return now.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' })
}

// Get current time in Egypt timezone as hours and minutes
const getEgyptTime = (): { hours: number; minutes: number } => {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Africa/Cairo',
  })
  const parts = formatter.formatToParts(now)
  const hours = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
  const minutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
  return { hours, minutes }
}

// Check if booking time is in the past (only for today)
const isPastTime = (timeStr: string, dateStr: string): boolean => {
  const egyptDate = getEgyptDateString()
  const egyptTime = getEgyptTime()
  
  // If booking date is in the past, it's always past
  if (dateStr < egyptDate) {
    return true
  }
  
  // Only check if time has passed for TODAY, not for future dates
  if (dateStr === egyptDate) {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const bookingTime = hours * 60 + minutes
    const currentTime = egyptTime.hours * 60 + egyptTime.minutes
    // A time is past only if it's already finished (< instead of <=)
    return bookingTime < currentTime
  }
  
  // For future dates, time is never considered past
  return false
}

// Compare two time strings (HH:MM format)
const compareTimeStrings = (time1: string, time2: string): number => {
  const [h1, m1] = time1.split(':').map(Number)
  const [h2, m2] = time2.split(':').map(Number)
  const t1 = h1 * 60 + m1
  const t2 = h2 * 60 + m2
  return t1 - t2
}

export default function BookingPage() {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  const { settings, getOpeningHour, getClosingHour } = useSettings()
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [existingBooking, setExistingBooking] = useState<Booking | null>(null)

  const [selectedBarber, setSelectedBarber] = useState<string>('')
  const [selectedService, setSelectedService] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  
  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingBooking, setPendingBooking] = useState<any>(null)
  const [confirmationStep, setConfirmationStep] = useState<'confirm' | 'success'>('confirm')
  const [isConfirming, setIsConfirming] = useState(false)
  const [closingCountdown, setClosingCountdown] = useState(30)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (customerPhone) {
      checkExistingBooking()
    }
  }, [customerPhone, selectedDate])

  // Countdown timer for closing modal after success
  useEffect(() => {
    if (confirmationStep !== 'success') {
      return
    }
    
    setClosingCountdown(30)
    const interval = setInterval(() => {
      setClosingCountdown(prev => {
        if (prev <= 1) {
          // Auto close
          setShowConfirmation(false)
          setConfirmationStep('confirm')
          setPendingBooking(null)
          
          // Reset form
          setSelectedBarber(barbers[0]?.id || '')
          setSelectedService(services[0]?.id || '')
          setSelectedDate('')
          setSelectedTime('')
          setCustomerName('')
          setCustomerPhone('')
          setNotes('')
          setExistingBooking(null)
          
          clearInterval(interval)
        }
        return Math.max(prev - 1, 0)
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [confirmationStep, barbers, services])

  // Update working hours from settings
  useEffect(() => {
    if (settings) {
      const openingHour = getOpeningHour()
      const closingHour = getClosingHour()
      console.log(`⏰ Setting working hours from settings: ${openingHour}:00 - ${closingHour}:00`)
      // Working hours are now properly configured
    }
  }, [settings])

  const fetchData = async () => {
    try {
      const [barbersRes, servicesRes] = await Promise.all([
        supabase.from('barbers').select('*'),
        supabase.from('services').select('*'),
      ])

      if (barbersRes.error) throw barbersRes.error
      if (servicesRes.error) throw servicesRes.error

      console.log('✅ Fetched barbers:', barbersRes.data)
      console.log('✅ Fetched services:', servicesRes.data)

      setBarbers(barbersRes.data || [])
      setServices(servicesRes.data || [])

      // Auto-select first barber and first service
      if (barbersRes.data && barbersRes.data.length > 0) {
        setSelectedBarber(barbersRes.data[0].id)
      }
      if (servicesRes.data && servicesRes.data.length > 0) {
        setSelectedService(servicesRes.data[0].id)
      }
    } catch (err: any) {
      console.error('Error fetching data:', err)
      toast.error(t('booking.error'))
    }
  }

  useEffect(() => {
    if (selectedBarber && selectedDate) {
      // Refresh booked slots immediately and in parallel
      const refreshData = async () => {
        console.log(`🔄 Fetching bookings for barber ${selectedBarber} on ${selectedDate}`)
        
        // Get booked slots
        try {
          const { data, error } = await supabase
            .from('bookings')
            .select('booking_time')
            .eq('barber_id', selectedBarber)
            .eq('booking_date', selectedDate)
            .in('status', ['pending', 'confirmed'])

          if (!error && data) {
            // Normalize all times to HH:MM format
            // booking_time is TIME type (HH:MM:SS format), extract HH:MM only
            const booked = (data || [])
              .map((b: any) => {
                // booking_time is already in HH:MM:SS format, just extract HH:MM
                const timeStr = b.booking_time || ''
                return timeStr.substring(0, 5) // Extract HH:MM
              })
              .filter((t: string) => t.length === 5) // Must be HH:MM format
              // Remove duplicates
              .filter((t: string, index: number, arr: string[]) => arr.indexOf(t) === index)
            
            setBookedSlots(booked)
            console.log(`✅ Raw booking data:`, data)
            console.log(`✅ Normalized booked slots for ${selectedDate}:`, booked)
            console.log(`📊 Total booked times: ${booked.length}`)
            
            // Debug: Show which slots are booked
            booked.forEach(slot => {
              console.log(`  🔴 ${slot} is booked`)
            })
          } else {
            console.log('❌ Error fetching booked slots:', error)
            setBookedSlots([])
          }
        } catch (err: any) {
          console.error('❌ Error checking bookings:', err)
          setBookedSlots([])
        }

        // Get working hours
        try {
          const bookingDate = new Date(selectedDate + 'T00:00:00')
          const dayOfWeek = bookingDate.getDay()

          const { data, error } = await supabase
            .from('working_hours')
            .select('*')
            .eq('barber_id', selectedBarber)
            .eq('day_of_week', dayOfWeek)
            .limit(1)

          if (!error && data && data.length > 0) {
            const hours = data[0] as WorkingHours
            setWorkingHours([hours])
            console.log(`🕒 Fetched working hours:`, hours)
            console.log(`   Start: ${hours.start_time}, End: ${hours.end_time}, Is Working: ${hours.is_working}`)
            
            if (hours.is_working) {
              const allSlots = generateTimeSlots(getOpeningHour(), getClosingHour())
              const slots = allSlots.filter((slot: string) => {
                const startCmp = compareTimeStrings(slot, hours.start_time)
                const endCmp = compareTimeStrings(slot, hours.end_time)
                const isValid = startCmp >= 0 && endCmp <= 0
                console.log(`   ⏰ ${slot}: start_cmp=${startCmp} end_cmp=${endCmp} → ${isValid ? '✅ included' : '❌ excluded'}`)
                return isValid
              })
              setAvailableSlots(slots)
              console.log(`📅 Available slots from ${hours.start_time} to ${hours.end_time}:`, slots)
            } else {
              setAvailableSlots([])
              console.log('❌ Barber not working on this day')
            }
          } else {
            setWorkingHours([])
            const allSlots = generateTimeSlots(getOpeningHour(), getClosingHour())
            setAvailableSlots(allSlots)
            console.log('⚠️ No working hours defined, using settings hours')
          }
        } catch (err: any) {
          console.error('Error fetching working hours:', err)
          const allSlots = generateTimeSlots(getOpeningHour(), getClosingHour())
          setAvailableSlots(allSlots)
        }
      }
      
      // Call immediately first
      refreshData()
      
      // Then set up interval to refresh every 3 seconds for live updates
      const refreshInterval = setInterval(() => {
        console.log(`🔄 Auto-refresh bookings...`)
        refreshData()
      }, 3000)

      // Also subscribe to real-time changes from main app
      const subscription = supabase
        .channel(`bookings-${selectedBarber}-${selectedDate}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `barber_id=eq.${selectedBarber},booking_date=eq.${selectedDate},status=in.(pending,confirmed)`,
          },
          (payload) => {
            console.log('Real-time booking change detected:', payload.eventType)
            refreshData()
          }
        )
        .subscribe()

      return () => {
        clearInterval(refreshInterval)
        subscription.unsubscribe()
      }
    }
    return undefined
  }, [selectedBarber, selectedDate])

  const checkExistingBooking = async () => {
    try {
      const normalizedPhone = normalizePhone(customerPhone)
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_phone', normalizedPhone)
        .eq('booking_date', selectedDate)
        .neq('status', 'cancelled')
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        setExistingBooking(data[0])
      } else {
        setExistingBooking(null)
      }
    } catch (err: any) {
      console.error('Error checking existing booking:', err)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all required fields
    if (!selectedBarber?.trim()) {
      toast.error('اختر حلاق من فضلك')
      return
    }
    if (!selectedService?.trim()) {
      toast.error('اختر خدمة من فضلك')
      return
    }
    if (!selectedDate?.trim()) {
      toast.error('اختر التاريخ من فضلك')
      return
    }
    if (!selectedTime?.trim()) {
      toast.error('اختر الموعد من فضلك')
      return
    }
    if (!customerName?.trim()) {
      toast.error('أدخل اسمك من فضلك')
      return
    }
    if (!customerPhone?.trim()) {
      toast.error('أدخل رقم الهاتف من فضلك')
      return
    }

    // Check if booking date is within next 7 days (Egypt timezone)
    try {
      const egyptNow = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' })
      const selectedDateObj = new Date(selectedDate + 'T00:00:00')
      const egyptTodayObj = new Date(egyptNow + 'T00:00:00')
      const sevenDaysLater = new Date(egyptTodayObj)
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
      
      if (selectedDateObj > sevenDaysLater) {
        toast.error('❌ يمكنك الحجز فقط لمدة أسبوع قدماً كحد أقصى')
        return
      }
    } catch (err) {
      console.error('Error checking date range:', err)
    }

    // Check if time is in the past
    if (isPastTime(selectedTime, selectedDate)) {
      toast.error('❌ لا يمكن الحجز في وقت مضى - اختر وقت في المستقبل')
      return
    }

    // Check if time is already booked
    if (bookedSlots.includes(selectedTime)) {
      toast.error('❌ هذا المعاد محجوز بالفعل - اختر معاد آخر')
      return
    }

    // Check if time is within working hours
    if (workingHours.length > 0) {
      const hours = workingHours[0]
      if (!hours.is_working) {
        toast.error('❌ الحلاق غير متاح في هذا اليوم')
        return
      }
      if (!availableSlots.includes(selectedTime)) {
        toast.error('❌ هذا الوقت خارج أوقات عمل الحلاق')
        return
      }
    }

    // Show confirmation modal instead of submitting directly
    const normalizedPhone = normalizePhone(customerPhone)
    
    // Validate phone number is exactly 11 digits
    const phoneDigitsOnly = normalizedPhone.replace(/\D/g, '')
    if (phoneDigitsOnly.length !== 11) {
      toast.error('❌ رقم الهاتف يجب أن يكون 11 رقم (مثال: 01050123456)')
      return
    }
    
    // Get barber and service names - with fallback
    const barberData = barbers.find(b => b.id === selectedBarber)
    const serviceData = services.find(s => s.id === selectedService)
    
    console.log('🔍 Selected Barber ID:', selectedBarber)
    console.log('🔍 Available Barbers:', barbers.map(b => ({ id: b.id, name: b.name })))
    console.log('🔍 Matched Barber Data:', barberData)
    console.log('🔍 Selected Service ID:', selectedService)
    console.log('🔍 Available Services:', services.map(s => ({ id: s.id, name_ar: s.name_ar })))
    console.log('🔍 Matched Service Data:', serviceData)
    
    // Normalize the selected time to HH:MM format
    const normalizeTimeHelper = (time: string): string => {
      const parts = time.split(':')
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}` // Return only HH:MM
      }
      return time
    }
    
    const booking = {
      barber_id: selectedBarber,
      service_id: selectedService,
      barber_name: barberData?.name || selectedBarber + ' (ID)',  // Show ID if name missing
      service_name: serviceData?.name_ar || serviceData?.namear || selectedService + ' (Service)',  // Show ID if name missing
      service_price: serviceData?.price || 0,
      service_duration: serviceData?.duration_minutes || 0,
      customer_name: customerName.trim(),
      customer_phone: normalizedPhone,
      booking_date: selectedDate,
      booking_time: normalizeTimeHelper(selectedTime), // Normalize to HH:MM format
      status: 'pending',
      notes: notes?.trim() || null,
    }

    console.log('📋 Pending Booking:', booking)
    setPendingBooking(booking)
    setShowConfirmation(true)
    setConfirmationStep('confirm')
  }

  const handleConfirmBooking = async () => {
    if (!pendingBooking) return

    // Validate that barber and service IDs are valid UUIDs
    if (!pendingBooking.barber_id || pendingBooking.barber_id.length === 0) {
      toast.error('❌ اختر حلاق من فضلك')
      setConfirmationStep('confirm')
      return
    }

    if (!pendingBooking.service_id || pendingBooking.service_id.length === 0) {
      toast.error('❌ اختر خدمة من فضلك')
      setConfirmationStep('confirm')
      return
    }

    // Double check that the barber exists
    const selectedBarberData = barbers.find(b => b.id === pendingBooking.barber_id)
    if (!selectedBarberData) {
      toast.error('❌ الحلاق المختار غير صحيح - اختر حلاق آخر')
      setConfirmationStep('confirm')
      return
    }

    // Double check that the service exists
    const selectedServiceData = services.find(s => s.id === pendingBooking.service_id)
    if (!selectedServiceData) {
      toast.error('❌ الخدمة المختارة غير صحيحة - اختر خدمة أخرى')
      setConfirmationStep('confirm')
      return
    }

    setIsConfirming(true)
    try {
      // FINAL CHECK: Make sure no one else booked this slot in the meantime
      const { data: conflictCheck, error: conflictError } = await supabase
        .from('bookings')
        .select('id')
        .eq('barber_id', pendingBooking.barber_id)
        .eq('booking_date', pendingBooking.booking_date)
        .eq('booking_time', pendingBooking.booking_time)
        .in('status', ['pending', 'confirmed'])
        .limit(1)

      if (conflictError) {
        console.error('Conflict check error:', conflictError)
        throw conflictError
      }

      if (conflictCheck && conflictCheck.length > 0) {
        toast.error('❌ آسف! تم حجز هذا الوقت للتو من قبل عميل آخر. اختر وقت آخر.')
        setConfirmationStep('confirm')
        setIsConfirming(false)
        // Note: Booked slots will be refreshed in 3 seconds by the interval
        return
      }

      // Extract all required fields for the bookings table
      const bookingData = {
        barber_id: pendingBooking.barber_id,
        barber_name: pendingBooking.barber_name, // Save barber name for display
        service_id: pendingBooking.service_id,
        service_name: pendingBooking.service_name, // Save service name for display
        client_name: pendingBooking.customer_name,
        client_phone: pendingBooking.customer_phone,
        booking_date: pendingBooking.booking_date,
        booking_time: pendingBooking.booking_time,
        status: pendingBooking.status,
        queue_number: 0, // Will be calculated by Main App
        notes: pendingBooking.notes,
      }

      const { error } = await supabase.from('bookings').insert([bookingData])

      if (error) {
        console.error('❌ Supabase error details:', error)
        throw error
      }

      console.log('✅ Booking successfully inserted into database:', bookingData)
      toast.success('تم إرسال الحجز بنجاح! ✅')

      // Show success state
      setConfirmationStep('success')
    } catch (err: any) {
      console.error('❌ Booking error full details:', err)
      console.error('Error code:', err.code)
      console.error('Error message:', err.message)
      console.error('Error details:', err.details)
      
      if (err.message?.includes('uuid')) {
        toast.error('❌ خطأ في البيانات - تأكد من اختيار الحلاق والخدمة')
      } else if (err.code === '22P02') {
        toast.error('❌ صيغة بيانات غير صحيحة - حاول مرة أخرى')
      } else if (err.message?.includes('service_id')) {
        toast.error('❌ اختر خدمة قبل الحجز من فضلك')
      } else if (err.message?.includes('barber_id')) {
        toast.error('❌ اختر حلاق قبل الحجز من فضلك')
      } else {
        toast.error('❌ حدث خطأ: ' + (err.message || 'حاول مرة أخرى'))
      }
      
      setConfirmationStep('confirm')
    } finally {
      setIsConfirming(false)
    }
  }

  const handleEditBooking = () => {
    setShowConfirmation(false)
    setPendingBooking(null)
    setConfirmationStep('confirm')
  }

  const handleCancelBooking = () => {
    setShowConfirmation(false)
    setPendingBooking(null)
    setConfirmationStep('confirm')
  }

  const handleBackdropClick = (e: React.MouseEvent): void => {
    // Don't close if clicking the modal itself
    if (e.target === e.currentTarget) {
      // Don't close during confirmation or success
      if (!isConfirming && confirmationStep !== 'success') {
        handleEditBooking()
      }
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <img src="/logo.png" alt="Amr Salah" className="h-40 md:h-64 mx-auto mb-4 object-contain" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{t('booking.title')}</h1>
          <p className="text-xl text-slate-300">{t('booking.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 space-y-6">
          {/* Barber Selection - Auto-selected */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">{t('booking.selectBarber')}</label>
            <select
              value={selectedBarber}
              onChange={(e) => setSelectedBarber(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors"
              dir={isArabic ? 'rtl' : 'ltr'}
            >
              <option value="">{t('booking.selectBarber')}</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
          </div>

          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">{t('booking.selectService')}</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors"
              dir={isArabic ? 'rtl' : 'ltr'}
            >
              <option value="">اختر الخدمة</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name_ar || service.namear} - {service.price} ج.م ({service.duration_minutes} دقيقة)
                </option>
              ))}
            </select>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">{t('booking.selectDate')}</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Time Slots Grid */}
          {selectedDate && (
            <div>
              {/* Working Hours Display */}
              {workingHours.length > 0 && workingHours[0]?.is_working ? (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                  <p className="text-blue-300 text-sm">
                    ⏰ ساعات عمل الحلاق:
                    <span className="font-bold"> {formatTime12HourArabic(workingHours[0].start_time)} - {formatTime12HourArabic(workingHours[0].end_time)}</span>
                  </p>
                </div>
              ) : null}

              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-slate-200">{t('bookingAdvanced.availableSlots')}</label>
                <button
                  type="button"
                  onClick={() => {
                    const nearest = availableSlots.find(slot => 
                      !bookedSlots.includes(slot) && !isPastTime(slot, selectedDate)
                    )
                    if (!nearest) {
                      toast.error('لا توجد مواعيد متاحة اليوم')
                    } else {
                      setSelectedTime(nearest)
                      toast.success(`تم اختيار أقرب موعد: ${nearest}`)
                    }
                  }}
                  className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors flex items-center gap-1"
                >
                  <Clock size={14} />
                  {t('bookingAdvanced.smartSelection')}
                </button>
              </div>

              {availableSlots.length === 0 && workingHours.length > 0 && !workingHours[0]?.is_working && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-300 mb-4">
                  ⚠️ الحلاق غير متاح في هذا اليوم
                </div>
              )}

              <div className="grid grid-cols-4 gap-2 mb-4">
                {generateTimeSlots(getOpeningHour(), getClosingHour()).length > 0 ? (
                  generateTimeSlots(getOpeningHour(), getClosingHour()).map((slot) => {
                    const isBooked = bookedSlots.includes(slot)
                    const isPast = isPastTime(slot, selectedDate)
                    const isOutsideWorkingHours = !availableSlots.includes(slot)
                    const isSelected = selectedTime === slot
                    const isDisabled = isBooked || isPast || isOutsideWorkingHours
                    const displayTime = formatTime12Hour(slot)

                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => !isDisabled && setSelectedTime(slot)}
                        disabled={isDisabled}
                        className={`py-3 px-2 rounded-lg font-semibold text-sm transition-all ${
                          isBooked
                            ? 'bg-red-500/30 border border-red-500 text-red-300 cursor-not-allowed opacity-50'
                            : isPast
                            ? 'bg-gray-500/30 border border-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                            : isOutsideWorkingHours
                            ? 'bg-slate-900/50 border border-slate-700 text-slate-500 cursor-not-allowed opacity-30'
                            : isSelected
                            ? 'bg-gold-500 border border-gold-600 text-white shadow-lg'
                            : 'bg-slate-700 border border-slate-600 text-slate-200 hover:bg-slate-600 hover:border-slate-500'
                        }`}
                        title={
                          isBooked ? 'محجوز' : 
                          isPast ? 'وقت مضى' : 
                          isOutsideWorkingHours ? 'خارج ساعات العمل' : 
                          'متاح'
                        }
                      >
                        {displayTime}
                        {isBooked && <span className="text-xs block">محجوز</span>}
                        {isPast && <span className="text-xs block">مضى</span>}
                        {isOutsideWorkingHours && !isBooked && !isPast && <span className="text-xs block opacity-50">مغلق</span>}
                      </button>
                    )
                  })
                ) : (
                  <div className="col-span-4 text-center text-slate-400 p-4">
                    لا توجد مواعيد متاحة
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-400 text-center">
                {t('bookingAdvanced.selectFromGrid')}
              </p>
            </div>
          )}

          {/* Phone Warning */}
          {existingBooking && (
            <div className="bg-amber-500/20 border border-amber-500 rounded-lg p-4 flex gap-3">
              <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-amber-100 text-sm">
                <p className="font-semibold mb-1">⚠️ هذا الرقم محجوز بالفعل في</p>
                <p>
                  <strong>{new Date(existingBooking.booking_date + 'T00:00:00').toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong> في الساعة <strong>{formatTime12HourArabic(existingBooking.booking_time)}</strong>
                </p>
                <p className="text-xs text-amber-200 mt-2">تم حفظ الحجز مسبقاً</p>
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">{t('booking.yourName')}</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t('booking.yourName')}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-gold-500 transition-colors"
                dir={isArabic ? 'rtl' : 'ltr'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">{t('booking.yourPhone')}</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="01050123456 أو 201050123456"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-gold-500 transition-colors"
                dir="ltr"
              />
              <p className="text-xs text-slate-400 mt-1">الصيغ المقبولة: 01XXXXXXXXX أو 201XXXXXXXXX</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">{t('booking.notes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('booking.notes')}
              rows={3}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-gold-500 transition-colors resize-none"
              dir={isArabic ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedTime}
            className="w-full px-6 py-3 bg-gold-500 hover:bg-gold-600 disabled:bg-gold-700 text-white rounded-lg font-semibold transition-colors"
          >
            {t('booking.book')}
          </button>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4" onClick={handleBackdropClick}>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            {confirmationStep === 'confirm' ? (
              <>
                {/* Confirmation Header */}
                <div className="bg-gradient-to-r from-gold-500 to-gold-600 px-4 md:px-8 py-4 md:py-6 text-white rounded-t-xl sticky top-0 z-10">
                  <h2 className="text-2xl md:text-3xl font-bold">تأكيد الحجز</h2>
                  <p className="text-gold-100 mt-1 text-sm md:text-base">تأكد من البيانات قبل الحجز</p>
                </div>

                {/* Booking Details */}
                <div className="px-4 md:px-8 py-6 md:py-8 space-y-4 md:space-y-6">
                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                    {/* Customer Name */}
                    <div className="bg-slate-700/50 rounded-lg p-3 md:p-4 border border-slate-600/50">
                      <p className="text-slate-400 text-xs md:text-sm mb-2">الاسم</p>
                      <p className="text-white text-base md:text-lg font-semibold truncate">{pendingBooking?.customer_name}</p>
                    </div>

                    {/* Phone */}
                    <div className="bg-slate-700/50 rounded-lg p-3 md:p-4 border border-slate-600/50">
                      <p className="text-slate-400 text-xs md:text-sm mb-2">رقم الهاتف</p>
                      <p className="text-white text-base md:text-lg font-semibold font-mono text-center">{pendingBooking?.customer_phone}</p>
                      <p className="text-slate-500 text-xs mt-2 text-center">الصيغ المقبولة: 01XXXXXXXXX</p>
                    </div>

                    {/* Barber */}
                    <div className="bg-slate-700/50 rounded-lg p-3 md:p-4 border border-slate-600/50">
                      <p className="text-slate-400 text-xs md:text-sm mb-2">الحلاق</p>
                      <p className="text-white text-base md:text-lg font-semibold truncate">
                        {pendingBooking?.barber_name || 'جاري التحميل...'}
                      </p>
                    </div>

                    {/* Service */}
                    <div className="bg-slate-700/50 rounded-lg p-3 md:p-4 border border-slate-600/50">
                      <p className="text-slate-400 text-xs md:text-sm mb-2">الخدمة</p>
                      <div>
                        <p className="text-white text-base md:text-lg font-semibold truncate">
                          {pendingBooking?.service_name || 'جاري التحميل...'}
                        </p>
                        <p className="text-slate-300 text-xs mt-1">
                          ⏱️ {pendingBooking?.service_duration} دقيقة
                        </p>
                        <p className="text-gold-400 text-sm mt-1 font-semibold">
                          {pendingBooking?.service_price} ج.م
                        </p>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="bg-slate-700/50 rounded-lg p-3 md:p-4 border border-slate-600/50">
                      <p className="text-slate-400 text-xs md:text-sm mb-2">التاريخ</p>
                      <p className="text-white text-sm md:text-lg font-semibold">{formatDateArabic(pendingBooking?.booking_date || '')}</p>
                    </div>

                    {/* Time */}
                    <div className="bg-slate-700/50 rounded-lg p-3 md:p-4 border border-slate-600/50">
                      <p className="text-slate-400 text-xs md:text-sm mb-2">الوقت</p>
                      <p className="text-white text-xl md:text-2xl font-semibold text-center">{formatTime12HourArabic(pendingBooking?.booking_time || '')}</p>
                    </div>
                  </div>

                  {/* Notes if exists */}
                  {pendingBooking?.notes && (
                    <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-3 md:p-4">
                      <p className="text-blue-300 text-xs md:text-sm mb-2">ملاحظاتك</p>
                      <p className="text-blue-100 text-xs md:text-sm">{pendingBooking.notes}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="px-4 md:px-8 py-4 md:py-6 bg-slate-800/50 border-t border-slate-700 flex flex-col md:flex-row gap-2 md:gap-4 rounded-b-xl">
                  {/* Cancel Button - Red */}
                  <button
                    onClick={handleCancelBooking}
                    disabled={isConfirming}
                    className="flex-1 px-3 md:px-6 py-2 md:py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-300 rounded-lg text-xs md:text-sm font-semibold transition-colors disabled:opacity-50 order-3 md:order-1"
                  >
                    إلغاء
                  </button>

                  {/* Edit Button - Blue */}
                  <button
                    onClick={handleEditBooking}
                    disabled={isConfirming}
                    className="flex-1 px-3 md:px-6 py-2 md:py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500 text-blue-300 rounded-lg text-xs md:text-sm font-semibold transition-colors disabled:opacity-50 order-2 md:order-2"
                  >
                    تعديل
                  </button>

                  {/* Confirm Button - Green */}
                  <button
                    onClick={handleConfirmBooking}
                    disabled={isConfirming}
                    className="flex-1 px-3 md:px-6 py-2 md:py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-700 text-white rounded-lg text-xs md:text-sm font-semibold transition-colors flex items-center justify-center gap-1 md:gap-2 order-1 md:order-3"
                  >
                    {isConfirming ? 'جاري...' : '✓ تأكيد الحجز'}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="px-4 md:px-8 py-8 md:py-12 flex flex-col items-center justify-center text-center">
                  {/* Success Icon with Animation */}
                  <div className="mb-4 md:mb-6 relative">
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse blur-lg"></div>
                    <CheckCircle2 size={60} className="text-green-400 relative animate-bounce md:w-20 md:h-20" />
                  </div>

                  {/* Success Message */}
                  <h3 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3">تم الحجز بنجاح! 🎉</h3>
                  <p className="text-lg md:text-xl text-slate-300 mb-4">حجزك في الانتظار - يرجى أخذ لقطة شاشة</p>
                  <div className="bg-amber-500/20 border-2 border-amber-500 rounded-lg p-4 md:p-6 mb-6 max-w-md w-full">
                    <p className="text-amber-300 text-sm md:text-base font-semibold">⚠️ هام جداً</p>
                    <p className="text-amber-100 text-xs md:text-sm mt-2">
                      يرجى أخذ <strong>لقطة شاشة (Screenshot)</strong> لهذه الرسالة كإثبات للحجز قبل الإغلاق
                    </p>
                    <p className="text-amber-200 text-xs mt-2">
                      سيتم التحقق من الحجز من قبل صاحب المحل خلال 24 ساعة
                    </p>
                  </div>
                  <p className="text-sm md:text-base text-slate-400">سنتواصل معك على الرقم {pendingBooking?.customer_phone}</p>

                  {/* Booking Summary */}
                  <div className="mt-6 md:mt-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4 md:p-6 w-full">
                    <p className="text-green-300 text-xs md:text-sm mb-3 font-semibold">📋 بيانات الحجز</p>
                    <div className="space-y-1 md:space-y-2 text-right text-xs md:text-sm">
                      <p className="text-slate-200">
                        <span className="text-slate-400">الحلاق:</span> {pendingBooking?.barber_name}
                      </p>
                      <p className="text-slate-200">
                        <span className="text-slate-400">الخدمة:</span> {pendingBooking?.service_name}
                      </p>
                      <p className="text-slate-200">
                        <span className="text-slate-400">السعر:</span> <span className="text-gold-400 font-semibold">{pendingBooking?.service_price} ج.م</span>
                      </p>
                      <p className="text-slate-200">
                        <span className="text-slate-400">المدة:</span> {pendingBooking?.service_duration} دقيقة
                      </p>
                      <p className="text-slate-200">
                        <span className="text-slate-400">التاريخ والوقت:</span> {formatDateArabic(pendingBooking?.booking_date || '')} - {formatTime12HourArabic(pendingBooking?.booking_time || '')}
                      </p>
                      <p className="text-slate-200">
                        <span className="text-slate-400">رقم الهاتف:</span> {pendingBooking?.customer_phone}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-2 md:gap-3">
                      <button
                        onClick={() => {
                          const referenceText = `الحجز: ${pendingBooking?.barber_name} - ${pendingBooking?.service_name} - ${formatDateArabic(pendingBooking?.booking_date || '')} - ${formatTime12HourArabic(pendingBooking?.booking_time || '')}`
                          navigator.clipboard.writeText(referenceText)
                          toast.success('✅ تم نسخ بيانات الحجز')
                        }}
                        className="flex-1 px-3 py-2 bg-blue-500/30 hover:bg-blue-500/50 border border-blue-500 text-blue-300 rounded-lg text-xs font-semibold transition-colors"
                      >
                        📋 نسخ البيانات
                      </button>
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: 'حجزي في المحل',
                              text: `الخدمة: ${pendingBooking?.service_name} | الوقت: ${formatTime12HourArabic(pendingBooking?.booking_time || '')}`
                            })
                          } else {
                            toast.success('حفظ الرسالة الظاهرة كصورة 📸')
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-purple-500/30 hover:bg-purple-500/50 border border-purple-500 text-purple-300 rounded-lg text-xs font-semibold transition-colors"
                      >
                        📸 مشاركة
                      </button>
                    </div>
                  </div>

                  {/* Closing text */}
                  <div className="mt-6 md:mt-8 text-center">
                    <p className="text-slate-300 text-xs md:text-sm mb-4">
                      ✅ سيتم إغلاق هذه النافذة تلقائياً خلال...
                    </p>
                    <div className="inline-block bg-gold-500/20 border-2 border-gold-500 rounded-full px-4 md:px-6 py-2 md:py-3">
                      <p className="text-gold-400 text-2xl md:text-3xl font-bold">{closingCountdown}</p>
                    </div>
                    <p className="text-slate-400 text-xs mt-2 md:mt-4">الرجاء الانتظار</p>
                  </div>

                  {/* Developer Footer Info */}
                  <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-slate-700 text-center w-full">
                    <p className="text-xs text-slate-500">
                      © تطوير بواسطة <span className="text-slate-400 font-semibold">Youssef & Mohamed</span>
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      للتواصل: <span className="text-slate-500 font-mono">01000139417</span>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
