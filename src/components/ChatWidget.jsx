import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client.js'
import Icon from './Icon.jsx'
import { SERVICES, VOUCHERS } from '../data/catalog.js'
import { norm, vnd } from '../utils/helpers.js'

/* ---------- Chatbot ----------
   ĐIỂM TÍCH HỢP AI: thay nội dung hàm botReply bằng lời gọi tới dịch vụ chatbot thật.
   Nhận câu người dùng gõ, trả về { text, actions? } hoặc một Promise của giá trị đó.
   actions: [{ l: 'Nhãn nút', a: 'go' | 'support', v: 'tên màn hình / tab' }] */
const svc = (id) => SERVICES.find((s) => s.id === id)

function botReply(raw) {
  const q = norm(raw)
  const has = (re) => re.test(q)
  if (has(/cap cuu|kho tho|dau nguc|ngat|co giat|chay mau|tai bien|dot quy/))
    return { text: 'Nội dung bạn nhắc đến có thể là tình huống khẩn cấp. Hãy gọi 115 hoặc đến cơ sở y tế gần nhất ngay. Đặt lịch trực tuyến không dành cho cấp cứu.' }
  if (has(/nhan vien|nguoi that|tu van vien|le tan|tong dai|gap nguoi/))
    return { text: 'Mình chuyển bạn sang tab Nhân viên. Bạn có thể gọi hotline hoặc gửi yêu cầu, nhân viên phản hồi trong giờ làm việc.', actions: [{ l: 'Liên hệ nhân viên', a: 'support', v: 'staff' }] }
  if (has(/huy|doi lich|doi gio|doi hen/))
    return { text: 'Bạn đổi hoặc hủy miễn phí trước giờ hẹn ít nhất 2 giờ, trong mục Lịch hẹn của tôi. Sát giờ hơn, vui lòng gọi hotline.', actions: [{ l: 'Mở lịch hẹn', a: 'go', v: 'appts' }] }
  if (has(/dat lich|dat hen|lich hen|hen kham|dang ky kham|muon kham/))
    return { text: 'Bạn chọn dịch vụ, rồi chọn giờ còn trống.. Xác nhận xong là có lịch, thanh toán tại quầy sau khi khám.', actions: [{ l: 'Đặt lịch ngay', a: 'go', v: 'book' }, { l: 'Xem dịch vụ', a: 'go', v: 'services' }] }
  if (has(/gio|mo cua|lam viec|chu nhat|nghi trua/))
    return { text: 'Phòng khám làm việc thứ hai đến thứ bảy, 08:00 đến 18:00, nghỉ trưa 12:00 đến 13:30. Chủ nhật nghỉ.' }
  if (has(/uu dai|ma giam|voucher|khuyen mai|giam gia/))
    return { text: 'Mã đang có:\n' + VOUCHERS.map((v) => v.code + ': ' + v.title).join('\n') + '\nNhập mã ở bước Xác nhận khi đặt lịch.', actions: [{ l: 'Xem ưu đãi', a: 'go', v: 'promos' }] }
  if (has(/\bgia\b|phi|bao nhieu|thanh toan|tra tien/))
    return { text: 'Giá từng dịch vụ có trong mục Dịch vụ, ví dụ khám nội tổng quát ' + vnd(svc('s1').price) + ', khám nhi ' + vnd(svc('s4').price) + '. Bạn thanh toán tại quầy sau khi khám.', actions: [{ l: 'Xem dịch vụ', a: 'go', v: 'services' }] }
  if (has(/giay to|cccd|bhyt|bao hiem|mang theo/))
    return { text: 'Bạn mang theo CCCD, thẻ bảo hiểm y tế nếu có, cùng đơn thuốc hoặc kết quả khám trước đó.' }
  if (has(/nhin an|xet nghiem|sieu am bung/))
    return { text: 'Xét nghiệm máu tổng quát và siêu âm bụng thường cần nhịn ăn 6 đến 10 giờ. Phòng khám sẽ dặn kỹ khi xác nhận lịch.' }
  if (has(/^(xin chao|chao|hello|hi|alo)( |$)/))
    return { text: 'Xin chào, mình có thể giúp gì cho bạn?' }
  return { text: 'Mình chưa có câu trả lời cho nội dung này. Bạn có thể đặt lịch tư vấn miễn phí với nhân viên, hoặc xem câu hỏi thường gặp.', actions: [{ l: 'Đặt lịch tư vấn', a: 'consult' }, { l: 'Câu hỏi thường gặp', a: 'support', v: 'faq' }, { l: 'Gặp nhân viên', a: 'support', v: 'staff' }] }
}
// Cấp cứu trả lời cố định ngay. Câu khác hỏi AI (backend) trước; AI lỗi thì dùng quy tắc có sẵn.
const EMERGENCY = /cap cuu|kho tho|dau nguc|ngat|co giat|chay mau|tai bien|dot quy/
const POOL = [
  'Giờ làm việc của phòng khám?',
  'Cách đặt lịch khám?',
  'Có ưu đãi nào không?',
  'Cần mang giấy tờ gì?',
  'Đổi hoặc hủy lịch thế nào?',
  'Giá khám nội tổng quát?',
]
const localSuggest = (raw) => POOL.filter((s) => norm(s) !== norm(raw)).slice(0, 3)

