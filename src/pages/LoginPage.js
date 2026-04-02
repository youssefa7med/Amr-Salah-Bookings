import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
export default function LoginPage({ onLoginSuccess }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // TODO: Integrate with Supabase staff authentication
            // For now, use a simple mock authentication
            if (email && password.length >= 6) {
                localStorage.setItem('staff_token', email);
                onLoginSuccess();
                navigate('/dashboard');
                toast.success('تم تسجيل الدخول بنجاح');
            }
            else {
                toast.error('بريد إلكتروني أو كلمة مرور غير صحيحة');
            }
        }
        catch (err) {
            toast.error('خطأ في تسجيل الدخول');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("main", { className: "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center", children: _jsx("div", { className: "w-full max-w-md px-4", children: _jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8", children: [_jsx("h1", { className: "text-3xl font-bold text-white mb-2 text-center", children: t('dashboard.title') }), _jsx("p", { className: "text-slate-300 text-center mb-8", children: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0644\u0645\u0648\u0638\u0641\u064A \u0627\u0644\u0645\u062D\u0644" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-200 mb-2", children: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors", placeholder: "your@email.com" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-200 mb-2", children: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full px-6 py-2 bg-gold-500 hover:bg-gold-600 disabled:bg-gold-700 text-white rounded-lg font-semibold transition-colors", children: loading ? 'جاري...' : 'دخول' })] }), _jsx("p", { className: "text-slate-400 text-center text-sm mt-6", children: "\u0644\u0644\u0645\u0648\u0638\u0641\u064A\u0646 \u0641\u0642\u0637. \u0627\u0633\u062A\u062E\u062F\u0645 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0643 \u0644\u0644\u0645\u062D\u0644." })] }) }) }));
}
