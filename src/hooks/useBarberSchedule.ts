import { useState, useEffect } from 'react'
import { supabase } from '../db/supabase'

export interface BarberSchedule {
  id?: string
  barber_id: string
  barberName?: string
  start_time: string // HH:mm format (24-hour)
  end_time: string // HH:mm format (24-hour)
  working_days: number[] // 0=Sunday, 1=Monday, ..., 6=Saturday
  break_start?: string // HH:mm format
  break_end?: string // HH:mm format
  active: boolean
  created_at?: string
  updated_at?: string
}

const DAYS_IN_ARABIC = [
  'الأحد', // Sunday
  'الاثنين', // Monday
  'الثلاثاء', // Tuesday
  'الأربعاء', // Wednesday
  'الخميس', // Thursday
  'الجمعة', // Friday
  'السبت', // Saturday
]

export const useBarberSchedule = () => {
  const [schedules, setSchedules] = useState<BarberSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      console.log('📅 Fetching barber schedules from database...')

      // Fetch schedules with barber names
      const { data, error } = await supabase
        .from('barber_schedules')
        .select(
          `
          *,
          barbers:barber_id(name)
        `
        )
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching schedules:', error.message)
        throw error
      }

      console.log('✅ Barber schedules fetched:', data?.length || 0, 'records')

      const formattedSchedules = (data || []).map((schedule: any) => {
        const formatted = {
          ...schedule,
          barberName: schedule.barbers?.name || 'Unknown Barber',
          working_days: schedule.working_days || [],
        }
        console.log(
          `  📌 Barber: ${formatted.barberName} | Hours: ${schedule.start_time}-${schedule.end_time}`
        )
        return formatted
      })

      setSchedules(formattedSchedules)
      setError(null)
    } catch (err: any) {
      const errorMsg = err.message || 'خطأ في جلب بيانات الجداول'
      setError(errorMsg)
      console.error('❌ Error fetching schedules:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()

    // Set up real-time subscription for barber_schedules table changes
    console.log('🔌 Setting up real-time barber schedules subscription...')
    const channel = supabase
      .channel('barber-schedules-channel')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'barber_schedules',
        },
        (payload) => {
          console.log('⚙️ Barber schedule changed:', payload.eventType)
          // Refetch all schedules when any change occurs
          fetchSchedules()
        }
      )
      .subscribe((status) => {
        console.log('📡 Barber schedules subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Connected to real-time barber schedules updates')
        }
      })

    // Cleanup subscription
    return () => {
      console.log('🔌 Cleaning up barber schedules subscription...')
      supabase.removeChannel(channel)
    }
  }, [])

  const getScheduleForBarber = (barberId: string): BarberSchedule | undefined => {
    const schedule = schedules.find((s) => s.barber_id === barberId)
    return schedule
  }

  const isBarberWorkingToday = (barberId: string): boolean => {
    const schedule = getScheduleForBarber(barberId)
    if (!schedule) return true // If no schedule, assume working

    const today = new Date().getDay()
    return schedule.working_days.includes(today)
  }

  const getBarberWorkingHours = (
    barberId: string
  ): { start: string; end: string } | null => {
    const schedule = getScheduleForBarber(barberId)
    if (!schedule) return null
    return {
      start: schedule.start_time,
      end: schedule.end_time,
    }
  }

  const formatTime12Hour = (time: string): string => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'م' : 'ص'
    const hour12 = hour % 12 || 12
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`
  }

  const getDaysOffArabic = (working_days: number[]): string[] => {
    const allDays = [0, 1, 2, 3, 4, 5, 6]
    const daysOff = allDays.filter((d) => !working_days.includes(d))
    return daysOff.map((d) => DAYS_IN_ARABIC[d])
  }

  const getWorkingDaysArabic = (working_days: number[]): string[] => {
    return working_days.map((d) => DAYS_IN_ARABIC[d])
  }

  return {
    schedules,
    loading,
    error,
    fetchSchedules,
    getScheduleForBarber,
    isBarberWorkingToday,
    getBarberWorkingHours,
    formatTime12Hour,
    getDaysOffArabic,
    getWorkingDaysArabic,
    DAYS_IN_ARABIC,
  }
}
