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
function Detail({ id, startCancel, startDelete, onClose }) {
  const { appts, staffOf, cancelAppt, doneAppt, deleteAppt } = useAdmin()
  const toast = useToast()
  const [confirmCancel, setConfirmCancel] = useState(!!startCancel)
  const [confirmDelete, setConfirmDelete] = useState(!!startDelete)
  const [reason, setReason] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const a = appts.find((x) => x.id === id)
  if (!a) return null

  const st = eff(a)
  const [pc, pt] = PILL[st]

  const markDone = async () => {
    setBusy(true)
    const r = await doneAppt(a.id)
    setBusy(false)
    if (!r.ok) return setErr(r.error)
    toast('Đã đánh dấu đã khám, khách đã nhận thông báo')
    onClose()
  }

  const cancel = async () => {
    if (!reason.trim()) return setErr('Nhập lý do hủy để gửi cho khách.')
    setBusy(true)
    const r = await cancelAppt(a.id, reason.trim())
    setBusy(false)
    if (!r.ok) return setErr(r.error)
    toast('Đã hủy lịch, khách đã nhận thông báo')
    onClose()
  }

  const remove = async () => {
    setBusy(true)
    const r = await deleteAppt(a.id)
    setBusy(false)
    if (!r.ok) return setErr(r.error)
    toast('Đã xóa lịch hẹn')
    onClose()
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
            <small className="hint">{a.user.phone || 'Chưa có số điện thoại'} (đã che bớt để bảo mật)</small>
          </dd>
        </div>
        <div>
          <dt>Dịch vụ</dt>
          <dd>{a.svcName}</dd>
        </div>
        <div>
          <dt>Bác sĩ phụ trách</dt>
          <dd>{staffOf(a.staff)?.name || a.staff}</dd>
        </div>
        <div>
          <dt>Thời gian</dt>
          <dd>
            {a.time} · {a.dur} phút
            <br />
            {longDate(a.date)}
          </dd>
        </div>
        <div>
          <dt>Ghi chú của khách</dt>
          <dd>{a.note || 'Không có'}</dd>
        </div>
        {a.cancelReason && (
          <div>
            <dt>Lý do hủy</dt>
            <dd>{a.cancelReason}</dd>
          </div>
        )}
        <div>
          <dt>Mã ưu đãi</dt>
          <dd>{a.code || 'Không dùng'}</dd>
        </div>
        <div className="tot">
          <dt>Thanh toán tại quầy</dt>
          <dd>{vnd(a.total)}</dd>
        </div>
      </dl>

      {err && <p className="err" role="alert">{err}</p>}

      {st === 'upcoming' &&
        (confirmCancel ? (
          <div className="confirm-row">
            <span>Hủy lịch này? Khách sẽ nhận được thông báo kèm lý do bên dưới.</span>
            <textarea
              aria-label="Lý do hủy"
              placeholder="Lý do hủy gửi cho khách, ví dụ: bác sĩ có việc đột xuất"
              maxLength={200}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setErr('')
              }}
              style={{ minHeight: 64 }}
            />
            <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-sm btn-line" disabled={busy} onClick={() => setConfirmCancel(false)}>
                Giữ lịch
              </button>
              <button className="btn btn-sm btn-danger" disabled={busy} onClick={cancel}>
                {busy ? 'Đang hủy...' : 'Xác nhận hủy lịch'}
              </button>
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={markDone}>
              Đánh dấu đã khám
            </button>
            <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => setConfirmCancel(true)}>
              Hủy lịch
            </button>
          </div>
        ))}

      {st !== 'upcoming' &&
        (confirmDelete ? (
          <div className="confirm-row">
            <span>Xóa hẳn lịch này khỏi danh sách? Không thể khôi phục.</span>
            <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-sm btn-line" disabled={busy} onClick={() => setConfirmDelete(false)}>
                Không xóa
              </button>
              <button className="btn btn-sm btn-danger" disabled={busy} onClick={remove}>
                {busy ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </span>
          </div>
        ) : (
          <div>
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>
              Xóa lịch
            </button>
          </div>
        ))}
    </Modal>
  )
}

// Màn Lịch hẹn: tìm, lọc theo trạng thái và ngày, xem chi tiết, xử lý, xóa lịch đã xử lý
export default function AdminAppointments() {
  const { appts, staffOf } = useAdmin()
  const [q, setQ] = useState('')
  const [f, setF] = useState('all')
  const [date, setDate] = useState('')
  const [open, setOpen] = useState(null) // { id, cancel, del }

  const key = norm(q.trim())
  const match = (a) =>
    !key || norm([a.id, a.user.name, a.svcName].join(' ')).includes(key)

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
        <SearchBox value={q} onChange={setQ} placeholder="Tìm theo tên khách, mã lịch, dịch vụ" />
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
                  <th>Ghi chú của khách</th>
                  <th className="num">Thanh toán</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => {
                  const [pc, pt] = PILL[eff(a)]
                  return (
                    <tr key={a.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="rowbtn" onClick={() => setOpen({ id: a.id })}>
                          {a.id}
                        </button>
                      </td>
                      <td>
                        {a.user.name}
                        <br />
                        <small className="hint">{a.user.phone || '—'}</small>
                      </td>
                      <td>{a.svcName}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {a.time}
                        <br />
                        <small className="hint">{longDate(a.date)}</small>
                      </td>
                      <td>{staffOf(a.staff)?.name || '—'}</td>
                      <td style={{ minWidth: 170, maxWidth: 260 }}>
                        {a.note ? <span className="clamp">{a.note}</span> : <small className="hint">Không có</small>}
                      </td>
                      <td className="num price">{vnd(a.total)}</td>
                      <td>
                        <span className={'pill ' + pc}>{pt}</span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn btn-line btn-sm" onClick={() => setOpen({ id: a.id })}>
                          Chi tiết
                        </button>{' '}
                        {eff(a) === 'upcoming' ? (
                          <button className="btn btn-danger btn-sm" onClick={() => setOpen({ id: a.id, cancel: true })}>
                            Hủy lịch
                          </button>
                        ) : (
                          <button className="btn btn-danger btn-sm" onClick={() => setOpen({ id: a.id, del: true })}>
                            Xóa
                          </button>
                        )}
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

      {open && (
        <Detail
          key={open.id + (open.cancel ? 'c' : '') + (open.del ? 'd' : '')}
          id={open.id}
          startCancel={open.cancel}
          startDelete={open.del}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  )
}