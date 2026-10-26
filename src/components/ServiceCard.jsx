import Icon from './Icon.jsx'
import { catById } from '../utils/appointments.js'
import { vnd } from '../utils/helpers.js'

// Thẻ dịch vụ, dùng ở Trang chủ và màn Dịch vụ
export default function ServiceCard({ svc, onDetail, onBook }) {
  const c = catById(svc.cat)
  return (
    <article className="card scard">
      <div className="top">
        <span className="ci">
          <Icon name={c.ic} size={22} />
        </span>
        <div style={{ minWidth: 0 }}>
          <h3>{svc.name}</h3>
          <div className="meta">
            <span>
              <Icon name="clock" size={16} />
              {svc.dur} phút
            </span>
            <span>{c.name}</span>
          </div>
        </div>
      </div>
      <p className="d">{svc.desc}</p>
      <div className="foot">
        <span className="price">{vnd(svc.price)}</span>
        <span style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-line btn-sm" onClick={() => onDetail(svc.id)}>
            Chi tiết
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onBook(svc.id)}>
            Đặt lịch
          </button>
        </span>
      </div>
    </article>
  )
}