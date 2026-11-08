import { useAdmin } from '../AdminContext.jsx'
import { eff, startOf } from '../../utils/appointments.js'
import { addDays, dkey, longDate, vnd, WDS } from '../../utils/helpers.js'

// Màn Tổng quan: số liệu nhanh, biểu đồ 7 ngày tới, dịch vụ nổi bật, lịch sắp tới
export default function Dashboard({ go }) {
  const { admin, appts, stats, staffOf } = useAdmin()
  const today = dkey(new Date())

  const live = appts.filter((a) => a.status !== 'cancelled')
  const upcoming = appts.filter((a) => eff(a) === 'upcoming').sort((a, b) => startOf(a) - startOf(b))
  const done = appts.filter((a) => eff(a) === 'done')
  const cancelled = appts.filter((a) => a.status === 'cancelled')
  const todayCount = upcoming.filter((a) => a.date === today).length
  const revenue = done.reduce((s, a) => s + a.total, 0)
  const openTickets = stats ? stats.openTickets : 0
  // Thẻ số liệu bấm được: chuyển tới màn tương ứng (cả bằng bàn phím)
  const kpiNav = (view) => ({
    role: 'button',
    tabIndex: 0,
    onClick: () => go(view),
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        go(view)
      }
    },
    style: { cursor: 'pointer' },
  })

  // 7 ngày tới (kể cả hôm nay)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i)
    const key = dkey(d)
    return { key, label: WDS[d.getDay()], date: d.getDate() + '/' + (d.getMonth() + 1), n: upcoming.filter((a) => a.date === key).length }
  })
  const maxDay = Math.max(1, ...days.map((d) => d.n))

  // Dịch vụ được đặt nhiều nhất
  const bySvc = {}
  const svcName = {}
  live.forEach((a) => {
    bySvc[a.svc] = (bySvc[a.svc] || 0) + 1
    svcName[a.svc] = a.svcName
  })
  const top = Object.entries(bySvc)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxSvc = Math.max(1, ...top.map((t) => t[1]))

  const hour = new Date().getHours()
  const hello = hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

  return (
    <>
      <div className="phead">
        <div>
          <p>{longDate(today)}</p>
          <h1>
            {hello}, {admin.name}
          </h1>
        </div>
      </div>

      <div className="kpis">
        <div className="card kpi" {...kpiNav('appts')}>
          <small>Lịch hôm nay</small>
          <b>{todayCount}</b>
          <span>Còn chờ đến khám hôm nay</span>
        </div>
        <div className="card kpi" {...kpiNav('appts')}>
          <small>Lịch sắp tới</small>
          <b>{upcoming.length}</b>
          <span>Đang chờ đến khám</span>
        </div>
        <div className="card kpi" {...kpiNav('revenue')}>
          <small>Doanh thu đã khám</small>
          <b>{vnd(revenue)}</b>
          <span>{done.length} lượt hoàn thành</span>
        </div>
        <div className="card kpi" {...kpiNav('customers')}>
          <small>Khách hàng</small>
          <b>{stats ? stats.customers : 0}</b>
          <span>
            {openTickets ? (
              <button
                className="link"
                onClick={(e) => {
                  e.stopPropagation()
                  go('tickets')
                }}
              >
                {openTickets} yêu cầu hỗ trợ chờ xử lý
              </button>
            ) : (
              'Không có yêu cầu chờ xử lý'
            )}
          </span>
        </div>
      </div>

      <div className="two">
        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>Lịch hẹn 7 ngày tới</h2>
          <div className="bars" role="img" aria-label="Số lịch hẹn mỗi ngày trong 7 ngày tới">
            {days.map((d) => (
              <div className="bar" key={d.key}>
                <b>{d.n}</b>
                <i style={{ height: Math.max(4, Math.round((d.n / maxDay) * 100)) + 'px' }}></i>
                <small>{d.label}</small>
                <small>{d.date}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>Dịch vụ được đặt nhiều</h2>
          {top.length ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {top.map(([id, n]) => (
                <div className="hbar" key={id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14 }}>
                    <span>{svcName[id] || id}</span>
                    <b>{n}</b>
                  </div>
                  <div className="t">
                    <i style={{ width: (n / maxSvc) * 100 + '%' }}></i>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="hint">Chưa có lịch hẹn nào.</p>
          )}
          <div className="meta" style={{ marginTop: 16 }}>
            <span className="pill pill-accent">{upcoming.length} sắp tới</span>
            <span className="pill pill-ok">{done.length} hoàn thành</span>
            <span className="pill pill-bad">{cancelled.length} đã hủy</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="sec-h">
          <h2>Lịch sắp tới</h2>
          <button className="link" onClick={() => go('appts')}>
            Xem tất cả
          </button>
        </div>
        {upcoming.length ? (
          <div className="tblwrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Khách</th>
                  <th>Dịch vụ</th>
                  <th>Thời gian</th>
                  <th>Bác sĩ</th>
                  <th>Thanh toán</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.slice(0, 6).map((a) => (
                  <tr key={a.id}>
                    <td>
                      <b>{a.user.name}</b>
                      <br />
                      <small className="hint">{a.user.phone || '—'}</small>
                    </td>
                    <td>
                      {a.svcName}
                      <br />
                      <small className="hint">Mã {a.id}</small>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {a.time}
                      <br />
                      <small className="hint">{longDate(a.date)}</small>
                    </td>
                    <td>{staffOf(a.staff)?.name || '—'}</td>
                    <td className="price">{vnd(a.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="hint">Chưa có lịch sắp tới.</p>
        )}
      </div>
    </>
  )
}