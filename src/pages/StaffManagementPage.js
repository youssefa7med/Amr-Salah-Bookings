import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/db/supabase';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
export default function StaffManagementPage() {
    const { t } = useTranslation();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        phone: '',
        role: 'staff',
    });
    useEffect(() => {
        fetchStaff();
    }, []);
    const fetchStaff = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('staff_users')
                .select('*')
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            setStaff(data || []);
        }
        catch (err) {
            console.error(err);
            toast.error('خطأ في تحميل الموظفين');
        }
        finally {
            setLoading(false);
        }
    };
    const handleAddStaff = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password || !formData.name) {
            toast.error(t('validation.required'));
            return;
        }
        try {
            setLoading(true);
            // Hash password (في الإنتاج استخدم bcrypt على الخادم)
            const passwordHash = btoa(formData.password);
            const { error } = await supabase.from('staff_users').insert([
                {
                    email: formData.email,
                    password_hash: passwordHash,
                    name: formData.name,
                    phone: formData.phone || null,
                    role: formData.role,
                    is_active: true,
                },
            ]);
            if (error)
                throw error;
            toast.success('تم إضافة الموظف بنجاح');
            setFormData({ email: '', password: '', name: '', phone: '', role: 'staff' });
            setShowForm(false);
            fetchStaff();
        }
        catch (err) {
            console.error(err);
            toast.error('خطأ في إضافة الموظف');
        }
        finally {
            setLoading(false);
        }
    };
    const handleDeleteStaff = async (id) => {
        if (!confirm('هل تأكد من حذف هذا الموظف؟'))
            return;
        try {
            const { error } = await supabase.from('staff_users').delete().eq('id', id);
            if (error)
                throw error;
            toast.success('تم حذف الموظف');
            fetchStaff();
        }
        catch (err) {
            toast.error('خطأ في حذف الموظف');
        }
    };
    const toggleActive = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('staff_users')
                .update({ is_active: !currentStatus })
                .eq('id', id);
            if (error)
                throw error;
            fetchStaff();
            toast.success(currentStatus ? 'تم تضغيل الموظف' : 'تم تفعيل الموظف');
        }
        catch (err) {
            toast.error('خطأ في التحديث');
        }
    };
    return (_jsx("main", { className: "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsx("h1", { className: "text-4xl font-bold text-white", children: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646" }), _jsxs("button", { onClick: () => setShowForm(!showForm), className: "px-6 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2", children: [_jsx(Plus, { size: 20 }), " \u0625\u0636\u0627\u0641\u0629 \u0645\u0648\u0638\u0641"] })] }), showForm && (_jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 mb-8", children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-4", children: "\u0645\u0648\u0638\u0641 \u062C\u062F\u064A\u062F" }), _jsxs("form", { onSubmit: handleAddStaff, className: "space-y-4", children: [_jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-200 mb-2", children: "\u0627\u0644\u0627\u0633\u0645" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500", placeholder: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0648\u0638\u0641" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-200 mb-2", children: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" }), _jsx("input", { type: "email", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), className: "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500", placeholder: "email@example.com" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-200 mb-2", children: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641" }), _jsx("input", { type: "tel", value: formData.phone, onChange: (e) => setFormData({ ...formData, phone: e.target.value }), className: "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500", placeholder: "0501234567" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-200 mb-2", children: "\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629" }), _jsxs("select", { value: formData.role, onChange: (e) => setFormData({ ...formData, role: e.target.value }), className: "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500", children: [_jsx("option", { value: "staff", children: "\u0645\u0648\u0638\u0641 \u0639\u0627\u062F\u064A" }), _jsx("option", { value: "manager", children: "\u0645\u062F\u064A\u0631" }), _jsx("option", { value: "admin", children: "\u0645\u0633\u0624\u0648\u0644" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-200 mb-2", children: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" }), _jsx("input", { type: "password", value: formData.password, onChange: (e) => setFormData({ ...formData, password: e.target.value }), className: "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })] })] }), _jsxs("div", { className: "flex gap-4", children: [_jsx("button", { type: "submit", disabled: loading, className: "px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg font-medium transition-colors", children: loading ? 'جاري...' : 'إضافة' }), _jsx("button", { type: "button", onClick: () => setShowForm(false), className: "px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors", children: "\u0625\u0644\u063A\u0627\u0621" })] })] })] })), loading && !showForm ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "inline-block w-8 h-8 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" }), _jsx("p", { className: "text-slate-300 mt-4", children: "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644..." })] })) : (_jsx("div", { className: "grid md:grid-cols-2 gap-4", children: staff.map((member) => (_jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-lg font-bold text-white", children: member.name }), _jsx("p", { className: "text-slate-400 text-sm", children: member.email }), member.phone && _jsx("p", { className: "text-slate-400 text-sm", children: member.phone })] }), _jsx("span", { className: `px-3 py-1 rounded-full text-xs font-medium ${member.role === 'admin'
                                            ? 'bg-red-500/20 text-red-400'
                                            : member.role === 'manager'
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : 'bg-slate-500/20 text-slate-400'}`, children: member.role === 'admin' ? 'مسؤول' : member.role === 'manager' ? 'مدير' : 'موظف' })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => toggleActive(member.id, member.is_active), className: `flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${member.is_active
                                            ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                                            : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'}`, children: member.is_active ? 'مفعّل' : 'معطّل' }), _jsx("button", { onClick: () => handleDeleteStaff(member.id), className: "px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-1", children: _jsx(Trash2, { size: 16 }) })] })] }, member.id))) }))] }) }));
}
