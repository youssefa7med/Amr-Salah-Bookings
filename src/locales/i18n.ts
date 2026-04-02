import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      'booking.title': 'Book Your Appointment',
      'booking.subtitle': 'Choose a date, time, and barber',
      'booking.selectDate': 'Select Date',
      'booking.selectBarber': 'Choose Barber',
      'booking.selectTime': 'Choose Time',
      'booking.yourInfo': 'Your Information',
      'booking.name': 'Full Name',
      'booking.phone': 'Phone Number',
      'booking.confirm': 'Confirm Booking',
      'booking.cancel': 'Cancel',
      'booking.success': 'Booking confirmed! ✓',
      'booking.error': 'Error booking appointment',
      'booking.queueNumber': 'Queue Number',
      'booking.estimatedTime': 'Estimated Wait Time',
      'booking.minutes': 'minutes',
    }
  },
  ar: {
    translation: {
      'booking.title': 'احجز موعدك',
      'booking.subtitle': 'اختر التاريخ والوقت والحلاق',
      'booking.selectDate': 'اختر التاريخ',
      'booking.selectBarber': 'اختر الحلاق',
      'booking.selectTime': 'اختر الوقت',
      'booking.yourInfo': 'بياناتك',
      'booking.name': 'الاسم الكامل',
      'booking.phone': 'رقم الهاتف',
      'booking.confirm': 'تأكيد الحجز',
      'booking.cancel': 'إلغاء',
      'booking.success': 'تم تأكيد الحجز! ✓',
      'booking.error': 'خطأ في حجز الموعد',
      'booking.queueNumber': 'رقم الدور',
      'booking.estimatedTime': 'وقت الانتظار المتوقع',
      'booking.minutes': 'دقيقة',
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ar',
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
