import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import toast from 'react-hot-toast';
import { Check, X, Clock, Phone } from 'lucide-react';
// Format date to Arabic format
const formatDateArabic = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return `${days[date.getDay()]}، ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};
export default function QueuePage() {
    const [bookings, setBookings] = useState([]);
    const [barbers, setBarbers] = useState({});
    const [services, setServices] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshTime, setRefreshTime] = useState(14);
    const [incompleteBookings, setIncompleteBookings] = useState(0);
    useEffect(() => {
        fetchData();
        // Fetch every 14 seconds
        const interval = setInterval(fetchData, 14000);
        // Subscribe to real-time changes
        const subscription = supabase
            .channel('bookings-channel')
            .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'bookings'
        }, () => {
            console.log('Real-time update detected');
            fetchData();
        })
            .subscribe();
        return () => {
            clearInterval(interval);
            subscription.unsubscribe();
        };
    }, []);
    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshTime((prev) => (prev === 0 ? 14 : prev - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, []);
    const fetchData = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            // Fetch today's pending bookings sorted by time
            const { data: bookingsData, error: bookingsError } = await supabase
                .from('bookings')
                .select('*')
                .eq('booking_date', today)
                .neq('status', 'cancelled')
                .neq('status', 'completed')
                .order('booking_time', { ascending: true });
            if (bookingsError)
                throw bookingsError;
            // Count incomplete bookings
            const incomplete = (bookingsData || []).filter(b => !b.barber_id || b.barber_id === '' || !b.service_id || b.service_id === '').length;
            setIncompleteBookings(incomplete);
            // Fetch barbers for mapping
            const { data: barbersData, error: barbersError } = await supabase
                .from('barbers')
                .select('id, name');
            if (barbersError)
                throw barbersError;
            // Fetch services for mapping
            const { data: servicesData, error: servicesError } = await supabase
                .from('services')
                .select('id, name_ar, price, duration_minutes');
            if (servicesError)
                throw servicesError;
            const barbersMap = {};
            (barbersData || []).forEach((b) => {
                barbersMap[b.id] = b.name;
            });
            const servicesMap = {};
            (servicesData || []).forEach((s) => {
                servicesMap[s.id] = s;
            });
            setBookings(bookingsData || []);
            setBarbers(barbersMap);
            setServices(servicesMap);
        }
        catch (err) {
            console.error('Error fetching queue:', err);
            toast.error('خطأ في تحميل الطابور');
        }
        finally {
            setLoading(false);
        }
    };
    const handleComplete = async (bookingId) => {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: 'completed' })
                .eq('id', bookingId);
            if (error)
                throw error;
            toast.success('تم إكمال الحجز');
            fetchData();
        }
        catch (err) {
            console.error('Error completing booking:', err);
            toast.error('خطأ في التحديث');
        }
    };
    const handleCancel = async (bookingId) => {
        if (!window.confirm('هل تريد ملغاء هذا الحجز؟'))
            return;
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', bookingId);
            if (error)
                throw error;
            toast.success('تم إلغاء الحجز');
            fetchData();
        }
        catch (err) {
            console.error('Error cancelling booking:', err);
            toast.error('خطأ في الإلغاء');
        }
    };
    const currentBooking = bookings.length > 0 ? bookings[0] : null;
    const nextBookings = bookings.slice(1);
    return (_jsx("main", { className: "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-4 md:py-8", children: _jsxs("div", { className: "max-w-6xl mx-auto px-3 md:px-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-8 md:mb-12 flex-col md:flex-row gap-3", children: [_jsx("h1", { className: "text-2xl md:text-4xl font-bold text-white", children: "\uD83C\uDFAF \u0627\u0644\u0637\u0627\u0628\u0648\u0631" }), _jsxs("div", { className: "flex items-center gap-2 text-slate-400 text-sm md:text-base", children: [_jsx(Clock, { size: 18 }), _jsxs("span", { children: ["\u0627\u0644\u062A\u062D\u062F\u064A\u062B \u0628\u0639\u062F ", refreshTime, "\u062B"] })] })] }), loading ? (_jsx("div", { className: "text-center text-slate-400 text-lg", children: "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644..." })) : (_jsxs(_Fragment, { children: [incompleteBookings > 0 && (_jsxs("div", { className: "bg-red-500/20 border border-red-500 rounded-lg p-4 mb-8 flex gap-3", children: [_jsx("div", { className: "text-red-300 font-semibold", children: "\u26A0\uFE0F \u062A\u062D\u0630\u064A\u0631" }), _jsxs("div", { className: "text-red-200 text-sm", children: ["\u064A\u0648\u062C\u062F ", _jsx("strong", { children: incompleteBookings }), " \u062D\u062C\u0632 ", incompleteBookings === 1 ? 'بيانات ناقصة' : 'بيانات ناقصة', " (\u0628\u062F\u0648\u0646 \u062D\u0644\u0627\u0642 \u0623\u0648 \u062E\u062F\u0645\u0629). \u064A\u0631\u062C\u0649 \u062A\u0635\u062D\u064A\u062D \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A."] })] })), currentBooking ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "bg-gradient-to-br from-gold-500 to-gold-600 rounded-xl md:rounded-2xl p-6 md:p-12 mb-8 md:mb-12 shadow-2xl border-2 border-gold-400", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-gold-100 text-sm md:text-lg mb-3", children: "\u0627\u0644\u0639\u0645\u064A\u0644 \u0627\u0644\u062D\u0627\u0644\u064A" }), _jsx("h2", { className: "text-white text-4xl md:text-6xl font-bold mb-6 break-words", children: currentBooking.customer_name }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8", children: [_jsxs("div", { className: "bg-white/20 rounded-lg p-2 md:p-4", children: [_jsx("p", { className: "text-gold-100 text-xs md:text-sm mb-1", children: "\u0627\u0644\u0647\u0627\u062A\u0641" }), _jsxs("div", { className: "flex items-center justify-center gap-1 md:gap-2 text-white font-semibold text-xs md:text-lg", children: [_jsx(Phone, { size: 16, className: "hidden md:block" }), _jsx("span", { className: "text-xs md:text-base", children: currentBooking.customer_phone })] })] }), _jsxs("div", { className: "bg-white/20 rounded-lg p-2 md:p-4", children: [_jsx("p", { className: "text-gold-100 text-xs md:text-sm mb-1", children: "\u0627\u0644\u062A\u0627\u0631\u064A\u062E" }), _jsx("p", { className: "text-white font-semibold text-xs md:text-lg", children: formatDateArabic(currentBooking.booking_date) })] }), _jsxs("div", { className: "bg-white/20 rounded-lg p-2 md:p-4", children: [_jsx("p", { className: "text-gold-100 text-xs md:text-sm mb-1", children: "\u0627\u0644\u0648\u0642\u062A" }), _jsx("p", { className: "text-white font-semibold text-xs md:text-lg", children: currentBooking.booking_time })] }), _jsxs("div", { className: "bg-white/20 rounded-lg p-2 md:p-4", children: [_jsx("p", { className: "text-gold-100 text-xs md:text-sm mb-1", children: "\u0627\u0644\u062D\u0644\u0627\u0642" }), _jsx("p", { className: "text-white font-semibold text-xs md:text-lg truncate", children: barbers[currentBooking.barber_id]
                                                                    ? barbers[currentBooking.barber_id]
                                                                    : currentBooking.barber_id ? '⚠️ غير موجود' : '❌ لم يتم التحديد' })] }), _jsxs("div", { className: "bg-white/20 rounded-lg p-2 md:p-4", children: [_jsx("p", { className: "text-gold-100 text-xs md:text-sm mb-1", children: "\u0627\u0644\u062E\u062F\u0645\u0629" }), _jsx("p", { className: "text-white font-semibold text-xs md:text-lg truncate", children: services[currentBooking.service_id]?.name_ar
                                                                    ? services[currentBooking.service_id]?.name_ar
                                                                    : currentBooking.service_id ? '⚠️ غير موجودة' : '❌ لم يتم التحديد' })] }), _jsxs("div", { className: "bg-white/20 rounded-lg p-2 md:p-4", children: [_jsx("p", { className: "text-gold-100 text-xs md:text-sm mb-1", children: "\u0627\u0644\u0645\u062F\u0629" }), _jsxs("p", { className: "text-white font-semibold text-xs md:text-lg", children: [services[currentBooking.service_id]?.duration_minutes || '-', " \u062F\u0642\u064A\u0642\u0629"] })] }), _jsxs("div", { className: "bg-white/20 rounded-lg p-2 md:p-4", children: [_jsx("p", { className: "text-gold-100 text-xs md:text-sm mb-1", children: "\u0627\u0644\u0633\u0639\u0631" }), _jsxs("p", { className: "text-white font-semibold text-xs md:text-lg", children: [services[currentBooking.service_id]?.price || '-', " \u062C.\u0645"] })] }), _jsxs("div", { className: "bg-white/20 rounded-lg p-2 md:p-4", children: [_jsx("p", { className: "text-gold-100 text-xs md:text-sm mb-1", children: "\u0627\u0644\u062D\u0627\u0644\u0629" }), _jsx("p", { className: "text-white font-semibold text-xs md:text-lg", children: "\uD83D\uDD14 \u062C\u0627\u0631\u064A" })] })] }), currentBooking.notes && (_jsxs("div", { className: "bg-white/10 rounded-lg p-3 md:p-4 mb-6 md:mb-8", children: [_jsx("p", { className: "text-gold-100 text-xs md:text-sm mb-2", children: "\u0645\u0644\u0627\u062D\u0638\u0627\u062A:" }), _jsx("p", { className: "text-white text-xs md:text-lg", children: currentBooking.notes })] })), _jsxs("div", { className: "flex gap-2 md:gap-4 justify-center flex-col md:flex-row", children: [_jsxs("button", { onClick: () => handleComplete(currentBooking.id), className: "flex items-center justify-center gap-2 px-4 md:px-8 py-2 md:py-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-xs md:text-lg transition-colors shadow-lg", children: [_jsx(Check, { size: 20 }), "\u0627\u0643\u062A\u0645\u0644 \u2713"] }), _jsxs("button", { onClick: () => handleCancel(currentBooking.id), className: "flex items-center justify-center gap-2 px-4 md:px-8 py-2 md:py-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-xs md:text-lg transition-colors shadow-lg", children: [_jsx(X, { size: 20 }), "\u0645\u0644\u063A\u064A \u2717"] })] })] }) }), nextBookings.length > 0 && (_jsxs("div", { className: "bg-slate-800/50 border border-slate-700 rounded-lg md:rounded-xl p-4 md:p-6", children: [_jsx("h3", { className: "text-lg md:text-2xl font-bold text-white mb-4 md:mb-6", children: "\uD83D\uDCCB \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631" }), _jsx("div", { className: "space-y-2 md:space-y-3", children: nextBookings.map((booking, index) => (_jsxs("div", { className: "flex items-start md:items-center justify-between p-3 md:p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors border border-slate-600 flex-col md:flex-row gap-2", children: [_jsxs("div", { className: "flex items-start gap-2 md:gap-4 flex-1 w-full", children: [_jsx("div", { className: "text-xl md:text-3xl font-bold text-gold-500 w-8 md:w-12 text-center flex-shrink-0", children: index + 2 }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-white font-semibold text-sm md:text-lg truncate", children: booking.customer_name }), _jsxs("div", { className: "flex flex-wrap items-center gap-1 md:gap-2 text-slate-300 text-xs md:text-sm mt-1", children: [_jsxs("span", { className: "flex items-center gap-1 flex-shrink-0", children: ["\uD83D\uDCC5 ", formatDateArabic(booking.booking_date)] }), _jsx("span", { className: "hidden md:flex items-center gap-1", children: "\u2022" })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-1 md:gap-2 text-slate-300 text-xs md:text-sm", children: [_jsxs("span", { className: "flex items-center gap-1 flex-shrink-0", children: [_jsx(Phone, { size: 14 }), _jsx("span", { className: "truncate", children: booking.customer_phone })] }), _jsxs("span", { className: "flex items-center gap-1 flex-shrink-0", children: [_jsx(Clock, { size: 14 }), booking.booking_time] }), _jsxs("span", { className: "truncate", children: ["\u26A1 ", barbers[booking.barber_id]
                                                                                        ? barbers[booking.barber_id]
                                                                                        : booking.barber_id ? '⚠️ غير موجود' : '❌ بلا حلاق'] }), _jsxs("span", { className: "truncate", children: ["\uD83D\uDEE0\uFE0F ", services[booking.service_id]?.name_ar
                                                                                        ? services[booking.service_id]?.name_ar
                                                                                        : booking.service_id ? '⚠️ غير موجودة' : '❌ بلا خدمة'] }), services[booking.service_id]?.price && (_jsxs("span", { className: "truncate", children: ["\uD83D\uDCB0 ", services[booking.service_id]?.price, " \u062C.\u0645"] }))] })] })] }), _jsx("div", { className: "text-slate-400 text-xs md:text-sm hidden md:block flex-shrink-0", children: booking.booking_date })] }, booking.id))) })] })), bookings.length === 1 && (_jsx("div", { className: "text-center mt-12 text-slate-400 text-xl", children: "\u2705 \u0644\u0627 \u064A\u0648\u062C\u062F \u0639\u0645\u0644\u0627\u0621 \u0645\u0646\u062A\u0638\u0631\u064A\u0646 \u062D\u0627\u0644\u064A\u0627\u064B" }))] })) : (_jsxs("div", { className: "text-center py-16", children: [_jsx("p", { className: "text-slate-400 text-2xl mb-4", children: "\u2705 \u0644\u0627 \u064A\u0648\u062C\u062F \u062D\u062C\u0648\u0632\u0627\u062A \u0627\u0644\u064A\u0648\u0645" }), _jsx("p", { className: "text-slate-500", children: "\u0627\u0633\u062A\u0631\u062E\u060C \u0644\u0627 \u062D\u0627\u062C\u0629 \u0644\u0644\u0639\u0645\u0644 \u0627\u0644\u0622\u0646!" })] }))] }))] }) }));
}
