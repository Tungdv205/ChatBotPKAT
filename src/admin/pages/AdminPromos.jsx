import { useState } from 'react'
import { useToast } from '../../components/Toast.jsx'
import { useAdmin } from '../AdminContext.jsx'
import { Modal, SearchBox, Toggle } from '../ui.jsx'
import { norm, vnd } from '../../utils/helpers.js'

const BLANK = { code: '', title: '', type: 'pct', val: 10, max: 100000, min: 0, cat: '', note: '' }

// Dữ liệu gửi lên backend cho một mã ưu đãi
const voucherBody = (v, active) => ({
  code: v.code,
  title: String(v.title).trim(),
  type: v.type,
  val: Number(v.val),
  max: Number(v.max),
  min: Number(v.min),
  cat: v.cat || null,
  note: String(v.note || '').trim(),
  active,
})

const describe = (v) => (v.type === 'pct' ? 'Giảm ' + v.val + '%, tối đa ' + vnd(v.max) : 'Giảm ' + vnd(v.val))

// Hộp thoại thêm / sửa mã ưu đãi
function Form({ init, onClose }) {
  const { vouchers, cats, saveVoucher, removeVoucher } = useAdmin()
  const toast = useToast()
  const isNew = !init.code
  const [f, setF] = useState({ ...BLANK, ...init, cat: init.cat || '' })
  const [err, setErr] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const code = f.code.trim().toUpperCase()
    const val = Number(f.val)
    const max = Number(f.max)
    const min = Number(f.min)
    if (!/^[A-Z0-9]{3,12}$/.test(code)) return setErr('Mã gồm 3 đến 12 chữ hoặc số, không dấu, không khoảng trắng.')
    if (isNew && vouchers.some((v) => v.code === code)) return setErr('Mã này đã tồn tại.')
    if (!f.title.trim()) return setErr('Nhập tên chương trình.')
    if (!(val > 0)) return setErr('Mức giảm phải lớn hơn 0.')
    if (f.type === 'pct' && val > 100) return setErr('Giảm theo phần trăm không quá 100.')
    if (f.type === 'pct' && !(max > 0)) return setErr('Nhập mức giảm tối đa.')
    if (!(min >= 0)) return setErr('Đơn tối thiểu không hợp lệ.')
    setBusy(true)
    const r = await saveVoucher(
      isNew ? null : init.code,
      voucherBody({ code, title: f.title, type: f.type, val, max: f.type === 'pct' ? max : val, min, cat: f.cat, note: f.note }, init.active ?? true)
    )
    setBusy(false)
    if (!r.ok) return setErr(r.error)
    toast(isNew ? 'Đã thêm mã ưu đãi' : 'Đã lưu mã ưu đãi')
    onClose()
  }

  const del = async () => {
    setBusy(true)
    const r = await removeVoucher(init.code)
    setBusy(false)
    if (!r.ok) return setErr(r.error)
    toast('Đã xóa mã ưu đãi')
    onClose()
  }

  return (
    <Modal title={isNew ? 'Thêm mã ưu đãi' : 'Sửa mã ' + init.code} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="formgrid">
          <div className="field">
            <label htmlFor="pv-code">Mã</label>
            <input
              id="pv-code"
              type="text"
              value={f.code}
              disabled={!isNew}
              onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })}
              style={{ textTransform: 'uppercase' }}
            />
          </div>
          <div className="field">
            <label htmlFor="pv-type">Kiểu giảm</label>
            <select id="pv-type" value={f.type} onChange={set('type')}>
              <option value="pct">Giảm theo phần trăm</option>
              <option value="fix">Giảm số tiền cố định</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="pv-title">Tên chương trình</label>
          <input id="pv-title" type="text" value={f.title} onChange={set('title')} />
        </div>
        <div className="formgrid">
          <div className="field">
            <label htmlFor="pv-val">{f.type === 'pct' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (đồng)'}</label>
            <input id="pv-val" type="number" min="0" value={f.val} onChange={set('val')} />
          </div>
          {f.type === 'pct' && (
            <div className="field">
              <label htmlFor="pv-max">Giảm tối đa (đồng)</label>
              <input id="pv-max" type="number" min="0" step="1000" value={f.max} onChange={set('max')} />
            </div>
          )}
          <div className="field">
            <label htmlFor="pv-min">Đơn tối thiểu (đồng)</label>
            <input id="pv-min" type="number" min="0" step="1000" value={f.min} onChange={set('min')} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="pv-cat">Áp dụng cho</label>
          <select id="pv-cat" value={f.cat} onChange={set('cat')}>
            <option value="">Mọi dịch vụ</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="pv-note">Ghi chú hiển thị cho khách</label>
          <input id="pv-note" type="text" value={f.note} onChange={set('note')} placeholder="Ví dụ: Tối đa 100.000đ, cho đơn từ 200.000đ" />
        </div>
        {err && <p className="err" role="alert">{err}</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Đang lưu...' : isNew ? 'Thêm mã' : 'Lưu thay đổi'}
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

// Màn Ưu đãi: tìm, thêm, sửa, bật/tắt, xóa mã giảm giá
export default function AdminPromos() {
  const { vouchers, catOf, saveVoucher } = useAdmin()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(null)

  const key = norm(q.trim())
  const list = vouchers.filter((v) => !key || norm(v.code + ' ' + v.title).includes(key))
  const toggle = async (v, on) => {
    const r = await saveVoucher(v.code, voucherBody(v, on))
    toast(r.ok ? (on ? 'Đã bật mã ' + v.code : 'Đã tạm dừng mã ' + v.code) : r.error)
  }

  return (
    <>
      <div className="phead">
        <div>
          <h1>Ưu đãi</h1>
          <p>{vouchers.length} mã giảm giá. Tắt công tắc để tạm dừng một mã.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEdit({})}>
          Thêm mã ưu đãi
        </button>
      </div>

      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Tìm theo mã hoặc tên chương trình" />
      </div>

      <div className="card">
        {list.length ? (
          <div className="tblwrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Chương trình</th>
                  <th>Mức giảm</th>
                  <th>Điều kiện</th>
                  <th>Đang chạy</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((v) => (
                  <tr key={v.code} style={v.off ? { opacity: 0.55 } : undefined}>
                    <td>
                      <button className="rowbtn" onClick={() => setEdit(v)}>
                        {v.code}
                      </button>
                    </td>
                    <td>{v.title}</td>
                    <td>{describe(v)}</td>
                    <td>
                      {v.cat ? catOf(v.cat)?.name : 'Mọi dịch vụ'}
                      {v.min > 0 && (
                        <>
                          <br />
                          <small className="hint">Đơn từ {vnd(v.min)}</small>
                        </>
                      )}
                    </td>
                    <td>
                      <Toggle on={!v.off} onChange={(on) => toggle(v, on)} label={'Bật mã ' + v.code} />
                    </td>
                    <td>
                      <button className="btn btn-line btn-sm" onClick={() => setEdit(v)}>
                        Sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="hint">Không có mã nào khớp.</p>
        )}
      </div>

      {edit && <Form init={edit} onClose={() => setEdit(null)} />}
    </>
  )
}