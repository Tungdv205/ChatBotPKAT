import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'
import AdminApp from './admin/AdminApp.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { AdminProvider } from './admin/AdminContext.jsx'
import { ToastProvider } from './components/Toast.jsx'

// Đường dẫn /admin mở trang quản trị, còn lại là trang đặt lịch cho khách
const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      {isAdmin ? (
        <AdminProvider>
          <AdminApp />
        </AdminProvider>
      ) : (
        <AuthProvider>
          <App />
        </AuthProvider>
      )}
    </ToastProvider>
  </React.StrictMode>
)