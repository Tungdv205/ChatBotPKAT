import { useMemo, useState } from 'react'
import { useAdmin } from '../AdminContext.jsx'
import { eff } from '../../utils/appointments.js'
import { addDays, dkey, parseKey, vnd } from '../../utils/helpers.js'

const MODES = [
  ['day', 'Theo ngày'],
  ['week', 'Theo tuần'],
  ['month', 'Theo tháng'],
]
const COUNT = { day: 14, week: 8, month: 12 } // số mốc hiển thị
const NOW = { day: 'Hôm nay', week: 'Tuần này', month: 'Tháng này' }
const PREV = { day: 'Hôm qua', week: 'Tuần trước', month: 'Tháng trước' }
const UNIT = { day: 'Ngày', week: 'Tuần', month: 'Tháng' }

const two = (n) => String(n).padStart(2, '0')
const monday = (d) => addDays(d, -((d.getDay() + 6) % 7)) // thứ Hai của tuần chứa d

// Mốc (ngày, tuần, tháng) mà một ngày hẹn rơi vào
function bucketKey(mode, dateStr) {
  if (mode === 'day') return dateStr
  if (mode === 'week') return dkey(monday(parseKey(dateStr)))
  return dateStr.slice(0, 7)
}

// Danh sách mốc từ cũ tới mới, mốc cuối là hôm nay / tuần này / tháng này.
// Tính từ ngày hiện tại nên sang ngày (tuần, tháng) mới thì mốc mới tự bắt đầu từ 0.
function buildBuckets(mode) {
  const today = new Date()
  const n = COUNT[mode]
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    if (mode === 'day') {
      const d = addDays(today, -i)
      const label = d.getDate() + '/' + (d.getMonth() + 1)
      out.push({ key: dkey(d), label, full: label })
    } else if (mode === 'week') {
      const d = addDays(monday(today), -7 * i)
      const e = addDays(d, 6)
      const label = d.getDate() + '/' + (d.getMonth() + 1)
      out.push({ key: dkey(d), label, full: label + ' – ' + e.getDate() + '/' + (e.getMonth() + 1) })
    } else {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const m = d.getMonth() + 1
      out.push({
        key: d.getFullYear() + '-' + two(m),
        label: m + '/' + String(d.getFullYear()).slice(2),
        full: 'Tháng ' + m + '/' + d.getFullYear(),
      })
    }
  }
  return out
}

// Số tiền rút gọn để ghi trên cột: 150k, 1,2tr
const short = (v) => (v >= 1e6 ? (v / 1e6).toFixed(1).replace('.', ',') + 'tr' : Math.round(v / 1000) + 'k')

// Biểu đồ cột kèm đường xu hướng (tăng giảm giữa các mốc)
function Chart({ rows, mode }) {
  const W = 640
  const H = 250
  const top = 26
  const bottom = 30
  const n = rows.length
  const slot = W / n
  const bw = Math.min(40, slot * 0.6)
  const max = Math.max(1, ...rows.map((r) => r.total))
  const y = (v) => top + (H - top - bottom) * (1 - v / max)
  const cx = (i) => slot * i + slot / 2
  const line = rows.map((r, i) => cx(i) + ',' + y(r.total)).join(' ')

  return (
    <svg
      viewBox={'0 0 ' + W + ' ' + H}
      role="img"
      aria-label={'Biểu đồ doanh thu ' + UNIT[mode].toLowerCase() + ' gần đây'}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <line x1="0" y1={H - bottom} x2={W} y2={H - bottom} stroke="var(--line)" />
      {rows.map((r, i) => (
        <g key={r.key}>
          <title>{r.full + ': ' + vnd(r.total) + ' (' + r.n + ' lượt)'}</title>
          <rect
            x={cx(i) - bw / 2}
            y={y(r.total)}
            width={bw}
            height={H - bottom - y(r.total)}
            rx="4"
            fill="var(--accent)"
            opacity={0.9}
          />
          {r.total > 0 && n <= 14 && (
            <text x={cx(i)} y={y(r.total) - 6} textAnchor="middle" fontSize="11" fill="var(--muted)">
              {short(r.total)}
            </text>
          )}
          <text x={cx(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--muted)">
            {r.label}
          </text>
        </g>
      ))}
      <polyline points={line} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" opacity="0.7" />
      {rows.map((r, i) => (
        <circle key={r.key} cx={cx(i)} cy={y(r.total)} r="3.5" fill="var(--ink)" opacity="0.7" />
      ))}
    </svg>
  )
}

// Phần trăm tăng giảm so với mốc trước (null nếu mốc trước bằng 0)
const pctChange = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null)

