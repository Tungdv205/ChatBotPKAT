import { useEffect, useState } from 'react'
import { useToast } from '../../components/Toast.jsx'
import { useAdmin } from '../AdminContext.jsx'
import { Modal, SearchBox } from '../ui.jsx'
import { Avatar } from '../../components/Brand.jsx'
import { eff, startOf } from '../../utils/appointments.js'
import { longDate, vnd } from '../../utils/helpers.js'

const PILL = {
  upcoming: ['pill-accent', 'Sắp tới'],
  done: ['pill-ok', 'Đã khám'],
  cancelled: ['pill-bad', 'Đã hủy'],
}
const SIZE = 20

// Hộp thoại chi tiết một khách: hồ sơ đầy đủ, lịch sử, sửa, khóa, xóa.
// Mỗi lần mở hồ sơ đầy đủ, backend ghi vào nhật ký (ai xem, lúc nào) để chống lạm dụng.
function Detail({ id, onClose, onChanged }) {
  const { adm } = useAdmin()
  const toast = useToast()
  const [u, setU] = useState(null)
  const [err, setErr] = useState('')
  const [mode, setMode] = useState('view') // view | edit | delete
  const [f, setF] = useState({ name: '', phone: '', dob: '', gender: '' })
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () =>
    adm('/api/admin/customers/' + id)
      .then((d) => {
        setU(d)
        setF({ name: d.name, phone: d.phone, dob: d.dob, gender: d.gender })
      })
      .catch((e) => setErr(e.message))
  useEffect(() => {
    load()
  }, [id])

  const run = async (fn, okMsg) => {
    setBusy(true)
    setErr('')
    try {
      await fn()
      if (okMsg) toast(okMsg)
      return true
    } catch (e) {
      setErr(e.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  const toggleLock = async () => {
    const lock = !u.locked
    const ok = await run(
      () => adm('/api/admin/customers/' + id + '/lock', { method: 'POST', body: { locked: lock } }),
      lock ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản'
    )
    if (ok) {
      await load()
      onChanged()
    }
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!f.name.trim()) return setErr('Nhập họ tên.')
    const ok = await run(
      () =>
        adm('/api/admin/customers/' + id, {
          method: 'PUT',
          body: { name: f.name.trim(), phone: f.phone.trim(), dob: f.dob, gender: f.gender },
        }),
      'Đã lưu thông tin khách'
    )
    if (ok) {
      setMode('view')
      await load()
      onChanged()
    }
  }

  const remove = async (e) => {
    e.preventDefault()
    if (!pw) return setErr('Nhập mật khẩu quản trị để xác nhận.')
    const ok = await run(
      () => adm('/api/admin/customers/' + id, { method: 'DELETE', body: { password: pw } }),
      'Đã xóa khách và toàn bộ dữ liệu của khách'
    )
    if (ok) {
      onChanged()
      onClose()
    }
  }

  if (!u) {
    return (
      <Modal title="Khách hàng" onClose={onClose}>
        {err ? <p className="err">{err}</p> : <p className="hint">Đang tải...</p>}
      </Modal>
    )
  }

  const appts = [...u.appts].sort((a, b) => startOf(b) - startOf(a))
  const done = appts.filter((a) => eff(a) === 'done')
  const spent = done.reduce((s, a) => s + a.total, 0)

  return (
    <Modal title={u.name} onClose={onClose}>
      {u.locked && (
        <div>
          <span className="pill pill-bad">Tài khoản đang bị khóa</span>
        </div>
      )}

      {mode === 'edit' ? (
        <form onSubmit={saveEdit} noValidate>
          <div className="field">
            <label htmlFor="cu-name">Họ và tên</label>
            <input id="cu-name" type="text" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="cu-phone">Số điện thoại</label>
            <input id="cu-phone" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          </div>
          <div className="formgrid">
            <div className="field">
              <label htmlFor="cu-dob">Ngày sinh</label>
              <input id="cu-dob" type="date" value={f.dob} onChange={(e) => setF({ ...f, dob: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="cu-gender">Giới tính</label>
              <select id="cu-gender" value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}>
                <option value="">Không nêu</option>
                <option value="Nữ">Nữ</option>
                <option value="Nam">Nam</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>
          {err && <p className="err" role="alert">{err}</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              Lưu thay đổi
            </button>
            <button className="btn btn-line" type="button" onClick={() => setMode('view')}>
              Hủy
            </button>
          </div>
        </form>
      ) : (
        <>
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
              <b>{appts.length}</b>
              <small>Lịch đã đặt</small>
            </div>
            <div className="stat">
              <b>{done.length}</b>
              <small>Đã khám</small>
            </div>
            <div className="stat">
              <b style={{ fontSize: 16 }}>{vnd(spent)}</b>
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
                        <b>{a.svcName}</b>
                        <span className={'pill ' + pc}>{pt}</span>
                      </div>
                      <small className="hint">
                        {a.time}, {longDate(a.date)} · {vnd(a.total)} · Mã {a.id}
                      </small>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="hint">Khách chưa đặt lịch nào.</p>
            )}
          </div>

          {err && <p className="err" role="alert">{err}</p>}

          {mode === 'delete' ? (
            <form onSubmit={remove} className="confirm-row" noValidate>
              <span>
                Xóa vĩnh viễn khách này cùng toàn bộ lịch hẹn, thông báo và yêu cầu hỗ trợ? Không thể khôi phục.
                Nhập mật khẩu quản trị của bạn để xác nhận.
              </span>
              <input
                type="password"
                aria-label="Mật khẩu quản trị"
                autoComplete="current-password"
                value={pw}
                onChange={(e) => {
                  setPw(e.target.value)
                  setErr('')
                }}
              />
              <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-sm btn-line" type="button" onClick={() => setMode('view')}>
                  Hủy
                </button>
                <button className="btn btn-sm btn-danger" type="submit" disabled={busy}>
                  {busy ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                </button>
              </span>
            </form>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-line btn-sm" onClick={() => setMode('edit')}>
                Sửa thông tin
              </button>
              <button className="btn btn-line btn-sm" disabled={busy} onClick={toggleLock}>
                {u.locked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setMode('delete')}>
                Xóa khách
              </button>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}

// Màn Khách hàng: tìm (trên máy chủ), phân trang, xem và quản lý từng khách.
// Số điện thoại trong danh sách bị che bớt; chỉ hiện đủ khi mở hồ sơ (và có ghi nhật ký).
export default function AdminCustomers() {
  const { adm } = useAdmin()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState({ items: [], total: 0, page: 0, size: SIZE })
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [open, setOpen] = useState(null)
  const [tick, setTick] = useState(0) // tăng lên để tải lại danh sách

  useEffect(() => setPage(0), [q])

  useEffect(() => {
    let off = false
    setLoading(true)
    const timer = setTimeout(() => {
      adm('/api/admin/customers?q=' + encodeURIComponent(q.trim()) + '&page=' + page + '&size=' + SIZE)
        .then((d) => {
          if (off) return
          setData(d)
          setErr('')
        })
        .catch((e) => !off && setErr(e.message))
        .finally(() => !off && setLoading(false))
    }, 250)
    return () => {
      off = true
      clearTimeout(timer)
    }
  }, [q, page, tick])

  const pages = Math.max(1, Math.ceil(data.total / SIZE))

  return (
    <>
      <div className="phead">
        <div>
          <h1>Khách hàng</h1>
          <p>{data.total} khách đã đăng ký tài khoản.</p>
        </div>
      </div>

      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Tìm theo tên hoặc email" />
      </div>

      <div className="card">
        {err ? (
          <p className="err">{err}</p>
        ) : data.items.length ? (
          <div className="tblwrap" style={{ opacity: loading ? 0.6 : 1 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Khách</th>
                  <th>Liên hệ</th>
                  <th className="num">Lịch đã đặt</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u, i) => (
                  <tr key={u.id}>
                    <td>
                      <button className="rowbtn" style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => setOpen(u.id)}>
                        <Avatar name={u.name} index={i} size={34} />
                        {u.name}
                      </button>
                    </td>
                    <td>
                      {u.phone || '—'}
                      <br />
                      <small className="hint">{u.email}</small>
                    </td>
                    <td className="num">{u.appts}</td>
                    <td>{u.locked ? <span className="pill pill-bad">Đã khóa</span> : <span className="pill pill-ok">Hoạt động</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="hint">{loading ? 'Đang tải...' : 'Không có khách nào khớp.'}</p>
        )}
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
          <button className="btn btn-line btn-sm" disabled={page <= 0} onClick={() => setPage(page - 1)}>
            Trang trước
          </button>
          <span className="hint">
            Trang {page + 1} / {pages}
          </span>
          <button className="btn btn-line btn-sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>
            Trang sau
          </button>
        </div>
      )}

      {open && <Detail id={open} onClose={() => setOpen(null)} onChanged={() => setTick((n) => n + 1)} />}
    </>
  )
}