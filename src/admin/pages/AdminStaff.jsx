import { useState } from 'react'
import { useToast } from '../../components/Toast.jsx'
import { useAdmin } from '../AdminContext.jsx'
import { Modal, SearchBox, Toggle } from '../ui.jsx'
import { Avatar } from '../../components/Brand.jsx'
import { norm } from '../../utils/helpers.js'

const BLANK = { name: '', role: '', cats: [], years: 5, rating: 5 }

// Hộp thoại thêm / sửa bác sĩ, nhân viên
function Form({ init, onClose }) {
  const { cats, saveCatalog } = useAdmin()
  const toast = useToast()
  const isNew = !init.id
  const [f, setF] = useState({ ...BLANK, ...init })
  const [err, setErr] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const toggleCat = (id) =>
    setF({ ...f, cats: f.cats.includes(id) ? f.cats.filter((c) => c !== id) : [...f.cats, id] })

  const submit = (e) => {
    e.preventDefault()
    const years = Number(f.years)
    if (!f.name.trim()) return setErr('Nhập họ tên.')
    if (!f.role.trim()) return setErr('Nhập chức danh, ví dụ: Bác sĩ nhi khoa.')
    if (!f.cats.length) return setErr('Chọn ít nhất một chuyên khoa phụ trách.')
    if (!Number.isInteger(years) || years < 0 || years > 60) return setErr('Số năm kinh nghiệm từ 0 đến 60.')
    const s = { ...init, name: f.name.trim(), role: f.role.trim(), cats: f.cats, years, rating: f.rating }
    saveCatalog((c) => ({
      ...c,
      staff: isNew ? [...c.staff, { ...s, id: 'st' + Date.now().toString(36) }] : c.staff.map((x) => (x.id === init.id ? s : x)),
    }))
    toast(isNew ? 'Đã thêm nhân sự' : 'Đã lưu thông tin')
    onClose()
  }

  const del = () => {
    saveCatalog((c) => ({ ...c, staff: c.staff.filter((x) => x.id !== init.id) }))
    toast('Đã xóa nhân sự')
    onClose()
  }

  return (
    <Modal title={isNew ? 'Thêm bác sĩ, nhân viên' : 'Sửa thông tin'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="st-name">Họ tên (kèm học hàm, ví dụ BS. Nguyễn Văn A)</label>
          <input id="st-name" type="text" value={f.name} onChange={set('name')} />
        </div>
        <div className="field">
          <label htmlFor="st-role">Chức danh</label>
          <input id="st-role" type="text" value={f.role} onChange={set('role')} />
        </div>
        <div className="field">
          <span className="lbl">Chuyên khoa phụ trách</span>
          <div className="chips">
            {cats.map((c) => (
              <button key={c.id} type="button" className="chip" aria-pressed={f.cats.includes(c.id)} onClick={() => toggleCat(c.id)}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="st-years">Số năm kinh nghiệm</label>
          <input id="st-years" type="number" min="0" max="60" value={f.years} onChange={set('years')} />
        </div>
        {err && <p className="err" role="alert">{err}</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" type="submit">
            {isNew ? 'Thêm' : 'Lưu thay đổi'}
          </button>
          {!isNew &&
            (confirmDel ? (
              <button className="btn btn-danger" type="button" onClick={del}>
                Xác nhận xóa
              </button>
            ) : (
              <button className="btn btn-line" type="button" onClick={() => setConfirmDel(true)}>
                Xóa
              </button>
            ))}
        </div>
      </form>
    </Modal>
  )
}

// Màn Bác sĩ, nhân viên: tìm, thêm, sửa, bật/tắt làm việc, xóa
export default function AdminStaff() {
  const { staff, cats, saveCatalog } = useAdmin()
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(null)

  const key = norm(q.trim())
  const list = staff.filter((s) => !key || norm(s.name + ' ' + s.role).includes(key))
  const toggle = (id, on) =>
    saveCatalog((c) => ({ ...c, staff: c.staff.map((s) => (s.id === id ? { ...s, off: !on } : s)) }))
  const catNames = (s) => s.cats.map((id) => cats.find((c) => c.id === id)?.name).filter(Boolean)

  return (
    <>
      <div className="phead">
        <div>
          <h1>Bác sĩ, nhân viên</h1>
          <p>{staff.length} người. Tắt công tắc khi nhân sự tạm nghỉ.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEdit({})}>
          Thêm nhân sự
        </button>
      </div>

      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Tìm theo tên hoặc chức danh" />
      </div>

      {list.length ? (
        <div className="grid staffgrid">
          {list.map((s, i) => (
            <article key={s.id} className="card" style={{ display: 'grid', gap: 10, alignContent: 'start', opacity: s.off ? 0.6 : 1 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Avatar name={s.name} index={i} size={48} />
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: 16, lineHeight: 1.3 }}>{s.name}</h3>
                  <small className="hint">{s.role}</small>
                </div>
              </div>
              <div className="chips">
                {catNames(s).map((n) => (
                  <span key={n} className="pill pill-mute">
                    {n}
                  </span>
                ))}
              </div>
              <div className="meta">
                <span>{s.years} năm kinh nghiệm</span>
                <span>Đánh giá {s.rating}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <Toggle on={!s.off} onChange={(on) => toggle(s.id, on)} label={'Đang làm việc: ' + s.name} />
                  {s.off ? 'Tạm nghỉ' : 'Đang làm việc'}
                </span>
                <button className="btn btn-line btn-sm" onClick={() => setEdit(s)}>
                  Sửa
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty card">
          <p>Không có nhân sự nào khớp.</p>
        </div>
      )}

      {edit && <Form init={edit} onClose={() => setEdit(null)} />}
    </>
  )
}