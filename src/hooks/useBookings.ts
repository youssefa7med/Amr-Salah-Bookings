import { useCallback } from 'react'
import { supabase } from '../db/supabase'

export const useBookings = () => {
  const getAvailableSlots = useCallback(async (barberId: string, bookingDate: string) => {
    try {
      // Get all bookings for that barber on that day
      const startOfDay = `${bookingDate}T00:00:00`
      const endOfDay = `${bookingDate}T23:59:59`
      
      const { data: bookings } = await supabase
        .from('bookings')
        .select('booking_time, duration')
        .eq('barber_id', barberId)
        .gte('booking_time', startOfDay)
        .lte('booking_time', endOfDay)
        .in('status', ['pending', 'confirmed'])

      // Business hours: 9 AM to 8 PM, 1-hour slots
      const slots = []
      for (let hour = 9; hour < 20; hour++) {
        const timeStr = `${String(hour).padStart(2, '0')}:00`
        const slotTime = new Date(`${bookingDate}T${timeStr}:00`).getTime()

        // Check if slot is available (1-hour duration)
        const isBooked = bookings?.some(b => {
          const bookingStart = new Date(b.booking_time).getTime()
          const bookingEnd = bookingStart + 60 * 60000 // 1 hour default
          return slotTime >= bookingStart && slotTime < bookingEnd
        })

        if (!isBooked) {
          slots.push(timeStr)
        }
      }

      return slots
    } catch (err: any) {
      console.error('Error getting available slots:', err)
      return []
    }
  }, [])

  return { getAvailableSlots }
}
