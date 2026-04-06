import { useState, useEffect, useCallback } from 'react'
import { supabase, Settings } from '../db/supabase'

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      console.log('Fetching settings from database...')

      const { data, error: err } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single()

      if (err) {
        if (err.code === 'PGRST116') {
          // No settings found, use defaults
          console.log('No settings found, using defaults')
          setSettings({
            id: 'default',
            shop_name: 'Amr Salah Barber Shop',
            opening_time: '09:00:00',
            closing_time: '20:00:00',
            currency: 'EGP',
            language: 'ar',
            theme: 'dark',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        } else {
          throw err
        }
      } else {
        console.log('✅ Settings fetched:', data)
        setSettings(data)
      }

      setError(null)
    } catch (err: any) {
      console.error('Error fetching settings:', err)
      setError(err.message)
      // Use defaults on error
      setSettings({
        id: 'default',
        shop_name: 'Amr Salah Barber Shop',
        opening_time: '09:00:00',
        closing_time: '20:00:00',
        currency: 'EGP',
        language: 'ar',
        theme: 'dark',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Extract opening and closing hours as numbers
  const getOpeningHour = () => {
    if (!settings?.opening_time) return 9
    const [hours] = settings.opening_time.split(':').map(Number)
    return hours
  }

  const getClosingHour = () => {
    if (!settings?.closing_time) return 20
    const [hours] = settings.closing_time.split(':').map(Number)
    return hours
  }

  return {
    settings,
    loading,
    error,
    getOpeningHour,
    getClosingHour,
    fetchSettings,
  }
}
