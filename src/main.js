import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar.json';
import en from './locales/en.json';
i18n.use(initReactI18next).init({
    resources: {
        ar: { translation: ar },
        en: { translation: en },
    },
    lng: localStorage.getItem('language') || 'ar',
    fallbackLng: 'ar',
    interpolation: { escapeValue: false },
});
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
