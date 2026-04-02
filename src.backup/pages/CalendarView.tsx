import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarViewProps {
  onSelectDate: (date: string) => void
}

export default function CalendarView({ onSelectDate }: CalendarViewProps) {
  const [date, setDate] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const handleDateClick = (day: number) => {
    const selected = new Date(date.getFullYear(), date.getMonth(), day)
    // Don't allow past dates
    if (selected > new Date()) {
      const isoDate = selected.toISOString().split('T')[0]
      onSelectDate(isoDate)
    }
  }

  const handlePrevMonth = () => {
    setDate(new Date(date.getFullYear(), date.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setDate(new Date(date.getFullYear(), date.getMonth() + 1))
  }

  const daysInMonth = getDaysInMonth(date)
  const firstDay = getFirstDayOfMonth(date)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

  return (
    <div className="max-w-sm mx-auto">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between mb-4">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-white hover:bg-opacity-20 rounded">
            <ChevronRight size={24} />
          </button>
          <h2 className="text-xl font-bold">
            {monthNamesAr[date.getMonth()]} {date.getFullYear()}
          </h2>
          <button onClick={handleNextMonth} className="p-1 hover:bg-white hover:bg-opacity-20 rounded">
            <ChevronLeft size={24} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 text-sm font-semibold">
          {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
            <div key={day} className="text-center py-2">{day[0]}</div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 border border-gray-200">
        <div className="grid grid-cols-7 gap-2">
          {Array(firstDay).fill(0).map((_, i) => (
            <div key={`empty-${i}`}></div>
          ))}

          {days.map(day => {
            const selectedDate = new Date(date.getFullYear(), date.getMonth(), day)
            const isToday = selectedDate.getTime() === today.getTime()
            const isPast = selectedDate < today
            const isWeekend = selectedDate.getDay() === 5 || selectedDate.getDay() === 6

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                disabled={isPast || isWeekend}
                className={`
                  p-2 rounded-lg font-medium text-sm transition
                  ${isPast || isWeekend
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isToday
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-purple-200'
                  }
                `}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
