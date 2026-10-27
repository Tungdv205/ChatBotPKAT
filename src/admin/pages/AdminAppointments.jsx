import { useState } from 'react'
import { useToast } from '../../components/Toast.jsx'
import { useAdmin } from '../AdminContext.jsx'
import { Modal, SearchBox } from '../ui.jsx'
import { eff, startOf } from '../../utils/appointments.js'
import { longDate, norm, vnd } from '../../utils/helpers.js'

const FILTERS = [
  ['all', 'Tất cả'],
  ['upcoming', 'Sắp tới'],
  ['done', 'Đã khám'],
  ['cancelled', 'Đã hủy'],
]
const PILL = {
  upcoming: ['pill-accent', 'Sắp tới'],
  done: ['pill-ok', 'Đã khám'],
  cancelled: ['pill-bad', 'Đã hủy'],
}

// Hộp thoại chi tiết một lịch hẹn
function Detail({ id, onClose }) {
  const { appts, svcOf, staffOf, staff, updateAppt } = useAdmin()
  const toast = useToast()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const a = appts.find((x) => x.id === id)
  if (!a) return null

  const svc = svcOf(a.svc)
  const st = eff(a)
  const [pc, pt] = PILL[st]
  const eligible = staff.filter((s) => svc && s.cats.includes(svc.cat))
  const when = svc.name + ' ngày ' + longDate(a.date) + ' lúc ' + a.time

  const act = (patch, notif, msg) => {
    updateAppt(a.user.email, a.id, patch, notif)
    toast(msg)
    setConfirmCancel(false)
  }

  return (
    <Modal title={'Lịch hẹn ' + a.id} onClose={onClose}>
      <div>
        <span className={'pill ' + pc}>{pt}</span>
      </div>
      <dl className="kv">
        <div>
          <dt>Khách</dt>
          <dd>
            {a.user.name}
            <br />
            <small className="hint">
              {a.user.phone || 'Chưa có số điện thoại'} · {a.user.email}
            </small>
          </dd>
        </div>
        <div>
          <dt>Dịch vụ</dt>
          <dd>{svc.name}</dd>
        </div>
        <div>
          <dt>Thời gian</dt>
          <dd>
            {a.time} · {svc.dur} phút
            <br />
            {longDate(a.date)}
          </dd>
        </div>
        <div>
          <dt>Ghi chú của khách</dt>
          <dd>{a.note || 'Không có'}</dd>
        </div>
        <div>
          <dt>Mã ưu đãi</dt>
          <dd>{a.code ? a.code + ' (-' + vnd(a.discount) + ')' : 'Không dùng'}</dd>
        </div>
        <div className="tot">
          <dt>Thanh toán tại quầy</dt>
          <dd>{vnd(a.total)}</dd>
        </div>
      </dl>

      <div className="field" style={{ margin: 0 }}>
        <label htmlFor="ad-staff">Bác sĩ phụ trách</label>
        <select
          id="ad-staff"
          value={a.staff}
          disabled={st !== 'upcoming'}
          onChange={(e) =>
            act(
              { staff: e.target.value },
              { title: 'Đổi bác sĩ phụ trách', body: 'Lịch ' + when + ' do ' + staffOf(e.target.value).name + ' phụ trách.' },
              'Đã đổi bác sĩ'
            )
          }
        >
          {!eligible.some((s) => s.id === a.staff) && <option value={a.staff}>{staffOf(a.staff)?.name || a.staff}</option>}
          {eligible.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {st === 'upcoming' &&
        (confirmCancel ? (
          <div className="confirm-row">
            <span>Hủy lịch này? Khách sẽ nhận được thông báo.</span>
            <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-sm btn-line" onClick={() => setConfirmCancel(false)}>
                Giữ lịch
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() =>
                  act(
                    { status: 'cancelled' },
                    { title: 'Phòng khám đã hủy lịch hẹn', body: 'Lịch ' + when + ' đã được hủy. Vui lòng đặt lại hoặc gọi hotline.' },
                    'Đã hủy lịch hẹn'
                  )
                }
              >
                Hủy lịch
              </button>
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() =>
                act(
                  { status: 'done' },
                  { title: 'Đã hoàn tất lịch khám', body: when + '. Bạn có thể đánh giá trong Lịch hẹn của tôi.' },
                  'Đã đánh dấu đã khám'
                )
              }
            >
              Đánh dấu đã khám
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmCancel(true)}>
              Hủy lịch
            </button>
          </div>
        ))}
      {st === 'cancelled' && (
        <div>
          <button
            className="btn btn-line btn-sm"
            onClick={() => act({ status: 'upcoming' }, { title: 'Lịch hẹn đã được khôi phục', body: 'Lịch ' + when + ' đã được khôi phục.' }, 'Đã khôi phục lịch')}
          >
            Khôi phục lịch
          </button>
        </div>
      )}
    </Modal>
  )
}

// Màn Lịch hẹn: tìm, lọc theo trạng thái và ngày, xem chi tiết, xử lý
export default function AdminAppointments() {
  const { appts, svcOf, staffOf } = useAdmin()
  const [q, setQ] = useState('')
  const [f, setF] = useState('all')
  const [date, setDate] = useState('')
  const [open, setOpen] = useState(null)

  const key = norm(q.trim())
  const match = (a) =>
    !key || norm([a.id, a.user.name, a.user.phone, a.user.email, svcOf(a.svc)?.name].join(' ')).includes(key)

  const base = appts.filter((a) => match(a) && (!date || a.date === date))
  const count = (id) => (id === 'all' ? base.length : base.filter((a) => eff(a) === id).length)
  const list = base
    .filter((a) => f === 'all' || eff(a) === f)
    .sort((a, b) => (f === 'upcoming' ? startOf(a) - startOf(b) : startOf(b) - startOf(a)))

  return (
    <>
      <div className="phead">
        <div>
          <h1>Lịch hẹn</h1>
          <p>Xem và xử lý lịch hẹn của tất cả khách.</p>
        </div>
      </div>

      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Tìm theo tên, số điện thoại, mã lịch, dịch vụ" />
        <div className="datef">
          <label className="lbl" htmlFor="ad-date">Ngày</label>
          <input id="ad-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          {date && (
            <button className="link" onClick={() => setDate('')}>
              Bỏ lọc
            </button>
          )}
        </div>
      </div>

      <div className="chips">
        {FILTERS.map(([id, label]) => (
          <button key={id} className="chip" aria-pressed={f === id} onClick={() => setF(id)}>
            {label} ({count(id)})
          </button>
        ))}
      </div>

      <div className="card">
        {list.length ? (
          <div className="tblwrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Khách</th>
                  <th>Dịch vụ</th>
                  <th>Thời gian</th>
                  <th>Bác sĩ</th>
                  <th className="num">Thanh toán</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => {
                  const [pc, pt] = PILL[eff(a)]
                  return (
                    <tr key={a.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="rowbtn" onClick={() => setOpen(a.id)}>
                          {a.id}
                        </button>
                      </td>
                      <td>
                        {a.user.name}
                        <br />
                        <small className="hint">{a.user.phone || a.user.email}</small>
                      </td>
                      <td>{svcOf(a.svc)?.name}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {a.time}
                        <br />
                        <small className="hint">{longDate(a.date)}</small>
                      </td>
                      <td>{staffOf(a.staff)?.name || '—'}</td>
                      <td className="num price">{vnd(a.total)}</td>
                      <td>
                        <span className={'pill ' + pc}>{pt}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="hint">Không có lịch hẹn nào khớp.</p>
        )}
      </div>

      {open && <Detail id={open} onClose={() => setOpen(null)} />}
    </>
  )
}