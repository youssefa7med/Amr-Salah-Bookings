import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader, CheckCircle } from 'lucide-react'
import Logo from '../components/Logo'

interface BookingConfirmationProps {
  bookingData: {
    date: string
    barberId: string
    barberName: string
    time: string
    clientName: string
    clientPhone: string
  }
  onConfirm: (bookingId: string) => void
}

export default function BookingConfirmation({ bookingData, onConfirm }: BookingConfirmationProps) {
  const { t } = useTranslation()
  const [bookingCreated, setBookingCreated] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const loading = false

  const handleConfirm = async () => {
    try {
      // Note: Booking is now created directly in BookingPage
      // This is a legacy component kept for reference
      setBookingCreated(true)
      setBookingId('booking-123')
      onConfirm('booking-123')
    } catch (err) {
      console.error('Error confirming booking:', err)
    }
  }

  if (bookingCreated && bookingId) {
    return (
      <div className="text-center py-12">
        <Logo size="lg" className="mx-auto mb-6" />
        <CheckCircle className="mx-auto mb-4 text-green-600" size={64} />
        <h3 className="text-2xl font-bold text-gray-800 mb-4">{t('booking.success')}</h3>
        <div className="bg-green-50 p-6 rounded-lg mb-6 space-y-2 text-right">
          <p className="text-gray-700"><strong>الاسم:</strong> {bookingData.clientName}</p>
          <p className="text-gray-700"><strong>الهاتف:</strong> {bookingData.clientPhone}</p>
          <p className="text-gray-700"><strong>الحلاق:</strong> {bookingData.barberName}</p>
          <p className="text-gray-700"><strong>التاريخ:</strong> {new Date(bookingData.date).toLocaleDateString('ar-EG')}</p>
          <p className="text-gray-700"><strong>الوقت:</strong> {bookingData.time}</p>
          <p className="text-blue-600 font-bold mt-4"><strong>كود الحجز:</strong> {bookingId}</p>
        </div>
        <p className="text-gray-600 mb-6">سيتم التواصل معك قريباً لتأكيد الحجز</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          احجز موعد آخر
        </button>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-bold mb-6 text-gray-800">تأكيد الحجز</h3>
      
      <div className="bg-gray-50 p-6 rounded-lg mb-6 space-y-3 text-right">
        <div className="flex justify-between">
          <span className="text-gray-600">الاسم:</span>
          <span className="font-medium">{bookingData.clientName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">الهاتف:</span>
          <span className="font-medium">{bookingData.clientPhone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">الحلاق:</span>
          <span className="font-medium">{bookingData.barberName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">التاريخ:</span>
          <span className="font-medium">{new Date(bookingData.date).toLocaleDateString('ar-EG')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">الوقت:</span>
          <span className="font-medium">{bookingData.time}</span>
        </div>
      </div>

      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Loader className="animate-spin" size={20} />}
        تأكيد الحجز النهائي
      </button>
    </div>
  )
}
