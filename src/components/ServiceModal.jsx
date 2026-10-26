import { useEffect } from 'react'
import Icon from './Icon.jsx'
import { STAFF } from '../data/catalog.js'
import { catById, svcById } from '../utils/appointments.js'
import { vnd } from '../utils/helpers.js'

// Cửa sổ chi tiết dịch vụ. Bấm nền mờ, nút X hoặc phím Esc để đóng.
export default function ServiceModal({ id, onClose, onBook }) {
  const s = svcById(id)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!s) return null
  const c = catById(s.cat)
  const staff = STAFF.filter((x) => x.cats.includes(s.cat))

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={s.name}>
        <div className="hd">
          <div>
            <span className="pill pill-accent">{c.name}</span>
            <h2 style={{ marginTop: 8 }}>{s.name}</h2>
          </div>
          <button className="iconbtn" onClick={onClose} aria-label="Đóng">
            <Icon name="x" />
          </button>
        </div>

        <p>{s.desc}</p>
        <div className="meta">
          <span>
            <Icon name="clock" size={16} />
            {s.dur} phút
          </span>
          <span className="price" style={{ color: 'var(--ink)' }}>
            {vnd(s.price)}
          </span>
        </div>

        <div>
          <div className="lbl" style={{ marginBottom: 8 }}>Bao gồm</div>
          <ul className="inc">
            {s.inc.map((i) => (
              <li key={i}>
                <Icon name="check" size={18} />
                <span>{i}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="lbl" style={{ marginBottom: 8 }}>Bác sĩ phụ trách</div>
          <div className="chips">
            {staff.map((x) => (
              <span key={x.id} className="pill pill-mute">
                {x.name}
              </span>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-block" onClick={() => onBook(s.id)}>
          Đặt lịch dịch vụ này
        </button>
      </div>
    </div>
  )
}