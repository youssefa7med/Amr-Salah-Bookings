import { useState, useEffect, useCallback } from 'react'
import { supabase, Barber } from '../db/supabase'

export const useBarbers = () => {
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBarbers = useCallback(async () => {
    try {
      setLoading(true)
      console.log('Fetching barbers...')
      
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) throw error
      
      console.log('Barbers fetched:', data?.length || 0)
      setBarbers(data || [])
      setError(null)
    } catch (err: any) {
      console.error('Error fetching barbers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBarbers()
  }, [fetchBarbers])

  return { barbers, loading, error }
}
