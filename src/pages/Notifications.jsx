import Icon from '../components/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { relTime } from '../utils/helpers.js'

// Loại thông báo: [biểu tượng, tông màu]
const TYPES = {
  booking: ['cal', 'accent'],
  remind: ['clock', 'sun'],
  promo: ['gift', 'ok'],
  system: ['bell', 'accent'],
}

// Màn Thông báo: bấm vào một thông báo để đánh dấu đã đọc
export default function Notifications() {
  const { user, updateUser } = useAuth()
  const list = user.notifs
  const unread = list.filter((n) => !n.read).length

  const readOne = (id) =>
    updateUser((u) => ({ ...u, notifs: u.notifs.map((n) => (n.id === id ? { ...n, read: true } : n)) }))
  const readAll = () => updateUser((u) => ({ ...u, notifs: u.notifs.map((n) => ({ ...n, read: true })) }))

  return (
    <>
      <div className="phead">
        <div>
          <h1>Thông báo</h1>
          <p>{unread ? unread + ' thông báo chưa đọc' : 'Bạn đã đọc hết thông báo'}</p>
        </div>
        <button className="btn btn-line btn-sm" disabled={!unread} onClick={readAll}>
          Đánh dấu đã đọc tất cả
        </button>
      </div>

      {list.length ? (
        <div className="nlist">
          {list.map((n) => {
            const [ic, tone] = TYPES[n.t] || TYPES.system
            return (
              <button key={n.id} className={'noti ' + (n.read ? '' : 'unread')} onClick={() => readOne(n.id)}>
                <span className={'ci av-' + tone} style={{ borderRadius: '50%' }}>
                  <Icon name={ic} size={20} />
                </span>
                <span className="grow">
                  <b>{n.title}</b>
                  <p>{n.body}</p>
                  <time>{relTime(n.ts)}</time>
                </span>
                {!n.read && <span className="dot" aria-label="Chưa đọc"></span>}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="empty card">
          <span className="big">
            <Icon name="bell" size={26} />
          </span>
          <p>Chưa có thông báo nào.</p>
        </div>
      )}
    </>
  )
}