import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase credentials not found in .env.local')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Type definitions
export interface Barber {
  id: string
  name: string
  phone: string
  email?: string
  bio?: string
  avatar_url?: string
  is_active: boolean
  specialties: string[]
  experience_years: number
}

export interface Service {
  id: string
  name_ar: string
  name_en: string
  namear?: string  // Database column (fallback)
  nameen?: string  // Database column (fallback)
  description_ar?: string
  description_en?: string
  price: number
  duration_minutes: number
  category: string
  is_active: boolean
}

export interface Booking {
  id: string
  barber_id: string
  barber_name?: string
  client_name: string
  client_phone: string
  booking_date: string // YYYY-MM-DD
  booking_time: string // HH:MM
  service_id?: string
  service_name?: string
  service_price?: number
  service_duration?: number
  status: 'pending' | 'confirmed' | 'completed' | 'rejected' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}

export interface WorkingHours {
  id: string
  barber_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_working: boolean
  break_start?: string
  break_end?: string
}
