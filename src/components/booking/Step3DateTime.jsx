import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/client.js'
import { LUNCH } from '../../utils/booking.js'
import { addDays, dkey, longDate, mins, parseKey, WDS } from '../../utils/helpers.js'

// Bước 3: chọn ngày (21 ngày tới) và giờ còn trống. Giờ trống do backend tính theo lịch thật.
export default function Step3DateTime({ svc, b, set }) {
  const [slots, setSlots] = useState(null) // null = đang tải
  const [err, setErr] = useState('')
  const [tries, setTries] = useState(0) // tăng lên để tải lại sau lỗi
  const days = Array.from({ length: 21 }, (_, i) => dkey(addDays(new Date(), i)))

  const query = (d) =>
    '/api/slots?svc=' + encodeURIComponent(svc.id) + '&staff=' + encodeURIComponent(b.staff || 'any') +
    '&date=' + d + (b.editId ? '&exceptId=' + encodeURIComponent(b.editId) : '')

  useEffect(() => {
    let off = false
    setErr('')
    setSlots(null)
    if (b.date) {
      api(query(b.date))
        .then((res) => !off && setSlots(res.slots))
        .catch((e) => !off && setErr(e.message))
    } else {
      // Chưa chọn ngày: tìm ngày gần nhất còn giờ trống
      ;(async () => {
        try {
          for (const k of days) {
            if (parseKey(k).getDay() === 0) continue
            const res = await api(query(k))
            if (off) return
            if (res.slots.some((s) => s.state === 'ok')) return set({ date: k })
          }
          if (!off) set({ date: days[0] })
        } catch (e) {
          if (!off) setErr(e.message)
        }
      })()
    }
    return () => {
      off = true
    }
  }, [svc.id, b.date, b.staff, b.editId, tries])

  const date = b.date || days[0]
  const cur = parseKey(date)

  // Cuộn dải ngày tới ngày đang chọn
  const strip = useRef(null)
  useEffect(() => {
    const el = strip.current
    if (!el) return
    const sel = el.querySelector('.day[aria-pressed=true]')
    if (sel) el.scrollLeft = Math.max(0, sel.offsetLeft - el.offsetLeft - 16)
  }, [b.date])

  const list = slots || []
  const am = list.filter((s) => mins(s.time) < LUNCH[0])
  const pm = list.filter((s) => mins(s.time) >= LUNCH[1])
  const okCount = list.filter((s) => s.state === 'ok').length

  const renderSlots = (arr) => (
    <div className="slots">
      {arr.map((s) => {
        const tip =
          s.state === 'mine'
            ? 'Bạn đã có lịch khác vào giờ này'
            : s.state === 'busy'
              ? 'Đã kín lịch'
              : s.state === 'past'
                ? 'Đã qua'
                : undefined
        return (
          <button
            key={s.time}
            className="slot"
            aria-pressed={b.time === s.time}
            disabled={s.state !== 'ok'}
            title={tip}
            onClick={() => set({ date, time: s.time })}
          >
            {s.time}
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
                aria-pressed={k === b.date}
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

      <p className="hint">Thời lượng {svc.dur} phút. Giờ gạch ngang đã kín lịch.</p>

      {err ? (
        <p className="err" style={{ margin: 0 }}>
          {err}{' '}
          <button className="link" onClick={() => setTries((n) => n + 1)}>
            Thử lại
          </button>
        </p>
      ) : slots === null ? (
        <p className="hint">Đang tải giờ trống...</p>
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}