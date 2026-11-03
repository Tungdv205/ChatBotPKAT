import { useState } from 'react'
import { useToast } from '../../components/Toast.jsx'
import { useAdmin } from '../AdminContext.jsx'
import { Modal, SearchBox } from '../ui.jsx'
import { norm, relTime } from '../../utils/helpers.js'

const DONE = 'Đã xử lý'
const FILTERS = [
  ['all', 'Tất cả'],
  ['open', 'Chờ xử lý'],
  ['done', 'Đã xử lý'],
]

// Hộp thoại xem và trả lời một yêu cầu
function Detail({ id, onClose }) {
  const { tickets, replyTicket } = useAdmin()
  const toast = useToast()
  const t = tickets.find((x) => x.id === id)
  const [reply, setReply] = useState(t?.reply || '')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (!t) return null
  const done = t.status === DONE

  const send = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return setErr('Nhập nội dung trả lời.')
    setBusy(true)
    const r = await replyTicket(t.id, reply.trim())
    setBusy(false)
    if (!r.ok) return setErr(r.error)
    toast('Đã gửi trả lời cho khách')
    onClose()
  }

  return (
    <Modal title={'Yêu cầu ' + t.id} onClose={onClose}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className={'pill ' + (done ? 'pill-ok' : 'pill-accent')}>{t.status}</span>
        <small className="hint">{relTime(t.ts)}</small>
      </div>
      <dl className="kv">
        <div>
          <dt>Khách</dt>
          <dd>
            {t.user.name}
            <br />
            <small className="hint">{t.user.phone || '—'}</small>
          </dd>
        </div>
        <div>
          <dt>Chủ đề</dt>
          <dd>{t.topic}</dd>
        </div>
      </dl>
      <div className="card" style={{ background: 'var(--surface-2)', borderColor: 'transparent' }}>
        {t.msg}
      </div>
      <form onSubmit={send} noValidate>
        <div className="field">
          <label htmlFor="tk-reply">Trả lời khách</label>
          <textarea
            id="tk-reply"
            maxLength={800}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Nội dung sẽ gửi vào Thông báo của khách"
          />
        </div>
        {err && <p className="err" role="alert">{err}</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Đang gửi...' : done ? 'Gửi lại trả lời' : 'Gửi trả lời và đánh dấu đã xử lý'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Màn Yêu cầu hỗ trợ: các yêu cầu khách gửi từ màn Hỗ trợ
export default function AdminTickets() {
  const { tickets } = useAdmin()
  const [q, setQ] = useState('')
  const [f, setF] = useState('all')
  const [open, setOpen] = useState(null)

  const key = norm(q.trim())
  const base = tickets.filter((t) => !key || norm([t.id, t.topic, t.msg, t.user.name].join(' ')).includes(key))
  const isDone = (t) => t.status === DONE
  const count = (id) => (id === 'all' ? base.length : base.filter((t) => (id === 'done') === isDone(t)).length)
  const list = base
    .filter((t) => f === 'all' || (f === 'done') === isDone(t))
    .sort((a, b) => b.ts - a.ts)

  return (
    <>
      <div className="phead">
        <div>
          <h1>Yêu cầu hỗ trợ</h1>
          <p>Trả lời yêu cầu khách gửi từ màn Hỗ trợ. Khách nhận câu trả lời trong Thông báo.</p>
        </div>
      </div>

      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Tìm theo mã, chủ đề, nội dung, tên khách" />
      </div>

      <div className="chips">
        {FILTERS.map(([id, label]) => (
          <button key={id} className="chip" aria-pressed={f === id} onClick={() => setF(id)}>
            {label} ({count(id)})
          </button>
        ))}
      </div>

      {list.length ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,340px),1fr))' }}>
          {list.map((t) => (
            <button key={t.id} className="card tkcard" onClick={() => setOpen(t.id)}>
              <span className="r">
                <b>{t.topic}</b>
                <span className={'pill ' + (isDone(t) ? 'pill-ok' : 'pill-accent')}>{t.status}</span>
              </span>
              <span className="hint clamp">{t.msg}</span>
              <small className="hint">
                {t.user.name} · Mã {t.id} · {relTime(t.ts)}
              </small>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty card">
          <p>Chưa có yêu cầu hỗ trợ nào khớp.</p>
        </div>
      )}

      {open && <Detail id={open} onClose={() => setOpen(null)} />}
    </>
  )
}