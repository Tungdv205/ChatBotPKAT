import { useEffect, useState } from 'react'
import Icon from '../components/Icon.jsx'
import ServiceCard from '../components/ServiceCard.jsx'
import ServiceModal from '../components/ServiceModal.jsx'
import { CATS, SERVICES } from '../data/catalog.js'
import { norm } from '../utils/helpers.js'

// preset: { cat, detail } do màn khác truyền sang (vd bấm chuyên khoa ở Trang chủ)
export default function Services({ app, preset }) {
  const [cat, setCat] = useState(preset.cat)
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState(preset.detail)

  // Đã đọc xong dữ liệu chuyển tiếp thì xóa đi, lần vào sau từ menu sẽ không bị lọc sẵn
  useEffect(() => {
    app.clearSvcPreset()
  }, [])

  const key = norm(q.trim())
  const list = SERVICES.filter(
    (s) => (cat === 'all' || s.cat === cat) && (!key || norm(s.name + ' ' + s.desc).includes(key))
  )

  const clearFilter = () => {
    setCat('all')
    setQ('')
  }

  return (
    <>
      <div className="phead">
        <div>
          <h1>Dịch vụ</h1>
          <p>Chọn chuyên khoa để lọc. Giá niêm yết, thanh toán tại quầy sau khi khám.</p>
        </div>
      </div>

      <div className="search">
        <Icon name="search" size={20} />
        <label className="sr" htmlFor="q">Tìm dịch vụ</label>
        <input
          id="q"
          type="search"
          placeholder="Tìm dịch vụ, ví dụ: siêu âm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="chips">
        <button className="chip" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
          Tất cả
        </button>
        {CATS.map((c) => (
          <button key={c.id} className="chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
            <Icon name={c.ic} size={18} />
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid svcgrid">
        {list.length === 0 ? (
          <div className="empty" style={{ gridColumn: '1 / -1' }}>
            <span className="big">
              <Icon name="search" size={26} />
            </span>
            <p>Không tìm thấy dịch vụ phù hợp.</p>
            <button className="btn btn-line btn-sm" onClick={clearFilter}>
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          list.map((s) => (
            <ServiceCard
              key={s.id}
              svc={s}
              onDetail={setDetail}
              onBook={(id) => app.startBooking({ svc: id, step: 2 })}
            />
          ))
        )}
      </div>

      {detail && (
        <ServiceModal
          id={detail}
          onClose={() => setDetail(null)}
          onBook={(id) => app.startBooking({ svc: id, step: 2 })}
        />
      )}
    </>
  )
}