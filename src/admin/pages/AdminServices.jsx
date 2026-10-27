import { useState } from 'react'
import { useToast } from '../../components/Toast.jsx'
import { useAdmin } from '../AdminContext.jsx'
import { Modal, SearchBox, Toggle } from '../ui.jsx'
import { norm, vnd } from '../../utils/helpers.js'

const BLANK = { name: '', cat: 'noi', dur: 30, price: 150000, desc: '', hot: false }

// Hộp thoại thêm / sửa dịch vụ
function Form({ init, onClose }) {
  const { cats, saveCatalog } = useAdmin()
  const toast = useToast()
  const isNew = !init.id
  const [f, setF] = useState({ ...BLANK, ...init })
  const [err, setErr] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const submit = (e) => {
    e.preventDefault()
    const dur = Number(f.dur)
    const price = Number(f.price)
    if (!f.name.trim()) return setErr('Nhập tên dịch vụ.')
    if (!Number.isInteger(dur) || dur < 10 || dur > 240) return setErr('Thời lượng từ 10 đến 240 phút.')
    if (!Number.isFinite(price) || price < 0) return setErr('Giá không hợp lệ.')
    const svc = { ...init, name: f.name.trim(), cat: f.cat, dur, price, desc: f.desc.trim(), hot: !!f.hot, inc: init.inc || [] }
    saveCatalog((c) => ({
      ...c,
      services: isNew
        ? [...c.services, { ...svc, id: 's' + Date.now().toString(36) }]
        : c.services.map((s) => (s.id === init.id ? svc : s)),
    }))
    toast(isNew ? 'Đã thêm dịch vụ' : 'Đã lưu dịch vụ')
    onClose()
  }

  const del = () => {
    saveCatalog((c) => ({ ...c, services: c.services.filter((s) => s.id !== init.id) }))
    toast('Đã xóa dịch vụ')
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
            <input id="sv-dur" type="number" min="10" max="240" step="5" value={f.dur} onChange={set('dur')} />
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
          <button className="btn btn-primary" type="submit">
            {isNew ? 'Thêm dịch vụ' : 'Lưu thay đổi'}
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

// Màn Dịch vụ: tìm, lọc chuyên khoa, thêm, sửa, ẩn/hiện, xóa
export default function AdminServices() {
  const { services, cats, catOf, saveCatalog } = useAdmin()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [edit, setEdit] = useState(null)

  const key = norm(q.trim())
  const list = services.filter(
    (s) => (cat === 'all' || s.cat === cat) && (!key || norm(s.name + ' ' + (s.desc || '')).includes(key))
  )
  const toggle = (id, on) =>
    saveCatalog((c) => ({ ...c, services: c.services.map((s) => (s.id === id ? { ...s, off: !on } : s)) }))

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
                      <Toggle on={!s.off} onChange={(v) => toggle(s.id, v)} label={'Hiển thị ' + s.name} />
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