import Icon from '../Icon.jsx'
import { Avatar } from '../Brand.jsx'
import { CATS, SERVICES, STAFF } from '../../data/catalog.js'
import { catById, staffById } from '../../utils/appointments.js'
import { vnd } from '../../utils/helpers.js'

// Bước 1: chọn dịch vụ. Nếu đã chọn bác sĩ từ trước thì chỉ hiện dịch vụ của bác sĩ đó.
export default function Step1Service({ b, set, onPickSvc }) {
  const st = b.staff !== 'any' ? staffById(b.staff) : null
  const cats = CATS.filter((c) => !st || st.cats.includes(c.id))
  const list = SERVICES.filter((s) => (b.cat === 'all' || s.cat === b.cat) && (!st || st.cats.includes(s.cat)))

  return (
    <>
      {st && (
        <div className="card hours">
          <Avatar name={st.name} index={STAFF.indexOf(st)} size={36} />
          <div>
            Đang xem dịch vụ của <b style={{ color: 'var(--ink)' }}>{st.name}</b>.{' '}
            <button className="link" onClick={() => set({ staff: 'any', cat: 'all' })}>
              Bỏ chọn bác sĩ
            </button>
          </div>
        </div>
      )}

      <div className="chips">
        <button className="chip" aria-pressed={b.cat === 'all'} onClick={() => set({ cat: 'all' })}>
          Tất cả
        </button>
        {cats.map((c) => (
          <button key={c.id} className="chip" aria-pressed={b.cat === c.id} onClick={() => set({ cat: c.id })}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="opts">
        {list.map((s) => {
          const on = b.svc === s.id
          const c = catById(s.cat)
          return (
            <button key={s.id} className="opt" aria-pressed={on} onClick={() => onPickSvc(s.id)}>
              <span className="ci">
                <Icon name={c.ic} size={20} />
              </span>
              <span className="grow">
                <b>{s.name}</b>
                <small>
                  {s.dur} phút · {c.name}
                </small>
              </span>
              <span className="price">{vnd(s.price)}</span>
              <span className="radio">{on && <Icon name="check" size={14} />}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}