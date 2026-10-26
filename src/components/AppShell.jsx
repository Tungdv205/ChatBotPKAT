import Icon from './Icon.jsx'
import { Logo, Avatar } from './Brand.jsx'
import { useAuth } from '../context/AuthContext.jsx'

// Menu thanh bên (máy tính): [mã màn hình, nhãn, biểu tượng]
export const NAV = [
  ['home', 'Trang chủ', 'home'],
  ['book', 'Đặt lịch', 'calplus'],
  ['services', 'Dịch vụ', 'grid'],
  ['appts', 'Lịch hẹn của tôi', 'cal'],
  ['promos', 'Ưu đãi', 'tag'],
  ['notifs', 'Thông báo', 'bell'],
  ['profile', 'Hồ sơ', 'user'],
  ['support', 'Hỗ trợ', 'help'],
]

// Thanh tab dưới (điện thoại)
const BOTTOM = [
  ['home', 'Trang chủ', 'home'],
  ['services', 'Dịch vụ', 'grid'],
  ['book', 'Đặt lịch', 'calplus'],
  ['appts', 'Lịch hẹn', 'cal'],
  ['profile', 'Tài khoản', 'user'],
]

export default function AppShell({ view, onNav, children }) {
  const { user, logout } = useAuth()
  const unread = user.notifs.filter((n) => !n.read).length
  const cur = view === 'success' ? 'appts' : view
  
  // Nút tìm kiếm ở thanh trên: mở màn Dịch vụ và đưa con trỏ vào ô tìm
  const goSearch = () => {
    onNav('services')
    setTimeout(() => document.getElementById('q')?.focus(), 60)
  }

  return (
        <div className="shell">
      <header className="topbar">
        <Logo/>
              <div className="top-r">
          <button className="iconbtn" onClick={goSearch} aria-label="Tìm dịch vụ" title="Tìm dịch vụ">
            <Icon name="search" />
          </button>
          <button className="iconbtn" onClick={() => onNav('notifs')} aria-label="Thông báo">
            <Icon name="bell" />
            {unread > 0 && <span className="badge">{unread}</span>}
          </button>
        </div>
      </header>
      <aside className="side">
        <nav className="snav" aria-label="Menu chính">
          {NAV.map(([id, label, ic]) => (
            <button
              key={id}
              className="si"
              aria-current={cur === id ? 'page' : undefined}
              onClick={() => onNav(id)}
            >
              <Icon name={ic} />
              {label}
              {id === 'notifs' && unread > 0 && <span className="badge">{unread}</span>}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <div className="me">
            <Avatar name={user.name} index={0} size={40} />
            <div>
              <b>{user.name}</b>
              <small>{user.email}</small>
            </div>
          </div>
          <button className="btn btn-line btn-sm" onClick={logout}>
            <Icon name="out" size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="col">
        <main className="main">
          <div className="main-in">{children}</div>
        </main>
      </div>

      <div className="col">
        <main className="main">
          <div className="main-in">{children}</div>
        </main>
      </div>

      <nav className="bnav" aria-label="Điều hướng">
        {BOTTOM.map(([id, label, ic]) => (
          <button
            key={id}
            className="bn"
            aria-current={cur === id ? 'page' : undefined}
            onClick={() => onNav(id)}
          >
            {id === 'book' ? (
              <span className="bn-fab">
                <Icon name={ic} size={22} />
              </span>
            ) : (
              <Icon name={ic} size={24} />
            )}
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