async function smartReply(raw) {
  if (EMERGENCY.test(norm(raw))) return { ...botReply(raw), suggestions: [] }
  try {
    const res = await api('/api/chat', { method: 'POST', body: { message: raw }, token: null })
    if (res && res.text) {
      const sug = Array.isArray(res.suggestions) && res.suggestions.length ? res.suggestions.slice(0, 3) : localSuggest(raw)
      const actions = res.needStaff
        ? [
          { l: 'Đặt lịch tư vấn', a: 'consult' },
          { l: 'Gặp nhân viên', a: 'support', v: 'staff' },
        ]
        : [{ l: 'Đặt lịch ngay', a: 'go', v: 'book' }]
      return { text: res.text, actions, suggestions: sug }
    }
  } catch (e) {
    /* AI lỗi hoặc hết lượt: dùng quy tắc có sẵn */
  }
  return { ...botReply(raw), suggestions: localSuggest(raw) }
}
const GREETING = {
  from: 'bot',
  text: 'Xin chào, mình là trợ lý của Phòng khám đa khoa Anh Thu. Mình hỗ trợ đặt lịch, giờ làm việc, ưu đãi và giấy tờ cần mang. Mình không chẩn đoán bệnh.',
}
const QUICK = ['Đặt lịch khám', 'Giờ làm việc', 'Ưu đãi', 'Giấy tờ cần mang', 'Gặp nhân viên']

/* ---------- Vị trí nút kéo thả ---------- */
const FABK = 'hengio.fab.v1'
const FS = 56 // kích thước nút
const FM = 12 // lề tối thiểu

