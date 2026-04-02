import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import toast from 'react-hot-toast';
import { Save, Clock } from 'lucide-react';
import { formatTime12Hour } from '@/utils/formatTime';
const DAYS = [
    { value: 0, label: 'الأحد', labelEn: 'Sunday' },
    { value: 1, label: 'الاثنين', labelEn: 'Monday' },
    { value: 2, label: 'الثلاثاء', labelEn: 'Tuesday' },
    { value: 3, label: 'الأربعاء', labelEn: 'Wednesday' },
    { value: 4, label: 'الخميس', labelEn: 'Thursday' },
    { value: 5, label: 'الجمعة', labelEn: 'Friday' },
    { value: 6, label: 'السبت', labelEn: 'Saturday' },
];
export default function WorkingHoursPage() {
    const [barbers, setBarbers] = useState([]);
    const [selectedBarber, setSelectedBarber] = useState('');
    const [workingHours, setWorkingHours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        fetchBarbers();
    }, []);
    useEffect(() => {
        if (selectedBarber) {
            fetchWorkingHours();
        }
    }, [selectedBarber]);
    const fetchBarbers = async () => {
        try {
            const { data, error } = await supabase
                .from('barbers')
                .select('*')
                .eq('is_active', true);
            if (error)
                throw error;
            setBarbers(data || []);
            if (data && data.length > 0) {
                setSelectedBarber(data[0].id);
            }
        }
        catch (err) {
            console.error('Error fetching barbers:', err);
            toast.error('خطأ في تحميل الحلاقين');
        }
    };
    const fetchWorkingHours = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('working_hours')
                .select('*')
                .eq('barber_id', selectedBarber)
                .order('day_of_week', { ascending: true });
            if (error)
                throw error;
            // Create entries for all 7 days if they don't exist
            const hoursMap = new Map();
            (data || []).forEach(h => {
                hoursMap.set(h.day_of_week, h);
            });
            const allDaysHours = DAYS.map(day => {
                const existing = hoursMap.get(day.value);
                return existing || {
                    barber_id: selectedBarber,
                    day_of_week: day.value,
                    start_time: '09:00',
                    end_time: '18:00',
                    is_working: true,
                };
            });
            setWorkingHours(allDaysHours);
        }
        catch (err) {
            console.error('Error fetching working hours:', err);
            toast.error('خطأ في تحميل أوقات العمل');
        }
        finally {
            setLoading(false);
        }
    };
    const handleUpdateHours = (dayIndex, field, value) => {
        const updated = [...workingHours];
        updated[dayIndex] = {
            ...updated[dayIndex],
            [field]: value,
        };
        setWorkingHours(updated);
    };
    const handleSave = async () => {
        try {
            setSaving(true);
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
                        .eq('id', hours.id);
                    if (error)
                        throw error;
                }
                else {
                    // Insert
                    const { error } = await supabase
                        .from('working_hours')
                        .insert([{
                            barber_id: hours.barber_id,
                            day_of_week: hours.day_of_week,
                            start_time: hours.start_time,
                            end_time: hours.end_time,
                            is_working: hours.is_working,
                        }]);
                    if (error)
                        throw error;
                }
            }
            toast.success('✅ تم حفظ أوقات العمل بنجاح');
        }
        catch (err) {
            console.error('Error saving working hours:', err);
            toast.error('❌ خطأ في حفظ البيانات: ' + err.message);
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsx("main", { className: "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsxs("h1", { className: "text-4xl md:text-5xl font-bold text-white mb-2 flex items-center justify-center gap-3", children: [_jsx(Clock, { size: 40, className: "text-gold-500" }), "\u0623\u0648\u0642\u0627\u062A \u0627\u0644\u0639\u0645\u0644"] }), _jsx("p", { className: "text-xl text-slate-300", children: "\u0639\u062F\u0651\u0644 \u0623\u0648\u0642\u0627\u062A \u0627\u0644\u0639\u0645\u0644 \u0644\u0643\u0644 \u062D\u0644\u0627\u0642 \u0648\u0643\u0644 \u064A\u0648\u0645" })] }), _jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-8", children: [_jsx("label", { className: "block text-sm font-medium text-slate-200 mb-2", children: "\u0627\u062E\u062A\u0631 \u0627\u0644\u062D\u0644\u0627\u0642" }), _jsx("select", { value: selectedBarber, onChange: (e) => setSelectedBarber(e.target.value), className: "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors", dir: "rtl", children: barbers.map((barber) => (_jsx("option", { value: barber.id, children: barber.name }, barber.id))) })] }), !loading && selectedBarber ? (_jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 space-y-6", children: [workingHours.map((hours, dayIndex) => {
                            const dayInfo = DAYS[dayIndex];
                            return (_jsx("div", { className: "border border-slate-600 rounded-lg p-4 bg-slate-700/30", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm mb-2", children: "\u0627\u0644\u064A\u0648\u0645" }), _jsx("p", { className: "text-white font-semibold text-lg", children: dayInfo.label })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm mb-2", children: "\u064A\u0639\u0645\u0644\u061F" }), _jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: hours.is_working, onChange: (e) => handleUpdateHours(dayIndex, 'is_working', e.target.checked), className: "w-5 h-5 rounded" }), _jsx("span", { className: "text-white", children: hours.is_working ? '✅ نعم' : '❌ إجازة' })] })] }), hours.is_working && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm mb-2", children: "\u0645\u0646" }), _jsx("input", { type: "time", value: hours.start_time, onChange: (e) => handleUpdateHours(dayIndex, 'start_time', e.target.value), className: "w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:border-gold-500" }), _jsx("p", { className: "text-gold-400 text-xs mt-1", children: formatTime12Hour(hours.start_time) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-slate-400 text-sm mb-2", children: "\u0625\u0644\u0649" }), _jsx("input", { type: "time", value: hours.end_time, onChange: (e) => handleUpdateHours(dayIndex, 'end_time', e.target.value), className: "w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:border-gold-500" }), _jsx("p", { className: "text-gold-400 text-xs mt-1", children: formatTime12Hour(hours.end_time) })] })] }))] }) }, dayIndex));
                        }), _jsxs("button", { onClick: handleSave, disabled: saving, className: "w-full px-6 py-3 bg-gold-500 hover:bg-gold-600 disabled:bg-gold-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-lg", children: [_jsx(Save, { size: 20 }), saving ? 'جاري الحفظ...' : 'حفظ أوقات العمل'] })] })) : (_jsx("div", { className: "text-center text-slate-400", children: "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644..." }))] }) }));
}
