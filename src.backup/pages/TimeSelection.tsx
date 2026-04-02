import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader } from 'lucide-react'
import { useBookings } from '../hooks/useBookings'

interface TimeSelectionProps {
  barberId: string
  date: string
  onSelectTime: (time: string) => void
}

export default function TimeSelection({ barberId, date, onSelectTime }: TimeSelectionProps) {
  const { t } = useTranslation()
  const { getAvailableSlots, loading } = useBookings()
  const [slots, setSlots] = useState<string[]>([])

  useEffect(() => {
    const fetchSlots = async () => {
      const available = await getAvailableSlots(barberId, date)
      setSlots(available)
    }
    fetchSlots()
  }, [barberId, date, getAvailableSlots])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-purple-600" size={32} />
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 font-medium">لا توجد أوقات متاحة في هذا اليوم</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-bold mb-4 text-gray-800">{t('booking.selectTime')}</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {slots.map(slot => (
          <button
            key={slot}
            onClick={() => onSelectTime(slot)}
            className="p-3 border-2 border-gray-200 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition font-medium text-gray-800"
          >
            🕐 {slot}
          </button>
        ))}
      </div>
    </div>
  )
}
