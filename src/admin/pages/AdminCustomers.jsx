import { useState } from 'react'
import { useAdmin } from '../AdminContext.jsx'
import { Modal, SearchBox } from '../ui.jsx'
import { Avatar } from '../../components/Brand.jsx'
import { eff, startOf } from '../../utils/appointments.js'
import { longDate, norm, vnd } from '../../utils/helpers.js'

const PILL = {
  upcoming: ['pill-accent', 'Sắp tới'],
  done: ['pill-ok', 'Đã khám'],
  cancelled: ['pill-bad', 'Đã hủy'],
}

// Tổng hợp số liệu một khách
const stats = (u) => {
  const done = u.appts.filter((a) => eff(a) === 'done')
  return { total: u.appts.length, done: done.length, spent: done.reduce((s, a) => s + a.total, 0) }
}

// Hộp thoại chi tiết một khách và lịch sử đặt lịch
function Detail({ email, onClose }) {
  const { customers, svcOf, staffOf } = useAdmin()
  const u = customers.find((c) => c.email === email)
  if (!u) return null
  const s = stats(u)
  const appts = [...u.appts].sort((a, b) => startOf(b) - startOf(a))

  return (
    <Modal title={u.name} onClose={onClose}>
      <dl className="kv">
        <div>
          <dt>Email</dt>
          <dd>{u.email}</dd>
        </div>
        <div>
          <dt>Số điện thoại</dt>
          <dd>{u.phone || 'Chưa có'}</dd>
        </div>
        <div>
          <dt>Ngày sinh</dt>
          <dd>{u.dob ? longDate(u.dob) : 'Chưa có'}</dd>
        </div>
        <div>
          <dt>Giới tính</dt>
          <dd>{u.gender || 'Không nêu'}</dd>
        </div>
      </dl>
      <div className="stats">
        <div className="stat">
          <b>{s.total}</b>
          <small>Lịch đã đặt</small>
        </div>
        <div className="stat">
          <b>{s.done}</b>
          <small>Đã khám</small>
        </div>
        <div className="stat">
          <b style={{ fontSize: 16 }}>{vnd(s.spent)}</b>
          <small>Đã chi</small>
        </div>
      </div>
      <div>
        <div className="lbl" style={{ marginBottom: 8 }}>Lịch sử đặt lịch</div>
        {appts.length ? (
          <div style={{ display: 'grid', gap: 8 }}>
            {appts.map((a) => {
              const [pc, pt] = PILL[eff(a)]
              return (
                <div key={a.id} className="card" style={{ padding: 12, display: 'grid', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                    <b>{svcOf(a.svc)?.name}</b>
                    <span className={'pill ' + pc}>{pt}</span>
                  </div>
                  <small className="hint">
                    {a.time}, {longDate(a.date)} · {staffOf(a.staff)?.name} · {vnd(a.total)} · Mã {a.id}
                  </small>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="hint">Khách chưa đặt lịch nào.</p>
        )}
      </div>
    </Modal>
  )
}

// Màn Khách hàng: tìm và xem hồ sơ, lịch sử của từng khách
export default function AdminCustomers() {
  const { customers } = useAdmin()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)

  const key = norm(q.trim())
  const list = customers
    .filter((u) => !key || norm([u.name, u.email, u.phone].join(' ')).includes(key))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'))

  return (
    <>
      <div className="phead">
        <div>
          <h1>Khách hàng</h1>
          <p>{customers.length} khách đã đăng ký tài khoản.</p>
        </div>
      </div>

      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Tìm theo tên, email, số điện thoại" />
      </div>

      <div className="card">
        {list.length ? (
          <div className="tblwrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Khách</th>
                  <th>Liên hệ</th>
                  <th className="num">Lịch đã đặt</th>
                  <th className="num">Đã khám</th>
                  <th className="num">Đã chi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((u, i) => {
                  const s = stats(u)
                  return (
                    <tr key={u.email}>
                      <td>
                        <button className="rowbtn" style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => setOpen(u.email)}>
                          <Avatar name={u.name} index={i} size={34} />
                          {u.name}
                        </button>
                      </td>
                      <td>
                        {u.phone || '—'}
                        <br />
                        <small className="hint">{u.email}</small>
                      </td>
                      <td className="num">{s.total}</td>
                      <td className="num">{s.done}</td>
                      <td className="num price">{vnd(s.spent)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="hint">Không có khách nào khớp.</p>
        )}
      </div>

      {open && <Detail email={open} onClose={() => setOpen(null)} />}
    </>
  )
}