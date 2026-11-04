import { useEffect } from 'react'
import Icon from './Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'

// Cửa sổ chào mừng: hiện khi có thông báo ưu đãi chưa đọc (tài khoản mới). Đóng lại là đánh dấu đã đọc.
export default function WelcomePopup({ app }) {
  const { user, markRead } = useAuth()
  const n = user.notifs.find((x) => x.t === 'promo' && !x.read && /CHAOMUNG/.test(x.body))

  const close = () => n && markRead(n.id)

  useEffect(() => {
    if (!n) return undefined
    const onKey = (e) => e.key === 'Escape' && markRead(n.id)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [n, markRead])

  if (!n) return null

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="sheet welcome" role="dialog" aria-modal="true" aria-label={n.title}>
                <div className="confetti" aria-hidden="true">
          {Array.from({ length: 28 }, (_, i) => (
            <i key={i} style={{ '--i': i }} />
          ))}
        </div>
        <div className="hd">
          <span className="welcome-ic">
            <Icon name="gift" size={28} />
          </span>
          <button className="iconbtn" onClick={close} aria-label="Đóng">
            <Icon name="x" />
          </button>
        </div>
        <h2>{n.title}</h2>
        <p>{n.body}</p>
        <div className="cd2">
          <code>CHAOMUNG</code>
          <button className="btn btn-sm btn-line" onClick={() => app.copyCode('CHAOMUNG')}>
            <Icon name="copy" size={16} />
            Sao chép
          </button>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            close()
            app.usePromo('CHAOMUNG')
          }}
        >
          Đặt lịch ngay
        </button>
        <button className="btn btn-line" onClick={close}>
          Để sau
        </button>
      </div>
    </div>
  )
}