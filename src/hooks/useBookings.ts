import { useState, useCallback } from 'react'
import { supabase, Booking } from '../db/supabase'
import toast from 'react-hot-toast'

export const useBookings = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createBooking = useCallback(async (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'queue_number'>) => {
    try {
      setLoading(true)
      console.log('Creating booking...', booking)

      // Calculate queue number (count existing bookings for the same barber on that day)
      const bookingDate = new Date(booking.booking_time).toLocaleDateString('en-CA')
      
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('queue_number')
        .eq('barber_id', booking.barber_id)
        .gte('booking_time', `${bookingDate}T00:00:00`)
        .lte('booking_time', `${bookingDate}T23:59:59`)
        .in('status', ['pending', 'confirmed'])

      const queueNumber = (existingBookings?.length || 0) + 1

      const newBooking = {
        ...booking,
        queue_number: queueNumber,
        status: 'pending' as const,
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert(newBooking as any)
        .select()

      if (error) throw error

      toast.success('تم حجز الموعد بنجاح! ✓')
      console.log('Booking created:', data?.[0])
      
      setError(null)
      return data?.[0]
    } catch (err: any) {
      console.error('Error creating booking:', err)
      const errorMsg = err.message || 'خطأ في حجز الموعد'
      setError(errorMsg)
      toast.error(errorMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getAvailableSlots = useCallback(async (barberId: string, bookingDate: string) => {
    try {
      // Get all bookings for that barber on that day
      const { data: bookings } = await supabase
        .from('bookings')
        .select('booking_time, duration')
        .eq('barber_id', barberId)
        .gte('booking_time', `${bookingDate}T00:00:00`)
        .lte('booking_time', `${bookingDate}T23:59:59`)
        .in('status', ['pending', 'confirmed'])

      // Business hours: 9 AM to 8 PM, 1-hour slots
      const slots = []
      for (let hour = 9; hour < 20; hour++) {
        const timeStr = `${String(hour).padStart(2, '0')}:00`
        const slotTime = new Date(`${bookingDate}T${timeStr}:00`).getTime()

        // Check if slot is available (1-hour duration)
        const isBooked = bookings?.some(b => {
          const bookingStart = new Date(b.booking_time).getTime()
          const bookingEnd = bookingStart + (b.duration || 60) * 60000
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

  return { createBooking, getAvailableSlots, loading, error }
}
