import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const bookingFormSchema = z.object({
  name: z.string().min(2, 'الاسم قصير جداً'),
  phone: z.string().regex(/^(\+2)?01[0-2,5]{1}[0-9]{8}$/, 'رقم الهاتف غير صحيح'),
})

type BookingFormData = z.infer<typeof bookingFormSchema>

interface BookingFormProps {
  onSubmit: (name: string, phone: string) => void
}

export default function BookingForm({ onSubmit }: BookingFormProps) {
  const { t } = useTranslation()
  const { register, handleSubmit, formState: { errors } } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
  })

  const onSubmitForm = (data: BookingFormData) => {
    onSubmit(data.name, data.phone)
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('booking.name')}
        </label>
        <input
          {...register('name')}
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          placeholder="أدخل اسمك الكامل"
        />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('booking.phone')}
        </label>
        <input
          {...register('phone')}
          type="tel"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          placeholder="01000000000"
        />
        {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg transition"
      >
        {t('booking.confirm')}
      </button>
    </form>
  )
}
