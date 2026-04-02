import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
// Pages
import BookingPage from './pages/BookingPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import StaffManagementPage from './pages/StaffManagementPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import QueuePage from './pages/QueuePage';
import WorkingHoursPage from './pages/WorkingHoursPage';
// Components
import Header from './components/Header';
import Footer from './components/Footer';
function App() {
    const { i18n } = useTranslation();
    const [isStaff, setIsStaff] = useState(false);
    useEffect(() => {
        const staffToken = localStorage.getItem('staff_token');
        setIsStaff(!!staffToken);
        // Set HTML dir based on language
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    }, [i18n.language]);
    return (_jsxs(_Fragment, { children: [_jsx(BrowserRouter, { children: _jsxs("div", { className: "flex flex-col min-h-screen", children: [_jsx(Header, { isStaff: isStaff, onLogout: () => setIsStaff(false) }), _jsx("main", { className: "flex-1", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(BookingPage, {}) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, { onLoginSuccess: () => setIsStaff(true) }) }), _jsx(Route, { path: "/dashboard", element: isStaff ? _jsx(DashboardPage, {}) : _jsx(Navigate, { to: "/login" }) }), _jsx(Route, { path: "/queue", element: isStaff ? _jsx(QueuePage, {}) : _jsx(Navigate, { to: "/login" }) }), _jsx(Route, { path: "/staff-management", element: isStaff ? _jsx(StaffManagementPage, {}) : _jsx(Navigate, { to: "/login" }) }), _jsx(Route, { path: "/admin-settings", element: isStaff ? _jsx(AdminSettingsPage, {}) : _jsx(Navigate, { to: "/login" }) }), _jsx(Route, { path: "/working-hours", element: isStaff ? _jsx(WorkingHoursPage, {}) : _jsx(Navigate, { to: "/login" }) })] }) }), _jsx(Footer, {})] }) }), _jsx(Toaster, { position: "top-center" }), _jsx(Analytics, {}), _jsx(SpeedInsights, {})] }));
}
export default App;