function Delta({ pct }) {
  if (pct === null) return <span className="hint">—</span>
  if (pct === 0) return <span className="pill">Không đổi</span>
  return pct > 0 ? (
    <span className="pill pill-ok">▲ +{pct}%</span>
  ) : (
    <span className="pill pill-bad">▼ {pct}%</span>
  )
}

// Màn Doanh thu: chỉ tính các lượt đã khám, xem theo ngày, tuần, tháng
export default function AdminRevenue({ go }) {
  const { appts } = useAdmin()
  const [mode, setMode] = useState('day')

  const rows = useMemo(() => {
    const buckets = buildBuckets(mode).map((b) => ({ ...b, total: 0, n: 0 }))
    const at = {}
    buckets.forEach((b, i) => {
      at[b.key] = i
    })
    appts
      .filter((a) => eff(a) === 'done')
      .forEach((a) => {
        const i = at[bucketKey(mode, a.date)]
        if (i !== undefined) {
          buckets[i].total += a.total
          buckets[i].n += 1
        }
      })
    return buckets
  }, [appts, mode])

  const cur = rows[rows.length - 1]
  const prev = rows[rows.length - 2]
  const sum = rows.reduce((s, r) => s + r.total, 0)
  const count = rows.reduce((s, r) => s + r.n, 0)
  const pct = pctChange(cur.total, prev.total)

  return (
    <>
      <div className="phead">
        <div>
          <h1>Doanh thu</h1>
          <p>Chỉ tính các lượt đã khám. Sang ngày, tuần, tháng mới thì mốc mới tự bắt đầu từ 0.</p>
        </div>
        <button className="btn btn-line btn-sm" onClick={() => go('dash')}>
          Về Tổng quan
        </button>
      </div>

      <div className="chips">
        {MODES.map(([id, label]) => (
          <button key={id} className="chip" aria-pressed={mode === id} onClick={() => setMode(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="kpis">
        <div className="card kpi">
          <small>{NOW[mode]}</small>
          <b>{vnd(cur.total)}</b>
          <span>{cur.n} lượt đã khám</span>
        </div>
        <div className="card kpi">
          <small>{PREV[mode]}</small>
          <b>{vnd(prev.total)}</b>
          <span>
            <Delta pct={pct} /> so với {PREV[mode].toLowerCase()}
          </span>
        </div>
        <div className="card kpi">
          <small>
            Tổng {rows.length} {UNIT[mode].toLowerCase()} gần nhất
          </small>
          <b>{vnd(sum)}</b>
          <span>{count} lượt đã khám</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Biểu đồ doanh thu {UNIT[mode].toLowerCase()}</h2>
        <Chart rows={rows} mode={mode} />
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Chi tiết từng {UNIT[mode].toLowerCase()}</h2>
        <div className="tblwrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{UNIT[mode]}</th>
                <th className="num">Số lượt</th>
                <th className="num">Doanh thu</th>
                <th>Tăng giảm</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .map((r, i) => ({ r, d: i > 0 ? pctChange(r.total, rows[i - 1].total) : null }))
                .reverse()
                .map(({ r, d }) => (
                  <tr key={r.key}>
                    <td>{r.full}</td>
                    <td className="num">{r.n}</td>
                    <td className="num price">{vnd(r.total)}</td>
                    <td>
                      <Delta pct={d} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}