import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
export default function Footer() {
    const { i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';
    return (_jsx("footer", { className: "bg-slate-950 border-t border-slate-800 py-6 mt-auto", children: _jsx("div", { className: "max-w-7xl mx-auto px-4", children: _jsxs("div", { className: "flex flex-col items-center justify-center gap-2 text-center", children: [_jsxs("p", { className: "text-xs text-slate-500", children: [isArabic ? '© تطوير بواسطة' : '© Developed by', " ", _jsx("span", { className: "text-slate-400 font-semibold", children: "Youssef & Mohamed" })] }), _jsxs("p", { className: "text-xs text-slate-600", children: [isArabic ? 'للتواصل:' : 'Contact:', " ", _jsx("span", { className: "text-slate-500 font-mono", children: "01000139417" })] })] }) }) }));
}
