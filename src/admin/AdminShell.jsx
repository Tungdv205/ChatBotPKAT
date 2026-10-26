import Icon from '../components/Icon.jsx'
import { Logo, Avatar } from '../components/Brand.jsx'
import { useAdmin } from './AdminContext.jsx'

// Menu quản trị: [mã màn hình, nhãn, biểu tượng]
export const ADMIN_NAV = [
  ['dash', 'Tổng quan', 'grid'],
  ['appts', 'Lịch hẹn', 'cal'],
  ['services', 'Dịch vụ', 'pulse'],
  ['promos', 'Ưu đãi', 'tag'],
  ['customers', 'Khách hàng', 'users'],
  ['tickets', 'Yêu cầu hỗ trợ', 'help'],
  ['staff', 'Bác sĩ, nhân viên', 'user'],
]

// Khung quản trị: thanh trên, menu bên trái (máy tính), dải menu cuộn ngang (điện thoại)
export default function AdminShell({ view, onNav, children }) {
  const { admin, logout } = useAdmin()

  return (
    <div className="shell">
      <header className="topbar">
        <div className="top-l">
          <Logo />
          <span className="pill pill-sun">Quản trị</span>
        </div>
        <div className="top-r">
          <button className="iconbtn" onClick={logout} aria-label="Đăng xuất" title="Đăng xuất">
            <Icon name="out" />
          </button>
        </div>
      </header>

      <aside className="side">
        <nav className="snav" aria-label="Menu quản trị">
          {ADMIN_NAV.map(([id, label, ic]) => (
            <button
              key={id}
              className="si"
              aria-current={view === id ? 'page' : undefined}
              onClick={() => onNav(id)}
            >
              <Icon name={ic} />
              {label}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <div className="me">
            <Avatar name={admin.name} index={1} size={40} />
            <div>
              <b>{admin.name}</b>
              <small>{admin.email}</small>
            </div>
          </div>
          <a className="btn btn-line btn-sm" href="/">
            Xem trang khách
          </a>
          <button className="btn btn-line btn-sm" onClick={logout}>
            <Icon name="out" size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="col">
        <main className="main">
          <div className="main-in">
            <div className="admin-tabs" role="tablist">
              {ADMIN_NAV.map(([id, label]) => (
                <button key={id} className="chip" aria-pressed={view === id} onClick={() => onNav(id)}>
                  {label}
                </button>
              ))}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}