function readSaved() {
  try {
    const r = JSON.parse(localStorage.getItem(FABK))
    if (r && (r.side === 'l' || r.side === 'r') && typeof r.yr === 'number') return r
  } catch (e) {
    /* bỏ qua */
  }
  return null
}
function clamp(x, y) {
  const W = window.innerWidth
  const H = window.innerHeight
  return {
    x: Math.min(Math.max(FM, x), Math.max(FM, W - FS - FM)),
    y: Math.min(Math.max(FM + 20, y), Math.max(FM, H - FS - FM)),
  }
}
function place(saved) {
  const W = window.innerWidth
  const H = window.innerHeight
  if (saved) return clamp(saved.side === 'l' ? FM : W - FS - FM, saved.yr * (H - FS - 2 * FM) + FM)
  return clamp(W - FS - FM, H - FS - (W < 900 ? 96 : 32))
}
export default function ChatWidget({ loggedIn, onGo, onSupport, onConsult, onNeedLogin }) {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([GREETING])
  const [typing, setTyping] = useState(false)
  const [draft, setDraft] = useState('')

  const [pos, setPos] = useState(() => place(readSaved()))
  const [dragging, setDragging] = useState(false)
  const posRef = useRef(pos)
  const savedRef = useRef(readSaved())
  const drag = useRef(null)
  const logRef = useRef(null)
  const inputRef = useRef(null)

  const move = (p) => {
    posRef.current = p
    setPos(p)
  }

  // Giữ nút trong màn hình khi đổi kích thước cửa sổ
  useEffect(() => {
    const onResize = () => move(place(savedRef.current))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Esc để đóng khung chat
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && closePanel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Tự cuộn xuống tin mới nhất
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [msgs, typing, open])

  const openPanel = () => {
    setOpen(true)
    setTimeout(() => inputRef.current && inputRef.current.focus(), 50)
  }
  const closePanel = () => {
    setOpen(false)
    move(place(savedRef.current))
  }

  const snap = () => {
    const { x, y } = posRef.current
    const W = window.innerWidth
    const H = window.innerHeight
    const side = x + FS / 2 < W / 2 ? 'l' : 'r'
    const yr = Math.min(1, Math.max(0, (y - FM) / Math.max(1, H - FS - 2 * FM)))
    savedRef.current = { side, yr }
    try {
      localStorage.setItem(FABK, JSON.stringify(savedRef.current))
    } catch (e) {
      /* bỏ qua */
    }
    move(place(savedRef.current))
  }

  const onPointerDown = (e) => {
    if (e.button > 0) return
    drag.current = { sx: e.clientX, sy: e.clientY, ox: posRef.current.x, oy: posRef.current.y, moved: false }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch (_) {
      /* bỏ qua */
    }
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    if (!d.moved && Math.hypot(dx, dy) < 6) return
    d.moved = true
    setDragging(true)
    move(clamp(d.ox + dx, d.oy + dy))
  }
  const onPointerUp = (e) => {
    const d = drag.current
    if (!d) return
    drag.current = null
    setDragging(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch (_) {
      /* bỏ qua */
    }
    if (d.moved) snap()
    else openPanel()
  }
  const onPointerCancel = () => {
    drag.current = null
    setDragging(false)
  }
  const onKeyDown = (e) => {
    const k = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] }[e.key]
    if (!k) return
    e.preventDefault()
    const p = posRef.current
    move(clamp(p.x + k[0], p.y + k[1]))
    snap()
  }

  /* ---------- Gửi tin ---------- */
  const send = (text) => {
    setMsgs((m) => [...m, { from: 'me', text }])
    setTyping(true)
    setTimeout(() => {
      Promise.resolve(smartReply(text))
        .then((r) => setMsgs((m) => [...m, { from: 'bot', text: r.text, actions: r.actions, suggestions: r.suggestions }]))
        .catch(() =>
          setMsgs((m) => [
            ...m,
            {
              from: 'bot',
              text: 'Trợ lý đang gặp sự cố. Bạn vui lòng thử lại hoặc liên hệ nhân viên.',
              actions: [{ l: 'Gặp nhân viên', a: 'support', v: 'staff' }],
            },
          ])
        )
        .then(() => setTyping(false))
    }, 550)
  }
  const submit = (e) => {
    e.preventDefault()
    const t = draft.trim()
    if (!t) return
    setDraft('')
    send(t)
  }

  // Bấm nút gợi ý dưới tin nhắn của bot
  const runAction = (a) => {
    if (!loggedIn) return onNeedLogin()
    closePanel()
    if (a.a === 'support') onSupport(a.v)
    else if (a.a === 'consult') onConsult()
    else onGo(a.v)
  }

  return (
    <>
      <button
        id="fab"
        type="button"
        className={'fab' + (dragging ? ' drag' : '')}
        style={{ left: pos.x, top: pos.y }}
        hidden={open}
        aria-label="Mở chat hỗ trợ. Kéo để đổi vị trí"
        title="Chat hỗ trợ (kéo để di chuyển)"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClick={(e) => e.detail === 0 && openPanel()}
        onKeyDown={onKeyDown}
      >
        <Icon name="chat" size={26} />
      </button>

      <section id="chatpanel" className={open ? 'open' : ''} role="dialog" aria-label="Chat hỗ trợ">
        {open && (
          <>
            <div className="cp-h">
              <span className="mark">
                <Icon name="chat" size={22} />
              </span>
              <div className="grow">
                <b>Trợ lý Anh Thu</b>
                <small>Trả lời tự động, không thay thế bác sĩ</small>
              </div>
              <button type="button" className="iconbtn" onClick={closePanel} aria-label="Đóng chat">
                <Icon name="x" />
              </button>
            </div>
            <div className="chat">
              <div className="chatlog" role="log" aria-live="polite" ref={logRef}>
                {msgs.map((m, i) => (
                  <div key={i} className={'msg ' + (m.from === 'me' ? 'me' : 'bot')}>
                    <div className="bub" style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
                    {m.actions && m.actions.length > 0 && (
                      <div className="macts">
                        {m.actions.map((a) => (
                          <button key={a.l} type="button" className="chip" onClick={() => runAction(a)}>
                            {a.l}
                          </button>
                        ))}
                      </div>
                    )}
                    {!typing && i === msgs.length - 1 && m.suggestions && m.suggestions.length > 0 && (
                      <div className="macts">
                        {m.suggestions.map((s) => (
                          <button key={s} type="button" className="chip" onClick={() => send(s)}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {typing && (
                  <div className="msg bot">
                    <div className="bub typing">Đang trả lời…</div>
                  </div>
                )}
              </div>
              <div className="quick">
                {QUICK.map((t) => (
                  <button key={t} type="button" className="chip" onClick={() => send(t)}>
                    {t}
                  </button>
                ))}
              </div>
              <form className="chatform" onSubmit={submit} autoComplete="off">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Nhập câu hỏi"
                  aria-label="Nhập tin nhắn"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button className="btn btn-primary" type="submit" aria-label="Gửi">
                  <Icon name="send" size={20} />
                </button>
              </form>
            </div>
          </>
        )}
      </section>
    </>
  )
}
