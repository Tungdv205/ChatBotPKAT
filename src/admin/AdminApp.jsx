import { useEffect, useState } from 'react'
import { useAdmin } from './AdminContext.jsx'
import AdminLogin from './AdminLogin.jsx'
import AdminShell from './AdminShell.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AdminAppointments from './pages/AdminAppointments.jsx'
import AdminServices from './pages/AdminServices.jsx'
import AdminPromos from './pages/AdminPromos.jsx'
import AdminCustomers from './pages/AdminCustomers.jsx'
import AdminTickets from './pages/AdminTickets.jsx'
import AdminStaff from './pages/AdminStaff.jsx'
import AdminRevenue from './pages/AdminRevenue.jsx'

// Gốc của trang quản trị
export default function AdminApp() {
  const { admin, booting } = useAdmin()
  const [view, setView] = useState('dash')
  const [stack, setStack] = useState([]) // các màn đã đi qua, để nút Quay lại dùng

  // Đăng xuất thì lần đăng nhập sau về Tổng quan
  useEffect(() => {
    if (!admin) {
      setView('dash')
      setStack([])
    }
  }, [admin])

  if (booting) return <div style={{ padding: 40, textAlign: 'center', color: '#667' }}>Đang tải...</div>
  if (!admin) return <AdminLogin />

  const go = (v) => {
    if (v !== view) setStack((st) => [...st.slice(-19), view])
    setView(v)
    window.scrollTo({ top: 0 })
  }

  const goBack = () => {
    const prev = stack[stack.length - 1]
    if (!prev) return
    setStack(stack.slice(0, -1))
    setView(prev)
    window.scrollTo({ top: 0 })
  }

  // Nút tìm kiếm ở thanh trên: đưa con trỏ vào ô tìm của màn hiện tại.
  // Màn nào không có ô tìm (Tổng quan) thì mở Lịch hẹn.
  const onSearch = () => {
    const el = document.getElementById('adm-q')
    if (el) return el.focus()
    go('appts')
    setTimeout(() => document.getElementById('adm-q')?.focus(), 60)
  }

  return (
    <AdminShell view={view} onNav={go} canBack={stack.length > 0} onBack={goBack} onSearch={onSearch}>
      {view === 'dash' && <Dashboard go={go} />}
      {view === 'appts' && <AdminAppointments />}
      {view === 'services' && <AdminServices />}
      {view === 'promos' && <AdminPromos />}
      {view === 'customers' && <AdminCustomers />}
      {view === 'tickets' && <AdminTickets />}
      {view === 'staff' && <AdminStaff />}
      {view === 'revenue' && <AdminRevenue go={go} />}
    </AdminShell>
  )
}