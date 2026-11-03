import { useEffect } from 'react'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'
  import { apptSvc, staffById } from '../utils/appointments.js'
import { copyText } from '../utils/clipboard.js'
import { longDate, vnd } from '../utils/helpers.js'

// Màn báo đã lưu lịch hẹn, hiện sau khi đặt hoặc đổi lịch xong
export default function BookingSuccess({ app, apptId }) {
  const { user } = useAuth()
  const toast = useToast()
  const a = user.appts.find((x) => x.id === apptId)

  // Không tìm thấy lịch (vd tải lại trang) thì về danh sách lịch hẹn
  useEffect(() => {
    if (!a) app.go('appts')
  }, [a])
  if (!a) return null

  const s = apptSvc(a)
  const st = staffById(a.staff)

  const copyInfo = () =>
    copyText(
      'Phòng khám đa khoa Anh Thu - ' + s.name + ' - ' + a.time + ', ' + longDate(a.date) + ' - Bác sĩ ' + st.name + ' - Mã ' + a.id,
      'Đã sao chép thông tin lịch hẹn',
      toast
    )

  return (
    <>
      <div className="ok-hero">
        <span className="big">
          <Icon name="check" size={32} />
        </span>
        <h1 style={{ fontSize: 26 }}>Đã lưu lịch hẹn</h1>
        <p className="hint">
          Mã lịch <b style={{ color: 'var(--ink)' }}>{a.id}</b>. Bạn sẽ nhận nhắc lịch trước 24 giờ.
        </p>
      </div>

      <div className="card">
        <dl className="kv">
          <div>
            <dt>Dịch vụ</dt>
            <dd>{s.name}</dd>
          </div>
          <div>
            <dt>Bác sĩ</dt>
            <dd>{st.name}</dd>
          </div>
          <div>
            <dt>Thời gian</dt>
            <dd>
              {a.time}
              <br />
              {longDate(a.date)}
            </dd>
          </div>
          <div className="tot">
            <dt>Thanh toán tại quầy</dt>
            <dd>{vnd(a.total)}</dd>
          </div>
        </dl>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => app.go('appts')}>
          Xem lịch hẹn của tôi
        </button>
        <button className="btn btn-line" onClick={copyInfo}>
          <Icon name="copy" size={18} />
          Sao chép thông tin
        </button>
        <button className="btn btn-line" onClick={() => app.go('home')}>
          Về trang chủ
        </button>
      </div>
    </>
  )
}