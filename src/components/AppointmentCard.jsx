import Icon from './Icon.jsx'
import { canChange, eff, staffById, svcById } from '../utils/appointments.js'
import { longDate, vnd } from '../utils/helpers.js'

// Hàng 5 sao để đánh giá lịch đã khám xong
function Stars({ appt, onRate }) {
  const r = appt.rating || 0
  return (
    <span className="stars" role="group" aria-label="Đánh giá">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} className={i <= r ? 'on' : ''} aria-label={i + ' sao'} onClick={() => onRate(appt.id, i)}>
          <Icon name="star" size={22} />
        </button>
      ))}
    </span>
  )
}

// Thẻ một lịch hẹn. Nút bấm thay đổi theo trạng thái: sắp tới, đã xong, đã hủy.
export default function AppointmentCard({ appt, confirming, on }) {
  const s = svcById(appt.svc)
  const st = staffById(appt.staff)
  const e = eff(appt)

  const pill =
    e === 'upcoming' ? (
      <span className="pill pill-accent">Sắp tới</span>
    ) : e === 'done' ? (
      <span className="pill pill-ok">Hoàn thành</span>
    ) : (
      <span className="pill pill-bad">Đã hủy</span>
    )

  let acts
  if (e === 'upcoming') {
    if (confirming) {
      acts = (
        <div className="confirm-row" style={{ width: '100%' }}>
          <span>
            Hủy lịch {s.name} lúc {appt.time}, {longDate(appt.date)}?
          </span>
          <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-sm btn-line" onClick={on.keep}>Giữ lịch</button>
            <button className="btn btn-sm btn-danger" onClick={() => on.doCancel(appt)}>Hủy lịch</button>
          </span>
        </div>
      )
    } else {
      acts = (
        <>
          <button className="btn btn-line btn-sm" onClick={() => on.resched(appt)}>Đổi lịch</button>
          <button className="btn btn-danger btn-sm" onClick={() => on.askCancel(appt)}>Hủy lịch</button>
          <button className="btn btn-line btn-sm" onClick={() => on.copy(appt)}>
            <Icon name="copy" size={16} />
            Sao chép
          </button>
          {!canChange(appt) && (
            <span className="hint">Trong vòng 2 giờ, vui lòng gọi hotline để đổi hoặc hủy.</span>
          )}
        </>
      )
    }
  } else if (e === 'done') {
    acts = (
      <>
        <Stars appt={appt} onRate={on.rate} />
        <button className="btn btn-primary btn-sm" onClick={() => on.rebook(appt)}>Đặt lại</button>
      </>
    )
  } else {
    acts = <button className="btn btn-primary btn-sm" onClick={() => on.rebook(appt)}>Đặt lại</button>
  }

  return (
    <article className="card appt">
      <div className="hd">
        <div style={{ minWidth: 0 }}>
          <h3>{s.name}</h3>
          <span className="code">Mã {appt.id}</span>
        </div>
        {pill}
      </div>
      <div className="meta">
        <span>
          <Icon name="cal" size={16} />
          {longDate(appt.date)}
        </span>
        <span>
          <Icon name="clock" size={16} />
          {appt.time} · {s.dur} phút
        </span>
        <span>
          <Icon name="user" size={16} />
          {st.name}
        </span>
      </div>
      {appt.note && <p className="hint">Ghi chú: {appt.note}</p>}
            {appt.cancelledBy === 'clinic' && (
        <p className="hint" style={{ color: 'var(--bad-text)' }}>
          Phòng khám đã hủy lịch này{appt.cancelReason ? '. Lý do: ' + appt.cancelReason : '.'}
        </p>
      )}
      <div className="meta">
        <span className="price" style={{ color: 'var(--ink)' }}>{vnd(appt.total)}</span>
        {appt.code && <span className="pill pill-sun">{appt.code}</span>}
      </div>
      <div className="acts">{acts}</div>
    </article>
  )
}