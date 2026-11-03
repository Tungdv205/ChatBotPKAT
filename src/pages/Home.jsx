import Icon from '../components/Icon.jsx'
import ServiceCard from '../components/ServiceCard.jsx'
import PromoCard from '../components/PromoCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { CATS, SERVICES, VOUCHERS } from '../data/catalog.js'
  import { apptSvc, canChange, staffById, upcomingList } from '../utils/appointments.js'
import { dkey, longDate, parseKey, WD } from '../utils/helpers.js'

// app: các hành động do App cấp (go, startBooking, openCategory, openService, reschedule, copyCode, usePromo)
export default function Home({ app }) {
  const { user } = useAuth()
  const first = user.name.trim().split(/\s+/).pop()
  const now = new Date()
  const h = now.getHours()
  const hello = h < 11 ? 'Chào buổi sáng' : h < 14 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
  const todayStr = WD[now.getDay()] + ', ' + now.getDate() + '/' + (now.getMonth() + 1) + '/' + now.getFullYear()

  const up = upcomingList(user.appts)
  const next = up[0]
  const unread = user.notifs.filter((n) => !n.read).length

  const tiles = [
    ['book', 'Đặt lịch mới', 'Chọn dịch vụ và giờ', 'calplus', 'accent'],
    ['services', 'Dịch vụ', SERVICES.length + ' dịch vụ, ' + CATS.length + ' chuyên khoa', 'grid', 'sun'],
    ['appts', 'Lịch hẹn của tôi', up.length ? up.length + ' lịch sắp tới' : 'Chưa có lịch sắp tới', 'cal', 'accent'],
    ['promos', 'Ưu đãi', VOUCHERS.length + ' mã đang chạy', 'tag', 'sun'],
    ['notifs', 'Thông báo', unread ? unread + ' chưa đọc' : 'Đã đọc hết', 'bell', 'bad'],
    ['profile', 'Hồ sơ', 'Thông tin và cài đặt', 'user', 'ok'],
    ['support', 'Hỗ trợ', 'Chat, nhân viên, câu hỏi', 'help', 'accent'],
  ]

  return (
    <>
      <div className="phead">
        <div>
          <p>{todayStr}</p>
          <h1>
            {hello}, {first}
          </h1>
        </div>
      </div>

      <NextAppointment next={next} app={app} />

      <section>
        <div className="sec-h">
          <h2>Menu</h2>
        </div>
        <div className="tiles">
          {tiles.map(([id, title, sub, ic, tone]) => (
            <button
              key={id}
              className="tile"
              onClick={() => (id === 'book' ? app.startBooking({}) : app.go(id))}
            >
              <span className={'ti av-' + tone}>
                <Icon name={ic} size={22} />
              </span>
              <div>
                <b>{title}</b>
                <small>{sub}</small>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="sec-h">
          <h2>Dịch vụ được đặt nhiều</h2>
          <button className="link" onClick={() => app.go('services')}>
            Xem tất cả
          </button>
        </div>
        <div className="chips" style={{ marginBottom: 12 }}>
          {CATS.map((c) => (
            <button key={c.id} className="chip" onClick={() => app.openCategory(c.id)}>
              <Icon name={c.ic} size={18} />
              {c.name}
            </button>
          ))}
        </div>
        <div className="grid svcgrid">
          {SERVICES.filter((s) => s.hot).map((s) => (
            <ServiceCard
              key={s.id}
              svc={s}
              onDetail={app.openService}
              onBook={(id) => app.startBooking({ svc: id, step: 2 })}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="sec-h">
          <h2>Ưu đãi cho bạn</h2>
          <button className="link" onClick={() => app.go('promos')}>
            Xem tất cả
          </button>
        </div>
        <div className="grid promogrid">
          {VOUCHERS.slice(0, 2).map((v) => (
            <PromoCard key={v.code} voucher={v} onCopy={app.copyCode} onUse={app.usePromo} />
          ))}
        </div>
      </section>

      <div className="card hours">
        <Icon name="clock" size={20} />
        <div>
          <b style={{ color: 'var(--ink)' }}>Giờ làm việc</b>
          <br />
          Thứ hai đến thứ bảy, 08:00 đến 18:00. Nghỉ trưa 12:00 đến 13:30. Chủ nhật nghỉ.
          <br />
          Khi cần cấp cứu, hãy gọi 115 hoặc đến cơ sở y tế gần nhất.
        </div>
      </div>
    </>
  )
}

// Thẻ lịch hẹn sắp tới (hoặc lời mời đặt lịch nếu chưa có)
function NextAppointment({ next, app }) {
  if (!next) {
    return (
      <section className="next">
        <span className="lab">Lịch hẹn sắp tới</span>
        <h2>Bạn chưa có lịch hẹn nào</h2>
        <p style={{ opacity: 0.8 }}>Chọn dịch vụ và giờ còn trống, chỉ mất khoảng một phút.</p>
        <div className="row">
          <button className="btn btn-primary btn-sm" onClick={() => app.startBooking({})}>
            <Icon name="plus" size={18} />
            Đặt lịch mới
          </button>
        </div>
      </section>
    )
  }
  const s = apptSvc(next)
  const st = staffById(next.staff)
  const diff = Math.round((parseKey(next.date) - parseKey(dkey(new Date()))) / 86400000)
  const cd = diff === 0 ? 'Hôm nay' : diff === 1 ? 'Ngày mai' : 'Còn ' + diff + ' ngày'
  return (
    <section className="next" aria-label="Lịch hẹn sắp tới">
      <span className="lab">Lịch hẹn sắp tới</span>
      <span className="cd">{cd}</span>
      <h2>{s.name}</h2>
      <div className="meta">
        <span>
          <Icon name="cal" size={18} />
          {longDate(next.date)}
        </span>
        <span>
          <Icon name="clock" size={18} />
          {next.time} · {s.dur} phút
        </span>
        <span>
          <Icon name="user" size={18} />
          {st.name}
        </span>
      </div>
      <div className="row">
        <button className="btn btn-primary btn-sm" onClick={() => app.go('appts')}>
          Xem chi tiết
        </button>
        {canChange(next) && (
          <button className="btn btn-line btn-sm" onClick={() => app.reschedule(next)}>
            Đổi lịch
          </button>
        )}
      </div>
    </section>
  )
}