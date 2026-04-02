import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/db/supabase';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
export default function AdminSettingsPage() {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';
    const [activeTab, setActiveTab] = useState('barbers');
    const [barbers, setBarbers] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone_or_price: '',
        email_or_duration: '',
        description: '',
    });
    useEffect(() => {
        fetchData();
    }, [activeTab]);
    const fetchData = async () => {
        try {
            setLoading(true);
            if (activeTab === 'barbers') {
                const { data, error } = await supabase.from('barbers').select('*');
                if (error)
                    throw error;
                setBarbers(data || []);
            }
            else {
                const { data, error } = await supabase.from('services').select('*');
                if (error)
                    throw error;
                setServices(data || []);
            }
        }
        catch (err) {
            console.error('Error fetching data:', err);
            toast.error(t('booking.error'));
        }
        finally {
            setLoading(false);
        }
    };
    const handleAddClick = () => {
        setEditingId('new');
        setFormData({ name: '', phone_or_price: '', email_or_duration: '', description: '' });
    };
    const handleEditClick = (item) => {
        setEditingId(item.id);
        if (activeTab === 'barbers') {
            setFormData({
                name: item.name,
                phone_or_price: item.phone,
                email_or_duration: item.email || '',
                description: item.specialties?.join(', ') || '',
            });
        }
        else {
            setFormData({
                name: item.name_ar,
                phone_or_price: item.price.toString(),
                email_or_duration: item.duration_minutes.toString(),
                description: item.description_ar || '',
            });
        }
    };
    const handleSave = async () => {
        if (!formData.name || !formData.phone_or_price || !formData.email_or_duration) {
            toast.error(t('validation.required'));
            return;
        }
        try {
            if (activeTab === 'barbers') {
                if (editingId === 'new') {
                    const { error } = await supabase.from('barbers').insert([
                        {
                            name: formData.name,
                            phone: formData.phone_or_price,
                            email: formData.email_or_duration,
                            specialties: formData.description.split(',').map((s) => s.trim()),
                            is_active: true,
                            experience_years: 1,
                        },
                    ]);
                    if (error)
                        throw error;
                }
                else {
                    const { error } = await supabase
                        .from('barbers')
                        .update({
                        name: formData.name,
                        phone: formData.phone_or_price,
                        email: formData.email_or_duration,
                        specialties: formData.description.split(',').map((s) => s.trim()),
                    })
                        .eq('id', editingId);
                    if (error)
                        throw error;
                }
            }
            else {
                if (editingId === 'new') {
                    const { error } = await supabase.from('services').insert([
                        {
                            name_ar: formData.name,
                            name_en: formData.name,
                            description_ar: formData.description,
                            description_en: formData.description,
                            price: parseFloat(formData.phone_or_price),
                            duration_minutes: parseInt(formData.email_or_duration),
                            category: 'haircut',
                            is_active: true,
                        },
                    ]);
                    if (error)
                        throw error;
                }
                else {
                    const { error } = await supabase
                        .from('services')
                        .update({
                        name_ar: formData.name,
                        price: parseFloat(formData.phone_or_price),
                        duration_minutes: parseInt(formData.email_or_duration),
                        description_ar: formData.description,
                    })
                        .eq('id', editingId);
                    if (error)
                        throw error;
                }
            }
            toast.success('تم الحفظ بنجاح');
            setEditingId(null);
            fetchData();
        }
        catch (err) {
            console.error('Error:', err);
            toast.error(t('booking.error'));
        }
    };
    const handleDelete = async (id) => {
        if (!window.confirm(t('admin.deleteConfirm')))
            return;
        try {
            const table = activeTab === 'barbers' ? 'barbers' : 'services';
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error)
                throw error;
            toast.success('تم الحذف بنجاح');
            fetchData();
        }
        catch (err) {
            console.error('Error:', err);
            toast.error(t('booking.error'));
        }
    };
    return (_jsx("main", { className: "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h1", { className: "text-4xl font-bold text-white mb-2", children: t('admin.settings') }), _jsx("p", { className: "text-slate-300", children: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062D\u0644\u0627\u0642\u064A\u0646 \u0648\u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0648\u0627\u0644\u0623\u0633\u0639\u0627\u0631" })] }), _jsx("div", { className: "flex gap-4 mb-8 border-b border-slate-700", children: ['barbers', 'services'].map((tab) => (_jsx("button", { onClick: () => {
                            setActiveTab(tab);
                            setEditingId(null);
                        }, className: `pb-3 px-4 font-semibold border-b-2 transition-colors ${activeTab === tab
                            ? 'border-gold-500 text-gold-500'
                            : 'border-transparent text-slate-400 hover:text-slate-300'}`, children: tab === 'barbers' ? t('admin.barbers') : t('admin.services') }, tab))) }), !editingId && (_jsxs("button", { onClick: handleAddClick, className: "mb-8 flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-semibold transition-colors", children: [_jsx(Plus, { size: 20 }), activeTab === 'barbers' ? t('admin.addBarber') : t('admin.addService')] })), editingId && (_jsxs("div", { className: "bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-200 mb-2", children: activeTab === 'barbers' ? t('admin.barberName') : t('admin.serviceName') }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), placeholder: activeTab === 'barbers' ? 'أحمد علي' : 'حلاق عام', className: "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-gold-500", dir: isArabic ? 'rtl' : 'ltr' })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-200 mb-2", children: activeTab === 'barbers' ? t('admin.barberPhone') : t('admin.servicePrice') }), _jsx("input", { type: activeTab === 'barbers' ? 'tel' : 'number', value: formData.phone_or_price, onChange: (e) => setFormData({ ...formData, phone_or_price: e.target.value }), placeholder: activeTab === 'barbers' ? '0501234567' : '50', className: "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-gold-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-200 mb-2", children: activeTab === 'barbers' ? t('admin.barberEmail') : t('admin.serviceDuration') }), _jsx("input", { type: activeTab === 'barbers' ? 'email' : 'number', value: formData.email_or_duration, onChange: (e) => setFormData({ ...formData, email_or_duration: e.target.value }), placeholder: activeTab === 'barbers' ? 'ahmad@elking.com' : '30', className: "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-gold-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-200 mb-2", children: "\u0627\u0644\u0648\u0635\u0641" }), _jsx("input", { type: "text", value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), placeholder: activeTab === 'barbers' ? 'حلاق عام, حلاق لحية' : 'وصف الخدمة', className: "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-gold-500", dir: isArabic ? 'rtl' : 'ltr' })] })] }), _jsxs("div", { className: "flex gap-3 mt-6", children: [_jsxs("button", { onClick: handleSave, className: "flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors", children: [_jsx(Save, { size: 18 }), t('admin.save')] }), _jsxs("button", { onClick: () => {
                                        setEditingId(null);
                                        setFormData({ name: '', phone_or_price: '', email_or_duration: '', description: '' });
                                    }, className: "flex items-center gap-2 px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors", children: [_jsx(X, { size: 18 }), "\u0625\u0644\u063A\u0627\u0621"] })] })] })), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: loading ? (_jsx("div", { className: "col-span-full text-center text-slate-400", children: "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644..." })) : activeTab === 'barbers' ? (barbers.map((barber) => (_jsxs("div", { className: "bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors", children: [_jsx("h3", { className: "text-lg font-bold text-white mb-2", children: barber.name }), _jsxs("p", { className: "text-sm text-slate-400 mb-1", children: ["\uD83D\uDCDE ", barber.phone] }), _jsxs("p", { className: "text-sm text-slate-400 mb-3", children: ["\u2709\uFE0F ", barber.email || 'N/A'] }), _jsx("p", { className: "text-xs text-slate-500 mb-4", children: barber.specialties?.join(', ') || 'بدون تخصصات' }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: () => handleEditClick(barber), className: "flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-semibold transition-colors", children: [_jsx(Edit2, { size: 16 }), "\u062A\u0639\u062F\u064A\u0644"] }), _jsxs("button", { onClick: () => handleDelete(barber.id), className: "flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-semibold transition-colors", children: [_jsx(Trash2, { size: 16 }), "\u062D\u0630\u0641"] })] })] }, barber.id)))) : (services.map((service) => (_jsxs("div", { className: "bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors", children: [_jsx("h3", { className: "text-lg font-bold text-white mb-2", children: service.name_ar || service.name_en }), _jsxs("p", { className: "text-sm text-gold-400 font-semibold mb-1", children: ["\uD83D\uDCB5 ", service.price, " \u062C.\u0645"] }), _jsxs("p", { className: "text-sm text-slate-400 mb-3", children: ["\u23F1\uFE0F ", service.duration_minutes, " \u062F\u0642\u064A\u0642\u0629"] }), _jsx("p", { className: "text-xs text-slate-500 mb-4 line-clamp-2", children: service.description_ar || 'بدون وصف' }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: () => handleEditClick(service), className: "flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-semibold transition-colors", children: [_jsx(Edit2, { size: 16 }), "\u062A\u0639\u062F\u064A\u0644"] }), _jsxs("button", { onClick: () => handleDelete(service.id), className: "flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-semibold transition-colors", children: [_jsx(Trash2, { size: 16 }), "\u062D\u0630\u0641"] })] })] }, service.id)))) })] }) }));
}
