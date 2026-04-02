import { useTranslation } from 'react-i18next'
import { Loader } from 'lucide-react'
import { useBarbers } from '../hooks/useBarbers'

interface BarberSelectionProps {
  onSelectBarber: (barberId: string, barberName: string) => void
}

export default function BarberSelection({ onSelectBarber }: BarberSelectionProps) {
  const { t } = useTranslation()
  const { barbers, loading, error } = useBarbers()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-purple-600" size={32} />
      </div>
    )
  }

  if (error || barbers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-medium">خطأ في تحميل الحلاقين</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-bold mb-4 text-gray-800">{t('booking.selectBarber')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {barbers.map(barber => (
          <button
            key={barber.id}
            onClick={() => onSelectBarber(barber.id, barber.name)}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition font-medium text-gray-800"
          >
            💈 {barber.name}
          </button>
        ))}
      </div>
    </div>
  )
}
