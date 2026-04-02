import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/db/supabase';
import toast from 'react-hot-toast';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { formatTime12Hour, formatTime12HourArabic } from '@/utils/formatTime';
// Fixed time slots - 30 minute intervals (9 AM to 6 PM)
const TIME_SLOTS = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00',
];
// Format date to Arabic format
const formatDateArabic = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return `${days[date.getDay()]}، ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};
// Normalize Egyptian phone numbers
const normalizePhone = (phone) => {
    // Remove all non-digit characters
    let normalized = phone.replace(/\D/g, '');
    // If starts with 0, keep it (e.g., 01000139417)
    if (normalized.startsWith('0')) {
        return normalized;
    }
    // If starts with 2 (country code), convert to 0 (e.g., 201000139417 -> 01000139417)
    if (normalized.startsWith('2')) {
        return '0' + normalized.substring(1);
    }
    return normalized;
};
// Get current date in Egypt timezone as YYYY-MM-DD string
const getEgyptDateString = () => {
    const now = new Date();
    return now.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
};
// Get current time in Egypt timezone as hours and minutes
const getEgyptTime = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Africa/Cairo',
    });
    const parts = formatter.formatToParts(now);
    const hours = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const minutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
    return { hours, minutes };
};
// Check if booking time is in the past (only for today)
const isPastTime = (timeStr, dateStr) => {
    const egyptDate = getEgyptDateString();
    const egyptTime = getEgyptTime();
    // If booking date is in the past, it's always past
    if (dateStr < egyptDate) {
        return true;
    }
    // Only check if time has passed for TODAY, not for future dates
    if (dateStr === egyptDate) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const bookingTime = hours * 60 + minutes;
        const currentTime = egyptTime.hours * 60 + egyptTime.minutes;
        // A time is past only if it's already finished (< instead of <=)
        return bookingTime < currentTime;
    }
    // For future dates, time is never considered past
    return false;
};
// Compare two time strings (HH:MM format)
const compareTimeStrings = (time1, time2) => {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    const t1 = h1 * 60 + m1;
    const t2 = h2 * 60 + m2;
    return t1 - t2;
};
export default function BookingPage() {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';
    const [barbers, setBarbers] = useState([]);
    const [services, setServices] = useState([]);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [workingHours, setWorkingHours] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [existingBooking, setExistingBooking] = useState(null);
    const [selectedBarber, setSelectedBarber] = useState('');
    const [selectedService, setSelectedService] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [notes, setNotes] = useState('');
    // Confirmation modal state
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [pendingBooking, setPendingBooking] = useState(null);
    const [confirmationStep, setConfirmationStep] = useState('confirm');
    const [isConfirming, setIsConfirming] = useState(false);
    const [closingCountdown, setClosingCountdown] = useState(30);
    useEffect(() => {
        fetchData();
    }, []);
    useEffect(() => {
        if (customerPhone) {
            checkExistingBooking();
        }
    }, [customerPhone, selectedDate]);
    // Countdown timer for closing modal after success
    useEffect(() => {
        if (confirmationStep !== 'success') {
            return;
        }
        setClosingCountdown(30);
        const interval = setInterval(() => {
            setClosingCountdown(prev => {
                if (prev <= 1) {
                    // Auto close
                    setShowConfirmation(false);
                    setConfirmationStep('confirm');
                    setPendingBooking(null);
                    // Reset form
                    setSelectedBarber(barbers[0]?.id || '');
                    setSelectedService(services[0]?.id || '');
                    setSelectedDate('');
                    setSelectedTime('');
                    setCustomerName('');
                    setCustomerPhone('');
                    setCustomerEmail('');
                    setNotes('');
                    setExistingBooking(null);
                    clearInterval(interval);
                }
                return Math.max(prev - 1, 0);
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [confirmationStep, barbers, services]);
    const fetchData = async () => {
        try {
            const [barbersRes, servicesRes] = await Promise.all([
                supabase.from('barbers').select('*'),
                supabase.from('services').select('*'),
            ]);
            if (barbersRes.error)
                throw barbersRes.error;
            if (servicesRes.error)
                throw servicesRes.error;
            console.log('✅ Fetched barbers:', barbersRes.data);
            console.log('✅ Fetched services:', servicesRes.data);
            setBarbers(barbersRes.data || []);
            setServices(servicesRes.data || []);
            // Auto-select first barber and first service
            if (barbersRes.data && barbersRes.data.length > 0) {
                setSelectedBarber(barbersRes.data[0].id);
            }
            if (servicesRes.data && servicesRes.data.length > 0) {
                setSelectedService(servicesRes.data[0].id);
            }
        }
        catch (err) {
            console.error('Error fetching data:', err);
            toast.error(t('booking.error'));
        }
    };
    useEffect(() => {
        if (selectedBarber && selectedDate) {
            // Refresh booked slots immediately and in parallel
            const refreshData = async () => {
                console.log(`🔄 Fetching bookings for barber ${selectedBarber} on ${selectedDate}`);
                // Helper function to normalize time format
                const normalizeTime = (time) => {
                    if (!time)
                        return '';
                    const timeStr = String(time).trim();
                    // Handle both "HH:MM:SS" and "HH:MM" formats
                    const parts = timeStr.split(':');
                    if (parts.length >= 2) {
                        return `${parts[0]}:${parts[1]}`; // Return only HH:MM
                    }
                    return timeStr;
                };
                // Get booked slots
                try {
                    const { data, error } = await supabase
                        .from('bookings')
                        .select('booking_time')
                        .eq('barber_id', selectedBarber)
                        .eq('booking_date', selectedDate)
                        .in('status', ['pending', 'confirmed']);
                    if (!error && data) {
                        // Normalize all times to HH:MM format
                        const booked = (data || [])
                            .map((b) => normalizeTime(b.booking_time))
                            .filter((t) => t.length > 0)
                            // Remove duplicates
                            .filter((t, index, arr) => arr.indexOf(t) === index);
                        setBookedSlots(booked);
                        console.log(`✅ Raw booking data:`, data);
                        console.log(`✅ Normalized booked slots for ${selectedDate}:`, booked);
                        console.log(`📊 Total booked times: ${booked.length}`);
                        // Debug: Show which slots are booked
                        booked.forEach(slot => {
                            console.log(`  🔴 ${slot} is booked`);
                        });
                    }
                    else {
                        console.log('❌ Error fetching booked slots:', error);
                        setBookedSlots([]);
                    }
                }
                catch (err) {
                    console.error('❌ Error checking bookings:', err);
                    setBookedSlots([]);
                }
                // Get working hours
                try {
                    const bookingDate = new Date(selectedDate + 'T00:00:00');
                    const dayOfWeek = bookingDate.getDay();
                    const { data, error } = await supabase
                        .from('working_hours')
                        .select('*')
                        .eq('barber_id', selectedBarber)
                        .eq('day_of_week', dayOfWeek)
                        .limit(1);
                    if (!error && data && data.length > 0) {
                        const hours = data[0];
                        setWorkingHours([hours]);
                        console.log(`🕒 Fetched working hours:`, hours);
                        console.log(`   Start: ${hours.start_time}, End: ${hours.end_time}, Is Working: ${hours.is_working}`);
                        if (hours.is_working) {
                            const slots = TIME_SLOTS.filter(slot => {
                                const startCmp = compareTimeStrings(slot, hours.start_time);
                                const endCmp = compareTimeStrings(slot, hours.end_time);
                                const isValid = startCmp >= 0 && endCmp <= 0;
                                console.log(`   ⏰ ${slot}: start_cmp=${startCmp} end_cmp=${endCmp} → ${isValid ? '✅ included' : '❌ excluded'}`);
                                return isValid;
                            });
                            setAvailableSlots(slots);
                            console.log(`📅 Available slots from ${hours.start_time} to ${hours.end_time}:`, slots);
                        }
                        else {
                            setAvailableSlots([]);
                            console.log('❌ Barber not working on this day');
                        }
                    }
                    else {
                        setWorkingHours([]);
                        setAvailableSlots(TIME_SLOTS);
                        console.log('⚠️ No working hours defined, using all slots');
                    }
                }
                catch (err) {
                    console.error('Error fetching working hours:', err);
                    setAvailableSlots(TIME_SLOTS);
                }
            };
            // Call immediately first
            refreshData();
            // Then set up interval to refresh every 3 seconds for live updates
            const refreshInterval = setInterval(() => {
                console.log(`🔄 Auto-refresh bookings...`);
                refreshData();
            }, 3000);
            return () => clearInterval(refreshInterval);
        }
        return undefined;
    }, [selectedBarber, selectedDate]);
    const checkExistingBooking = async () => {
        try {
            const normalizedPhone = normalizePhone(customerPhone);
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .eq('customer_phone', normalizedPhone)
                .eq('booking_date', selectedDate)
                .neq('status', 'cancelled')
                .limit(1);
            if (error)
                throw error;
            if (data && data.length > 0) {
                setExistingBooking(data[0]);
            }
            else {
                setExistingBooking(null);
            }
        }
        catch (err) {
            console.error('Error checking existing booking:', err);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validate all required fields
        if (!selectedBarber?.trim()) {
            toast.error('اختر حلاق من فضلك');
            return;
        }
        if (!selectedService?.trim()) {
            toast.error('اختر خدمة من فضلك');
            return;
        }
        if (!selectedDate?.trim()) {
            toast.error('اختر التاريخ من فضلك');
            return;
        }
        if (!selectedTime?.trim()) {
            toast.error('اختر الموعد من فضلك');
            return;
        }
        if (!customerName?.trim()) {
            toast.error('أدخل اسمك من فضلك');
            return;
        }
        if (!customerPhone?.trim()) {
            toast.error('أدخل رقم الهاتف من فضلك');
            return;
        }
        // Check if time is in the past
        if (isPastTime(selectedTime, selectedDate)) {
            toast.error('❌ لا يمكن الحجز في وقت مضى - اختر وقت في المستقبل');
            return;
        }
        // Check if time is already booked
        if (bookedSlots.includes(selectedTime)) {
            toast.error('❌ هذا المعاد محجوز بالفعل - اختر معاد آخر');
            return;
        }
        // Check if time is within working hours
        if (workingHours.length > 0) {
            const hours = workingHours[0];
            if (!hours.is_working) {
                toast.error('❌ الحلاق غير متاح في هذا اليوم');
                return;
            }
            if (!availableSlots.includes(selectedTime)) {
                toast.error('❌ هذا الوقت خارج أوقات عمل الحلاق');
                return;
            }
        }
        // Show confirmation modal instead of submitting directly
        const normalizedPhone = normalizePhone(customerPhone);
        // Get barber and service names - with fallback
        const barberData = barbers.find(b => b.id === selectedBarber);
        const serviceData = services.find(s => s.id === selectedService);
        console.log('🔍 Selected Barber ID:', selectedBarber);
        console.log('🔍 Available Barbers:', barbers.map(b => ({ id: b.id, name: b.name })));
        console.log('🔍 Matched Barber Data:', barberData);
        console.log('🔍 Selected Service ID:', selectedService);
        console.log('🔍 Available Services:', services.map(s => ({ id: s.id, name_ar: s.name_ar })));
        console.log('🔍 Matched Service Data:', serviceData);
        // Normalize the selected time to HH:MM format
        const normalizeTimeHelper = (time) => {
            const parts = time.split(':');
            if (parts.length >= 2) {
                return `${parts[0]}:${parts[1]}`; // Return only HH:MM
            }
            return time;
        };
        const booking = {
            barber_id: selectedBarber,
            service_id: selectedService,
            barber_name: barberData?.name || selectedBarber + ' (ID)', // Show ID if name missing
            service_name: serviceData?.name_ar || selectedService + ' (Service)', // Show ID if name missing
            service_price: serviceData?.price || 0,
            service_duration: serviceData?.duration_minutes || 0,
            customer_name: customerName.trim(),
            customer_phone: normalizedPhone,
            customer_email: customerEmail?.trim() || null,
            booking_date: selectedDate,
            booking_time: normalizeTimeHelper(selectedTime), // Normalize to HH:MM format
            status: 'pending',
            notes: notes?.trim() || null,
        };
        console.log('📋 Pending Booking:', booking);
        setPendingBooking(booking);
        setShowConfirmation(true);
        setConfirmationStep('confirm');
    };
    const handleConfirmBooking = async () => {
        if (!pendingBooking)
            return;
        // Validate that barber and service IDs are valid UUIDs
        if (!pendingBooking.barber_id || pendingBooking.barber_id.length === 0) {
            toast.error('❌ اختر حلاق من فضلك');
            setConfirmationStep('confirm');
            return;
        }
        if (!pendingBooking.service_id || pendingBooking.service_id.length === 0) {
            toast.error('❌ اختر خدمة من فضلك');
            setConfirmationStep('confirm');
            return;
        }
        // Double check that the barber exists
        const selectedBarberData = barbers.find(b => b.id === pendingBooking.barber_id);
        if (!selectedBarberData) {
            toast.error('❌ الحلاق المختار غير صحيح - اختر حلاق آخر');
            setConfirmationStep('confirm');
            return;
        }
        // Double check that the service exists
        const selectedServiceData = services.find(s => s.id === pendingBooking.service_id);
        if (!selectedServiceData) {
            toast.error('❌ الخدمة المختارة غير صحيحة - اختر خدمة أخرى');
            setConfirmationStep('confirm');
            return;
        }
        setIsConfirming(true);
        try {
            // FINAL CHECK: Make sure no one else booked this slot in the meantime
            const { data: conflictCheck, error: conflictError } = await supabase
                .from('bookings')
                .select('id')
                .eq('barber_id', pendingBooking.barber_id)
                .eq('booking_date', pendingBooking.booking_date)
                .eq('booking_time', pendingBooking.booking_time)
                .in('status', ['pending', 'confirmed'])
                .limit(1);
            if (conflictError) {
                console.error('Conflict check error:', conflictError);
                throw conflictError;
            }
            if (conflictCheck && conflictCheck.length > 0) {
                toast.error('❌ آسف! تم حجز هذا الوقت للتو من قبل عميل آخر. اختر وقت آخر.');
                setConfirmationStep('confirm');
                setIsConfirming(false);
                // Note: Booked slots will be refreshed in 3 seconds by the interval
                return;
            }
            // Extract only the fields that exist in the bookings table
            const bookingData = {
                barber_id: pendingBooking.barber_id,
                service_id: pendingBooking.service_id,
                customer_name: pendingBooking.customer_name,
                customer_phone: pendingBooking.customer_phone,
                customer_email: pendingBooking.customer_email,
                booking_date: pendingBooking.booking_date,
                booking_time: pendingBooking.booking_time,
                status: pendingBooking.status,
                notes: pendingBooking.notes,
            };
            const { error } = await supabase.from('bookings').insert([bookingData]);
            if (error) {
                console.error('Supabase error details:', error);
                throw error;
            }
            // Show success state
            setConfirmationStep('success');
        }
        catch (err) {
            console.error('Booking error full:', err);
            if (err.message?.includes('uuid')) {
                toast.error('❌ خطأ في البيانات - تأكد من اختيار الحلاق والخدمة');
            }
            else if (err.code === '22P02') {
                toast.error('❌ صيغة بيانات غير صحيحة - حاول مرة أخرى');
            }
            else {
                toast.error('❌ حدث خطأ: ' + (err.message || 'حاول مرة أخرى'));
            }
            setConfirmationStep('confirm');
        }
        finally {
            setIsConfirming(false);
        }
    };
    const handleEditBooking = () => {
        setShowConfirmation(false);
        setPendingBooking(null);
        setConfirmationStep('confirm');
    };
    const handleCancelBooking = () => {
        setShowConfirmation(false);
        setPendingBooking(null);
        setConfirmationStep('confirm');
    };
    const handleBackdropClick = (e) => {
        // Don't close if clicking the modal itself
        if (e.target === e.currentTarget) {
            // Don't close during confirmation or success
            if (!isConfirming && confirmationStep !== 'success') {
                handleEditBooking();
            }
        }
    };
    return (_jsxs("main", { className: "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12", children: [_jsxs("div", { className: "max-w-4xl mx-auto px-4", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h1", { className: "text-4xl md:text-5xl font-bold text-white mb-2", children: t('booking.title') }), _jsx("p", { className: "text-xl text-slate-300", children: t('booking.subtitle') })] }), _jsxs("form", { onSubmit: handleSubmit, className: "bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-200 mb-2", children: t('booking.selectBarber') }), _jsxs("select", { value: selectedBarber, onChange: (e) => setSelectedBarber(e.target.value), className: "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors", dir: isArabic ? 'rtl' : 'ltr', children: [_jsx("option", { value: "", children: t('booking.selectBarber') }), barbers.map((barber) => (_jsx("option", { value: barber.id, children: barber.name }, barber.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-200 mb-2", children: t('booking.selectService') }), _jsxs("select", { value: selectedService, onChange: (e) => setSelectedService(e.target.value), className: "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors", dir: isArabic ? 'rtl' : 'ltr', children: [_jsx("option", { value: "", children: t('booking.selectService') }), services.map((service) => (_jsxs("option", { value: service.id, children: [service.name_ar, " - ", service.price, " \u062C.\u0645 (", service.duration_minutes, " \u062F\u0642\u064A\u0642\u0629)"] }, service.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-200 mb-2", children: t('booking.selectDate') }), _jsx("input", { type: "date", value: selectedDate, onChange: (e) => setSelectedDate(e.target.value), className: "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors", min: new Date().toISOString().split('T')[0] })] }), selectedDate && (_jsxs("div", { children: [workingHours.length > 0 && workingHours[0]?.is_working ? (_jsx("div", { className: "bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4", children: _jsxs("p", { className: "text-blue-300 text-sm", children: ["\u23F0 \u0633\u0627\u0639\u0627\u062A \u0639\u0645\u0644 \u0627\u0644\u062D\u0644\u0627\u0642:", _jsxs("span", { className: "font-bold", children: [" ", formatTime12HourArabic(workingHours[0].start_time), " - ", formatTime12HourArabic(workingHours[0].end_time)] })] }) })) : null, _jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("label", { className: "block text-sm font-medium text-slate-200", children: t('bookingAdvanced.availableSlots') }), _jsxs("button", { type: "button", onClick: () => {
                                                    const nearest = availableSlots.find(slot => !bookedSlots.includes(slot) && !isPastTime(slot, selectedDate));
                                                    if (!nearest) {
                                                        toast.error('لا توجد مواعيد متاحة اليوم');
                                                    }
                                                    else {
                                                        setSelectedTime(nearest);
                                                        toast.success(`تم اختيار أقرب موعد: ${nearest}`);
                                                    }
                                                }, className: "text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors flex items-center gap-1", children: [_jsx(Clock, { size: 14 }), t('bookingAdvanced.smartSelection')] })] }), availableSlots.length === 0 && workingHours.length > 0 && !workingHours[0]?.is_working && (_jsx("div", { className: "bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-300 mb-4", children: "\u26A0\uFE0F \u0627\u0644\u062D\u0644\u0627\u0642 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u064A\u0648\u0645" })), _jsx("div", { className: "grid grid-cols-4 gap-2 mb-4", children: TIME_SLOTS.length > 0 ? (TIME_SLOTS.map((slot) => {
                                            const isBooked = bookedSlots.includes(slot);
                                            const isPast = isPastTime(slot, selectedDate);
                                            const isOutsideWorkingHours = !availableSlots.includes(slot);
                                            const isSelected = selectedTime === slot;
                                            const isDisabled = isBooked || isPast || isOutsideWorkingHours;
                                            const displayTime = formatTime12Hour(slot);
                                            return (_jsxs("button", { type: "button", onClick: () => !isDisabled && setSelectedTime(slot), disabled: isDisabled, className: `py-3 px-2 rounded-lg font-semibold text-sm transition-all ${isBooked
                                                    ? 'bg-red-500/30 border border-red-500 text-red-300 cursor-not-allowed opacity-50'
                                                    : isPast
                                                        ? 'bg-gray-500/30 border border-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                                                        : isOutsideWorkingHours
                                                            ? 'bg-slate-900/50 border border-slate-700 text-slate-500 cursor-not-allowed opacity-30'
                                                            : isSelected
                                                                ? 'bg-gold-500 border border-gold-600 text-white shadow-lg'
                                                                : 'bg-slate-700 border border-slate-600 text-slate-200 hover:bg-slate-600 hover:border-slate-500'}`, title: isBooked ? 'محجوز' :
                                                    isPast ? 'وقت مضى' :
                                                        isOutsideWorkingHours ? 'خارج ساعات العمل' :
                                                            'متاح', children: [displayTime, isBooked && _jsx("span", { className: "text-xs block", children: "\u0645\u062D\u062C\u0648\u0632" }), isPast && _jsx("span", { className: "text-xs block", children: "\u0645\u0636\u0649" }), isOutsideWorkingHours && !isBooked && !isPast && _jsx("span", { className: "text-xs block opacity-50", children: "\u0645\u063A\u0644\u0642" })] }, slot));
                                        })) : (_jsx("div", { className: "col-span-4 text-center text-slate-400 p-4", children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0648\u0627\u0639\u064A\u062F \u0645\u062A\u0627\u062D\u0629" })) }), _jsx("p", { className: "text-xs text-slate-400 text-center", children: t('bookingAdvanced.selectFromGrid') })] })), existingBooking && (_jsxs("div", { className: "bg-amber-500/20 border border-amber-500 rounded-lg p-4 flex gap-3", children: [_jsx(AlertCircle, { className: "text-amber-500 flex-shrink-0 mt-0.5", size: 20 }), _jsxs("div", { className: "text-amber-100 text-sm", children: [_jsx("p", { className: "font-semibold mb-1", children: t('bookingAdvanced.phoneWarning') }), _jsxs("p", { children: [_jsx("strong", { children: existingBooking.booking_date }), " \u0641\u064A \u0627\u0644\u0633\u0627\u0639\u0629 ", _jsx("strong", { children: formatTime12HourArabic(existingBooking.booking_time) })] }), _jsxs("p", { className: "text-xs text-amber-200 mt-2", children: ["\u0627\u0644\u062D\u062C\u0632 \u0628\u0627\u0633\u0645: ", existingBooking.customer_name] })] })] })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-200 mb-2", children: t('booking.yourName') }), _jsx("input", { type: "text", value: customerName, onChange: (e) => setCustomerName(e.target.value), placeholder: t('booking.yourName'), className: "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-gold-500 transition-colors", dir: isArabic ? 'rtl' : 'ltr' })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-200 mb-2", children: t('booking.yourPhone') }), _jsx("input", { type: "tel", value: customerPhone, onChange: (e) => setCustomerPhone(e.target.value), placeholder: "01050123456 \u0623\u0648 201050123456", className: "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-gold-500 transition-colors", dir: "ltr" }), _jsx("p", { className: "text-xs text-slate-400 mt-1", children: "\u0627\u0644\u0635\u064A\u063A \u0627\u0644\u0645\u0642\u0628\u0648\u0644\u0629: 01XXXXXXXXX \u0623\u0648 201XXXXXXXXX" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-200 mb-2", children: t('booking.yourEmail') }), _jsx("input", { type: "email", value: customerEmail, onChange: (e) => setCustomerEmail(e.target.value), placeholder: t('booking.yourEmail'), className: "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-gold-500 transition-colors" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-200 mb-2", children: t('booking.notes') }), _jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), placeholder: t('booking.notes'), rows: 3, className: "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-gold-500 transition-colors resize-none", dir: isArabic ? 'rtl' : 'ltr' })] }), _jsx("button", { type: "submit", disabled: !selectedTime, className: "w-full px-6 py-3 bg-gold-500 hover:bg-gold-600 disabled:bg-gold-700 text-white rounded-lg font-semibold transition-colors", children: t('booking.book') })] })] }), showConfirmation && (_jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4", onClick: handleBackdropClick, children: _jsx("div", { className: "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-300", children: confirmationStep === 'confirm' ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "bg-gradient-to-r from-gold-500 to-gold-600 px-4 md:px-8 py-4 md:py-6 text-white rounded-t-xl sticky top-0 z-10", children: [_jsx("h2", { className: "text-2xl md:text-3xl font-bold", children: "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u062C\u0632" }), _jsx("p", { className: "text-gold-100 mt-1 text-sm md:text-base", children: "\u062A\u0623\u0643\u062F \u0645\u0646 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0642\u0628\u0644 \u0627\u0644\u062D\u062C\u0632" })] }), _jsxs("div", { className: "px-4 md:px-8 py-6 md:py-8 space-y-4 md:space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6", children: [_jsxs("div", { className: "bg-slate-700/50 rounded-lg p-3 md:p-4 border border-slate-600/50", children: [_jsx("p", { className: "text-slate-400 text-xs md:text-sm mb-2", children: "\u0627\u0644\u0627\u0633\u0645" }), _jsx("p", { className: "text-white text-base md:text-lg font-semibold truncate", children: pendingBooking?.customer_name })] }), _jsxs("div", { className: "bg-slate-700/50 rounded-lg p-3 md:p-4 border border-slate-600/50", children: [_jsx("p", { className: "text-slate-400 text-xs md:text-sm mb-2", children: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641" }), _jsx("p", { className: "text-white text-base md:text-lg font-semibold font-mono text-center", children: pendingBooking?.customer_phone }), _jsx("p", { className: "text-slate-500 text-xs mt-2 text-center", children: "\u0627\u0644\u0635\u064A\u063A \u0627\u0644\u0645\u0642\u0628\u0648\u0644\u0629: 01XXXXXXXXX" })] }), _jsxs("div", { className: "bg-slate-700/50 rounded-lg p-3 md:p-4 border border-slate-600/50", children: [_jsx("p", { className: "text-slate-400 text-xs md:text-sm mb-2", children: "\u0627\u0644\u062D\u0644\u0627\u0642" }), _jsx("p", { className: "text-white text-base md:text-lg font-semibold truncate", children: pendingBooking?.barber_name || 'جاري التحميل...' })] }), _jsxs("div", { className: "bg-slate-700/50 rounded-lg p-3 md:p-4 border border-slate-600/50", children: [_jsx("p", { className: "text-slate-400 text-xs md:text-sm mb-2", children: "\u0627\u0644\u062E\u062F\u0645\u0629" }), _jsxs("div", { children: [_jsx("p", { className: "text-white text-base md:text-lg font-semibold truncate", children: pendingBooking?.service_name || 'جاري التحميل...' }), _jsxs("p", { className: "text-slate-300 text-xs mt-1", children: ["\u23F1\uFE0F ", pendingBooking?.service_duration, " \u062F\u0642\u064A\u0642\u0629"] }), _jsxs("p", { className: "text-gold-400 text-sm mt-1 font-semibold", children: [pendingBooking?.service_price, " \u062C.\u0645"] })] })] }), _jsxs("div", { className: "bg-slate-700/50 rounded-lg p-3 md:p-4 border border-slate-600/50", children: [_jsx("p", { className: "text-slate-400 text-xs md:text-sm mb-2", children: "\u0627\u0644\u062A\u0627\u0631\u064A\u062E" }), _jsx("p", { className: "text-white text-sm md:text-lg font-semibold", children: formatDateArabic(pendingBooking?.booking_date || '') })] }), _jsxs("div", { className: "bg-slate-700/50 rounded-lg p-3 md:p-4 border border-slate-600/50", children: [_jsx("p", { className: "text-slate-400 text-xs md:text-sm mb-2", children: "\u0627\u0644\u0648\u0642\u062A" }), _jsx("p", { className: "text-white text-xl md:text-2xl font-semibold text-center", children: formatTime12HourArabic(pendingBooking?.booking_time || '') })] })] }), pendingBooking?.notes && (_jsxs("div", { className: "bg-blue-500/10 border border-blue-500/50 rounded-lg p-3 md:p-4", children: [_jsx("p", { className: "text-blue-300 text-xs md:text-sm mb-2", children: "\u0645\u0644\u0627\u062D\u0638\u0627\u062A\u0643" }), _jsx("p", { className: "text-blue-100 text-xs md:text-sm", children: pendingBooking.notes })] }))] }), _jsxs("div", { className: "px-4 md:px-8 py-4 md:py-6 bg-slate-800/50 border-t border-slate-700 flex flex-col md:flex-row gap-2 md:gap-4 rounded-b-xl", children: [_jsx("button", { onClick: handleCancelBooking, disabled: isConfirming, className: "flex-1 px-3 md:px-6 py-2 md:py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-300 rounded-lg text-xs md:text-sm font-semibold transition-colors disabled:opacity-50 order-3 md:order-1", children: "\u0625\u0644\u063A\u0627\u0621" }), _jsx("button", { onClick: handleEditBooking, disabled: isConfirming, className: "flex-1 px-3 md:px-6 py-2 md:py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500 text-blue-300 rounded-lg text-xs md:text-sm font-semibold transition-colors disabled:opacity-50 order-2 md:order-2", children: "\u062A\u0639\u062F\u064A\u0644" }), _jsx("button", { onClick: handleConfirmBooking, disabled: isConfirming, className: "flex-1 px-3 md:px-6 py-2 md:py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-700 text-white rounded-lg text-xs md:text-sm font-semibold transition-colors flex items-center justify-center gap-1 md:gap-2 order-1 md:order-3", children: isConfirming ? 'جاري...' : '✓ تأكيد الحجز' })] })] })) : (_jsx(_Fragment, { children: _jsxs("div", { className: "px-4 md:px-8 py-8 md:py-12 flex flex-col items-center justify-center text-center", children: [_jsxs("div", { className: "mb-4 md:mb-6 relative", children: [_jsx("div", { className: "absolute inset-0 bg-green-500 rounded-full animate-pulse blur-lg" }), _jsx(CheckCircle2, { size: 60, className: "text-green-400 relative animate-bounce md:w-20 md:h-20" })] }), _jsx("h3", { className: "text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3", children: "\u062A\u0645 \u0627\u0644\u062A\u0623\u0643\u064A\u062F! \uD83C\uDF89" }), _jsx("p", { className: "text-lg md:text-xl text-slate-300 mb-2", children: "\u062D\u062C\u0632\u0643 \u062A\u0645 \u0628\u0646\u062C\u0627\u062D" }), _jsxs("p", { className: "text-sm md:text-base text-slate-400", children: ["\u0633\u0646\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0643 \u0639\u0644\u0649 \u0627\u0644\u0631\u0642\u0645 ", pendingBooking?.customer_phone] }), _jsxs("div", { className: "mt-6 md:mt-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4 md:p-6 w-full", children: [_jsx("p", { className: "text-green-300 text-xs md:text-sm mb-3 font-semibold", children: "\uD83D\uDCCB \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062D\u062C\u0632" }), _jsxs("div", { className: "space-y-1 md:space-y-2 text-right text-xs md:text-sm", children: [_jsxs("p", { className: "text-slate-200", children: [_jsx("span", { className: "text-slate-400", children: "\u0627\u0644\u062D\u0644\u0627\u0642:" }), " ", pendingBooking?.barber_name] }), _jsxs("p", { className: "text-slate-200", children: [_jsx("span", { className: "text-slate-400", children: "\u0627\u0644\u062E\u062F\u0645\u0629:" }), " ", pendingBooking?.service_name] }), _jsxs("p", { className: "text-slate-200", children: [_jsx("span", { className: "text-slate-400", children: "\u0627\u0644\u0633\u0639\u0631:" }), " ", _jsxs("span", { className: "text-gold-400 font-semibold", children: [pendingBooking?.service_price, " \u062C.\u0645"] })] }), _jsxs("p", { className: "text-slate-200", children: [_jsx("span", { className: "text-slate-400", children: "\u0627\u0644\u0645\u062F\u0629:" }), " ", pendingBooking?.service_duration, " \u062F\u0642\u064A\u0642\u0629"] }), _jsxs("p", { className: "text-slate-200", children: [_jsx("span", { className: "text-slate-400", children: "\u0627\u0644\u062A\u0627\u0631\u064A\u062E \u0648\u0627\u0644\u0648\u0642\u062A:" }), " ", formatDateArabic(pendingBooking?.booking_date || ''), " - ", formatTime12HourArabic(pendingBooking?.booking_time || '')] }), _jsxs("p", { className: "text-slate-200", children: [_jsx("span", { className: "text-slate-400", children: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641:" }), " ", pendingBooking?.customer_phone] })] })] }), _jsxs("div", { className: "mt-6 md:mt-8 text-center", children: [_jsx("p", { className: "text-slate-300 text-xs md:text-sm mb-4", children: "\u2705 \u0633\u064A\u062A\u0645 \u0625\u063A\u0644\u0627\u0642 \u0647\u0630\u0647 \u0627\u0644\u0646\u0627\u0641\u0630\u0629 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u062E\u0644\u0627\u0644..." }), _jsx("div", { className: "inline-block bg-gold-500/20 border-2 border-gold-500 rounded-full px-4 md:px-6 py-2 md:py-3", children: _jsx("p", { className: "text-gold-400 text-2xl md:text-3xl font-bold", children: closingCountdown }) }), _jsx("p", { className: "text-slate-400 text-xs mt-2 md:mt-4", children: "\u0627\u0644\u0631\u062C\u0627\u0621 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631" })] }), _jsxs("div", { className: "mt-6 md:mt-8 pt-4 md:pt-6 border-t border-slate-700 text-center w-full", children: [_jsxs("p", { className: "text-xs text-slate-500", children: ["\u00A9 \u062A\u0637\u0648\u064A\u0631 \u0628\u0648\u0627\u0633\u0637\u0629 ", _jsx("span", { className: "text-slate-400 font-semibold", children: "Youssef & Mohamed" })] }), _jsxs("p", { className: "text-xs text-slate-600 mt-1", children: ["\u0644\u0644\u062A\u0648\u0627\u0635\u0644: ", _jsx("span", { className: "text-slate-500 font-mono", children: "01000139417" })] })] })] }) })) }) }))] }));
}
