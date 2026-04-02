import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, User, Clock } from 'lucide-react'
import CalendarView from './CalendarView'
import BarberSelection from './BarberSelection'
import TimeSelection from './TimeSelection'
import BookingForm from './BookingForm'
import BookingConfirmation from './BookingConfirmation'

type Step = 'date' | 'barber' | 'time' | 'form' | 'confirmation'

interface BookingData {
  date: string
  barberId: string
  barberName: string
  time: string
  clientName: string
  clientPhone: string
}

export default function BookingPage() {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState<Step>('date')
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({})

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: 'date', label: t('booking.selectDate'), icon: <Calendar size={20} /> },
    { id: 'barber', label: t('booking.selectBarber'), icon: <User size={20} /> },
    { id: 'time', label: t('booking.selectTime'), icon: <Clock size={20} /> },
    { id: 'form', label: t('booking.yourInfo'), icon: <User size={20} /> },
  ]

  const handleSelectDate = (date: string) => {
    setBookingData(prev => ({ ...prev, date }))
    setCurrentStep('barber')
  }

  const handleSelectBarber = (barberId: string, barberName: string) => {
    setBookingData(prev => ({ ...prev, barberId, barberName }))
    setCurrentStep('time')
  }

  const handleSelectTime = (time: string) => {
    setBookingData(prev => ({ ...prev, time }))
    setCurrentStep('form')
  }

  const handleSubmitForm = (name: string, phone: string) => {
    setBookingData(prev => ({ ...prev, clientName: name, clientPhone: phone }))
    setCurrentStep('confirmation')
  }

  const handleConfirmBooking = () => {
    // Booking confirmed
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="booking-container">
        <div className="booking-header">
          <h1 className="text-3xl font-bold mb-2">{t('booking.title')}</h1>
          <p className="text-purple-100">{t('booking.subtitle')}</p>
        </div>

        {/* Progress steps */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex justify-between">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 text-sm font-medium ${
                  step.id === currentStep
                    ? 'text-purple-600'
                    : bookingData[step.id as keyof BookingData]
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-current">
                  {step.icon}
                </div>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="booking-step">
          {currentStep === 'date' && (
            <CalendarView onSelectDate={handleSelectDate} />
          )}

          {currentStep === 'barber' && (
            <BarberSelection onSelectBarber={handleSelectBarber} />
          )}

          {currentStep === 'time' && bookingData.barberId && bookingData.date && (
            <TimeSelection
              barberId={bookingData.barberId}
              date={bookingData.date}
              onSelectTime={handleSelectTime}
            />
          )}

          {currentStep === 'form' && (
            <BookingForm onSubmit={handleSubmitForm} />
          )}

          {currentStep === 'confirmation' && (
            <BookingConfirmation
              bookingData={bookingData as BookingData}
              onConfirm={handleConfirmBooking}
            />
          )}
        </div>

        {/* Navigation buttons */}
        {currentStep !== 'confirmation' && currentStep !== 'date' && (
          <div className="px-6 py-4 bg-gray-50 border-t flex gap-4">
            <button
              onClick={() => {
                const stepIndex = steps.findIndex(s => s.id === currentStep)
                if (stepIndex > 0) {
                  setCurrentStep(steps[stepIndex - 1].id)
                }
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition"
            >
              {t('booking.cancel')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
