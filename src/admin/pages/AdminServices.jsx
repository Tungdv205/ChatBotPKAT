import { useState } from 'react'
import { useToast } from '../../components/Toast.jsx'
import { useAdmin } from '../AdminContext.jsx'
import { Modal, SearchBox, Toggle } from '../ui.jsx'
import { norm, vnd } from '../../utils/helpers.js'

const BLANK = { name: '', cat: 'noi', dur: 30, price: 150000, desc: '', hot: false }

// Dữ liệu gửi lên backend cho một dịch vụ
const serviceBody = (s, active) => ({
  name: String(s.name).trim(),
  cat: s.cat,
  dur: Number(s.dur),
  price: Number(s.price),
  hot: !!s.hot,
  desc: String(s.desc || '').trim(),
  inc: s.inc || [],
  active,
})

// Hộp thoại thêm / sửa dịch vụ
function Form({ init, onClose }) {
  const { cats, saveService } = useAdmin()
  const toast = useToast()
  const isNew = !init.id
  const [f, setF] = useState({ ...BLANK, ...init })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const dur = Number(f.dur)
    const price = Number(f.price)
    if (!f.name.trim()) return setErr('Nhập tên dịch vụ.')
    if (!Number.isInteger(dur) || dur < 15 || dur > 270) return setErr('Thời lượng từ 15 đến 270 phút.')
    if (!Number.isFinite(price) || price < 0) return setErr('Giá không hợp lệ.')
    setBusy(true)
    const r = await saveService(init.id || null, serviceBody({ ...init, ...f, dur, price }, init.active ?? true))
    setBusy(false)
    if (!r.ok) return setErr(r.error)
    toast(isNew ? 'Đã thêm dịch vụ' : 'Đã lưu dịch vụ')
    onClose()
  }

  return (
    <Modal title={isNew ? 'Thêm dịch vụ' : 'Sửa dịch vụ'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="sv-name">Tên dịch vụ</label>
          <input id="sv-name" type="text" value={f.name} onChange={set('name')} />
        </div>
        <div className="field">
          <label htmlFor="sv-cat">Chuyên khoa</label>
          <select id="sv-cat" value={f.cat} onChange={set('cat')}>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="formgrid">
          <div className="field">
            <label htmlFor="sv-dur">Thời lượng (phút)</label>
            <input id="sv-dur" type="number" min="15" max="270" step="5" value={f.dur} onChange={set('dur')} />
          </div>
          <div className="field">
            <label htmlFor="sv-price">Giá (đồng)</label>
            <input id="sv-price" type="number" min="0" step="1000" value={f.price} onChange={set('price')} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="sv-desc">Mô tả</label>
          <textarea id="sv-desc" value={f.desc} onChange={set('desc')} />
        </div>
        <label className="check">
          <input type="checkbox" checked={!!f.hot} onChange={set('hot')} />
          <span>Hiện trong mục "Dịch vụ được đặt nhiều"</span>
        </label>
        {err && <p className="err" role="alert">{err}</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Đang lưu...' : isNew ? 'Thêm dịch vụ' : 'Lưu thay đổi'}
          </button>
        </div>
        {!isNew && (
          <p className="hint" style={{ marginTop: 10 }}>
            Dịch vụ đã có lịch hẹn không xóa hẳn được. Muốn ngừng cung cấp, hãy tắt công tắc "Hiển thị" ở danh sách.
          </p>
        )}
      </form>
    </Modal>
  )
}

// Màn Dịch vụ: tìm, lọc chuyên khoa, thêm, sửa, ẩn/hiện
export default function AdminServices() {
  const { services, cats, catOf, saveService } = useAdmin()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [edit, setEdit] = useState(null)

  const key = norm(q.trim())
  const list = services.filter(
    (s) => (cat === 'all' || s.cat === cat) && (!key || norm(s.name + ' ' + (s.desc || '')).includes(key))
  )
  const toggle = async (s, on) => {
    const r = await saveService(s.id, serviceBody(s, on))
    toast(r.ok ? (on ? 'Đã hiện dịch vụ' : 'Đã ẩn dịch vụ khỏi trang đặt lịch') : r.error)
  }

  return (
    <>
      <div className="phead">
        <div>
          <h1>Dịch vụ</h1>
          <p>{services.length} dịch vụ. Tắt công tắc để ẩn dịch vụ khỏi trang đặt lịch.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEdit({})}>
          Thêm dịch vụ
        </button>
      </div>

      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Tìm tên hoặc mô tả dịch vụ" />
      </div>

      <div className="chips">
        <button className="chip" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
          Tất cả
        </button>
        {cats.map((c) => (
          <button key={c.id} className="chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="card">
        {list.length ? (
          <div className="tblwrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Dịch vụ</th>
                  <th>Chuyên khoa</th>
                  <th className="num">Thời lượng</th>
                  <th className="num">Giá</th>
                  <th>Hiển thị</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id} style={s.off ? { opacity: 0.55 } : undefined}>
                    <td>
                      <button className="rowbtn" onClick={() => setEdit(s)}>
                        {s.name}
                      </button>
                    </td>
                    <td>{catOf(s.cat)?.name}</td>
                    <td className="num">{s.dur} phút</td>
                    <td className="num price">{vnd(s.price)}</td>
                    <td>
                      <Toggle on={!s.off} onChange={(v) => toggle(s, v)} label={'Hiển thị ' + s.name} />
                    </td>
                    <td>
                      <button className="btn btn-line btn-sm" onClick={() => setEdit(s)}>
                        Sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="hint">Không có dịch vụ nào khớp.</p>
        )}
      </div>

      {edit && <Form init={edit} onClose={() => setEdit(null)} />}
    </>
  )
}