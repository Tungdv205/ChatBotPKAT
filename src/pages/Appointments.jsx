import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import AppointmentCard from '../components/AppointmentCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { apptSvc, canChange, eff, staffById, startOf, svcById, upcomingList } from '../utils/appointments.js'
import { copyText } from '../utils/clipboard.js'
import { longDate } from '../utils/helpers.js'

const TABS = [
  ['upcoming', 'Sắp tới'],
  ['done', 'Đã xong'],
  ['cancelled', 'Đã hủy'],
]
const EMPTY_TEXT = {
  upcoming: 'Bạn chưa có lịch sắp tới.',
  done: 'Chưa có lịch nào hoàn thành.',
  cancelled: 'Bạn chưa hủy lịch nào.',
}

// Màn Lịch hẹn của tôi: xem, đổi, hủy, đánh giá và đặt lại lịch hẹn
export default function Appointments({ app }) {
  const { user, cancelAppt, rateAppt } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState('upcoming')
  const [confirmId, setConfirmId] = useState(null) // lịch đang hỏi xác nhận hủy

  const sorted = [...user.appts].sort((a, b) => startOf(b) - startOf(a))
  const lists = {
    upcoming: upcomingList(user.appts),
    done: sorted.filter((a) => eff(a) === 'done'),
    cancelled: sorted.filter((a) => a.status === 'cancelled'),
  }
  const cur = lists[tab]

  const on = {
    resched: (a) => app.reschedule(a),
    askCancel: (a) => {
      if (!canChange(a)) return toast('Còn dưới 2 giờ nên không thể hủy trực tuyến. Hãy gọi hotline.')
      setConfirmId(a.id)
    },
    keep: () => setConfirmId(null),
    doCancel: async (a) => {
      const r = await cancelAppt(a.id)
      setConfirmId(null)
      toast(r.ok ? 'Đã hủy lịch hẹn' : r.error)
    },
    copy: (a) =>
      copyText(
        'Phòng khám đa khoa Anh Thu - ' + apptSvc(a).name + ' - ' + a.time + ', ' + longDate(a.date) +
          ' - Bác sĩ ' + staffById(a.staff).name + ' - Mã ' + a.id,
        'Đã sao chép thông tin lịch hẹn',
        toast
      ),
    rate: async (id, n) => {
      const r = await rateAppt(id, n)
      toast(r.ok ? 'Cảm ơn bạn đã đánh giá ' + n + ' sao' : r.error)
    },
    // Dịch vụ đã ngừng cung cấp thì đặt lại từ đầu
    rebook: (a) => app.startBooking(svcById(a.svc) ? { svc: a.svc, step: 2 } : {}),
  }

  return (
    <>
      <div className="phead">
        <div>
          <h1>Lịch hẹn của tôi</h1>
          <p>Xem, đổi, hủy và đánh giá lịch hẹn.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => app.startBooking({})}>
          <Icon name="plus" size={18} />
          Đặt lịch mới
        </button>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => {
              setTab(id)
              setConfirmId(null)
            }}
          >
            {label} ({lists[id].length})
          </button>
        ))}
      </div>

      {cur.length ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,380px),1fr))' }}>
          {cur.map((a) => (
            <AppointmentCard key={a.id} appt={a} confirming={confirmId === a.id} on={on} />
          ))}
        </div>
      ) : (
        <div className="empty card">
          <span className="big">
            <Icon name="cal" size={26} />
          </span>
          <p>{EMPTY_TEXT[tab]}</p>
          {tab === 'upcoming' && (
            <button className="btn btn-primary btn-sm" onClick={() => app.startBooking({})}>
              Đặt lịch mới
            </button>
          )}
        </div>
      )}
    </>
  )
}