import { useState, useEffect } from 'react'
import { supabase, Barber } from '@/db/supabase'
import toast from 'react-hot-toast'
import { Save, Clock } from 'lucide-react'
import { formatTime12Hour } from '@/utils/formatTime'

interface WorkingHours {
  id?: string
  barber_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_working: boolean
}

const DAYS = [
  { value: 0, label: 'الأحد', labelEn: 'Sunday' },
  { value: 1, label: 'الاثنين', labelEn: 'Monday' },
  { value: 2, label: 'الثلاثاء', labelEn: 'Tuesday' },
  { value: 3, label: 'الأربعاء', labelEn: 'Wednesday' },
  { value: 4, label: 'الخميس', labelEn: 'Thursday' },
  { value: 5, label: 'الجمعة', labelEn: 'Friday' },
  { value: 6, label: 'السبت', labelEn: 'Saturday' },
]

export default function WorkingHoursPage() {
  
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [selectedBarber, setSelectedBarber] = useState<string>('')
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchBarbers()
  }, [])

  useEffect(() => {
    if (selectedBarber) {
      fetchWorkingHours()
    }
  }, [selectedBarber])

  const fetchBarbers = async () => {
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('is_active', true)

      if (error) throw error
      setBarbers(data || [])
      if (data && data.length > 0) {
        setSelectedBarber(data[0].id)
      }
    } catch (err: any) {
      console.error('Error fetching barbers:', err)
      toast.error('خطأ في تحميل الحلاقين')
    }
  }

  const fetchWorkingHours = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('working_hours')
        .select('*')
        .eq('barber_id', selectedBarber)
        .order('day_of_week', { ascending: true })

      if (error) throw error

      // Create entries for all 7 days if they don't exist
      const hoursMap = new Map()
      ;(data || []).forEach(h => {
        hoursMap.set(h.day_of_week, h)
      })

      const allDaysHours: WorkingHours[] = DAYS.map(day => {
        const existing = hoursMap.get(day.value)
        return existing || {
          barber_id: selectedBarber,
          day_of_week: day.value,
          start_time: '09:00',
          end_time: '18:00',
          is_working: true,
        }
      })

      setWorkingHours(allDaysHours)
    } catch (err: any) {
      console.error('Error fetching working hours:', err)
      toast.error('خطأ في تحميل أوقات العمل')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateHours = (dayIndex: number, field: string, value: any) => {
    const updated = [...workingHours]
    updated[dayIndex] = {
      ...updated[dayIndex],
      [field]: value,
    }
    setWorkingHours(updated)
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      for (const hours of workingHours) {
        if (hours.id) {
          // Update
          const { error } = await supabase
            .from('working_hours')
            .update({
              start_time: hours.start_time,
              end_time: hours.end_time,
              is_working: hours.is_working,
            })
            .eq('id', hours.id)

          if (error) throw error
        } else {
          // Insert
          const { error } = await supabase
            .from('working_hours')
            .insert([{
              barber_id: hours.barber_id,
              day_of_week: hours.day_of_week,
              start_time: hours.start_time,
              end_time: hours.end_time,
              is_working: hours.is_working,
            }])

          if (error) throw error
        }
      }

      toast.success('✅ تم حفظ أوقات العمل بنجاح')
    } catch (err: any) {
      console.error('Error saving working hours:', err)
      toast.error('❌ خطأ في حفظ البيانات: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Clock size={40} className="text-gold-500" />
            أوقات العمل
          </h1>
          <p className="text-xl text-slate-300">عدّل أوقات العمل لكل حلاق وكل يوم</p>
        </div>

        {/* Barber Selection */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-8">
          <label className="block text-sm font-medium text-slate-200 mb-2">اختر الحلاق</label>
          <select
            value={selectedBarber}
            onChange={(e) => setSelectedBarber(e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors"
            dir="rtl"
          >
            {barbers.map((barber) => (
              <option key={barber.id} value={barber.id}>
                {barber.name}
              </option>
            ))}
          </select>
        </div>

        {/* Working Hours Grid */}
        {!loading && selectedBarber ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 space-y-6">
            {workingHours.map((hours, dayIndex) => {
              const dayInfo = DAYS[dayIndex]
              return (
                <div key={dayIndex} className="border border-slate-600 rounded-lg p-4 bg-slate-700/30">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Day Name */}
                    <div>
                      <p className="text-slate-400 text-sm mb-2">اليوم</p>
                      <p className="text-white font-semibold text-lg">{dayInfo.label}</p>
                    </div>

                    {/* Working Status */}
                    <div>
                      <p className="text-slate-400 text-sm mb-2">يعمل؟</p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hours.is_working}
                          onChange={(e) =>
                            handleUpdateHours(dayIndex, 'is_working', e.target.checked)
                          }
                          className="w-5 h-5 rounded"
                        />
                        <span className="text-white">
                          {hours.is_working ? '✅ نعم' : '❌ إجازة'}
                        </span>
                      </label>
                    </div>

                    {/* Start Time */}
                    {hours.is_working && (
                      <>
                        <div>
                          <p className="text-slate-400 text-sm mb-2">من</p>
                          <input
                            type="time"
                            value={hours.start_time}
                            onChange={(e) =>
                              handleUpdateHours(dayIndex, 'start_time', e.target.value)
                            }
                            className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:border-gold-500"
                          />
                          <p className="text-gold-400 text-xs mt-1">{formatTime12Hour(hours.start_time)}</p>
                        </div>

                        {/* End Time */}
                        <div>
                          <p className="text-slate-400 text-sm mb-2">إلى</p>
                          <input
                            type="time"
                            value={hours.end_time}
                            onChange={(e) =>
                              handleUpdateHours(dayIndex, 'end_time', e.target.value)
                            }
                            className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:border-gold-500"
                          />
                          <p className="text-gold-400 text-xs mt-1">{formatTime12Hour(hours.end_time)}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-3 bg-gold-500 hover:bg-gold-600 disabled:bg-gold-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-lg"
            >
              <Save size={20} />
              {saving ? 'جاري الحفظ...' : 'حفظ أوقات العمل'}
            </button>
          </div>
        ) : (
          <div className="text-center text-slate-400">جاري التحميل...</div>
        )}
      </div>
    </main>
  )
}
