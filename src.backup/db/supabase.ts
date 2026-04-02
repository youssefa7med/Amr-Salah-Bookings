import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Barber {
  id: string
  name: string
  active: boolean
  created_at: string
  updated_at: string
  hire_date: string
}

export interface Service {
  id: string
  name: string
  name_ar: string
  duration: number
  price: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  client_id: string
  client_name: string
  client_phone: string
  barber_id: string
  barber_name: string
  service_name: string
  booking_time: string
  duration: number
  queue_number: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  notes?: string
}
