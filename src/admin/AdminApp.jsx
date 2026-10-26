import { useState } from 'react'
import { useAdmin } from './AdminContext.jsx'
import AdminLogin from './AdminLogin.jsx'
import AdminShell, { ADMIN_NAV } from './AdminShell.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Placeholder from '../pages/Placeholder.jsx'

// Gốc của trang quản trị. Mỗi màn thật sẽ thay Placeholder ở các bước sau.
export default function AdminApp() {
  const { admin } = useAdmin()
  const [view, setView] = useState('dash')

  if (!admin) return <AdminLogin />

  const go = (v) => {
    setView(v)
    window.scrollTo({ top: 0 })
  }
  const item = ADMIN_NAV.find((n) => n[0] === view) || ADMIN_NAV[0]

  return (
    <AdminShell view={view} onNav={go}>
      {view === 'dash' ? <Dashboard go={go} /> : <Placeholder title={item[1]} icon={item[2]} />}
    </AdminShell>
  )
}