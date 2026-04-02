import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/db/supabase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CheckCircle, XCircle } from 'lucide-react';
import { formatTime12HourArabic } from '@/utils/formatTime';
export default function DashboardPage() {
    const { t, i18n } = useTranslation();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('today');
    useEffect(() => {
        fetchBookings();
    }, [filter]);
    const fetchBookings = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('bookings')
                .select(`
          *,
          barbers!barber_id(id, name, phone, email),
          services!service_id(id, name_ar, name_en, price, duration_minutes)
        `)
                .order('booking_date', { ascending: false });
            if (filter === 'today') {
                const today = new Date().toISOString().split('T')[0];
                query = query.eq('booking_date', today);
            }
            const { data, error } = await query;
            if (error) {
                console.error('Fetch error:', error);
                throw error;
            }
            console.log('✅ Raw booking data:', data);
            setBookings((data || []).map((b) => {
                // Handle both array form (barbers[0]) and object form
                const barberData = Array.isArray(b.barbers) ? b.barbers[0] : b.barbers;
                const serviceData = Array.isArray(b.services) ? b.services[0] : b.services;
                console.log(`📦 Booking ${b.id}:`, {
                    barber_id: b.barber_id,
                    barbers: b.barbers,
                    barberData,
                    service_id: b.service_id,
                    services: b.services,
                    serviceData,
                });
                return {
                    ...b,
                    barber: barberData,
                    service: serviceData,
                };
            }));
        }
        catch (err) {
            console.error('Error fetching bookings:', err);
            toast.error('خطأ في تحميل الحجوزات');
        }
        finally {
            setLoading(false);
        }
    };
    const updateStatus = async (bookingId, status) => {
        try {
            const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId);
            if (error)
                throw error;
            setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: status } : b)));
            toast.success('تم تحديث الحالة');
        }
        catch (err) {
            toast.error('خطأ في تحديث الحالة');
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed':
                return 'bg-green-500/20 text-green-400 border-green-500/50';
            case 'completed':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            case 'cancelled':
                return 'bg-red-500/20 text-red-400 border-red-500/50';
            default:
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
        }
    };
    return (_jsx("main", { className: "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-4xl font-bold text-white mb-4", children: t('dashboard.todayBookings') }), _jsxs("div", { className: "flex gap-4", children: [_jsx("button", { onClick: () => setFilter('today'), className: `px-6 py-2 rounded-lg font-medium transition-colors ${filter === 'today' ? 'bg-gold-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`, children: "\u0627\u0644\u064A\u0648\u0645" }), _jsx("button", { onClick: () => setFilter('all'), className: `px-6 py-2 rounded-lg font-medium transition-colors ${filter === 'all' ? 'bg-gold-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`, children: "\u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u062C\u0648\u0632\u0627\u062A" })] })] }), loading ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "inline-block w-8 h-8 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" }), _jsx("p", { className: "text-slate-300 mt-4", children: "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644..." })] })) : bookings.length === 0 ? (_jsx("div", { className: "text-center bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-12", children: _jsx("p", { className: "text-slate-300 text-lg", children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u062D\u062C\u0648\u0632\u0627\u062A" }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: bookings.map((booking) => (_jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 md:p-6 w-full", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-0 mb-4", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "text-base md:text-lg font-bold text-white truncate", children: booking.customer_name }), _jsx("p", { className: "text-slate-400 text-sm truncate", children: booking.customer_phone })] }), _jsx("span", { className: `px-3 py-1 rounded-full text-xs md:text-sm font-medium border flex-shrink-0 ${getStatusColor(booking.status)}`, children: t(`booking_status.${booking.status}`) })] }), _jsxs("div", { className: "space-y-2 mb-4 text-xs md:text-sm divide-y divide-slate-700", children: [_jsxs("p", { className: "text-slate-300 py-2", children: [_jsx("strong", { className: "text-slate-200 block md:inline", children: "\u0627\u0644\u062D\u0644\u0627\u0642: " }), _jsx("span", { className: "text-white font-semibold", children: booking.barber?.name || '—' })] }), _jsxs("p", { className: "text-slate-300 py-2", children: [_jsx("strong", { className: "text-slate-200 block md:inline", children: "\u0627\u0644\u062E\u062F\u0645\u0629: " }), _jsx("span", { className: "text-white font-semibold", children: booking.service?.name_ar || '—' })] }), _jsxs("p", { className: "text-slate-300 py-2", children: [_jsx("strong", { className: "text-slate-200 block md:inline", children: "\u0627\u0644\u0645\u0648\u0639\u062F: " }), _jsx("span", { className: "text-gold-400 font-semibold", children: formatTime12HourArabic(booking.booking_time || '') })] }), _jsxs("p", { className: "text-slate-300 py-2", children: [_jsx("strong", { className: "text-slate-200 block md:inline", children: "\u0627\u0644\u062A\u0627\u0631\u064A\u062E: " }), _jsx("span", { className: "text-white font-semibold text-xs md:text-sm", children: format(new Date(booking.booking_date), 'EEEE، d MMMM yyyy', {
                                                    locale: i18n.language === 'ar' ? ar : undefined,
                                                }) })] }), booking.notes && (_jsxs("p", { className: "text-slate-300 py-2", children: [_jsx("strong", { className: "text-slate-200 block md:inline", children: "\u0645\u0644\u0627\u062D\u0638\u0627\u062A: " }), _jsx("span", { className: "text-white", children: booking.notes })] }))] }), booking.status === 'pending' && (_jsxs("div", { className: "flex flex-col md:flex-row gap-2 md:gap-2", children: [_jsxs("button", { onClick: () => updateStatus(booking.id, 'confirmed'), className: "flex-1 px-2 md:px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap", children: [_jsx(CheckCircle, { size: 14, className: "hidden md:block" }), " ", _jsx(CheckCircle, { size: 12, className: "md:hidden" }), " \u062A\u0623\u0643\u064A\u062F"] }), _jsxs("button", { onClick: () => updateStatus(booking.id, 'cancelled'), className: "flex-1 px-2 md:px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap", children: [_jsx(XCircle, { size: 14, className: "hidden md:block" }), " ", _jsx(XCircle, { size: 12, className: "md:hidden" }), " \u0625\u0644\u063A\u0627\u0621"] })] }))] }, booking.id))) }))] }) }));
}
