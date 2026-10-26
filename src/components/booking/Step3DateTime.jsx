import { useEffect, useRef } from 'react'
import { firstOpenDate, LUNCH, slotState, slotsFor } from '../../utils/booking.js'
import { addDays, dkey, longDate, parseKey, tstr, WDS } from '../../utils/helpers.js'

// Bước 3: chọn ngày (21 ngày tới) và giờ còn trống
export default function Step3DateTime({ svc, b, set, appts }) {
  // Chưa chọn ngày thì mặc định ngày gần nhất còn giờ trống
  const date = b.date || firstOpenDate(appts, svc, b.staff, b.editId)
  const cur = parseKey(date)
  const days = Array.from({ length: 21 }, (_, i) => dkey(addDays(new Date(), i)))

  // Cuộn dải ngày tới ngày đang chọn khi mới vào bước này
  const strip = useRef(null)
  useEffect(() => {
    const el = strip.current
    if (!el) return
    const sel = el.querySelector('.day[aria-pressed=true]')
    if (sel) el.scrollLeft = Math.max(0, sel.offsetLeft - el.offsetLeft - 16)
  }, [])

  const all = slotsFor(svc)
  const am = all.filter((m) => m < LUNCH[0])
  const pm = all.filter((m) => m >= LUNCH[1])
  const okCount = all.filter((m) => slotState(appts, svc, b.staff, date, m, b.editId) === 'ok').length
  const renderSlots = (arr) => (
    <div className="slots">
      {arr.map((m) => {
        const st = slotState(appts, svc, b.staff, date, m, b.editId)
        const tip =
          st === 'mine' ? 'Bạn đã có lịch khác vào giờ này' : st === 'busy' ? 'Đã kín lịch' : st === 'past' ? 'Đã qua' : undefined
        return (
          <button
            key={m}
            className="slot"
            aria-pressed={b.time === tstr(m)}
            disabled={st !== 'ok'}
            title={tip}
            onClick={() => set({ date, time: tstr(m) })}
          >
            {tstr(m)}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="card" style={{ display: 'grid', gap: 14, gridTemplateColumns: 'minmax(0, 1fr)' }}>
      <div>
        <div className="lbl">
          Tháng {cur.getMonth() + 1}, {cur.getFullYear()}
        </div>
        <div className="datestrip" role="group" aria-label="Chọn ngày" ref={strip}>
          {days.map((k) => {
            const d = parseKey(k)
            const closed = d.getDay() === 0
            return (
              <button
                key={k}
                className="day"
                aria-pressed={k === date}
                disabled={closed}
                aria-label={longDate(k) + (closed ? ', nghỉ' : '')}
                onClick={() => set({ date: k, time: null })}
              >
                <small>{WDS[d.getDay()]}</small>
                <b>{d.getDate()}</b>
                <small>{closed ? 'Nghỉ' : 'Th' + (d.getMonth() + 1)}</small>
              </button>
            )
          })}
        </div>
      </div>

      <p className="hint">
               Thời lượng {svc.dur} phút. Giờ gạch ngang đã kín lịch.
      </p>

      {am.length > 0 && (
        <div>
          <div className="lbl" style={{ marginBottom: 8 }}>Buổi sáng</div>
          {renderSlots(am)}
        </div>
      )}
      {pm.length > 0 && (
        <div>
          <div className="lbl" style={{ marginBottom: 8 }}>Buổi chiều</div>
          {renderSlots(pm)}
        </div>
      )}

      {okCount === 0 && (
        <p className="err" style={{ margin: 0 }}>
                   Ngày này đã hết giờ trống. Hãy chọn ngày khác.
        </p>
      )}
    </div>
  )
}