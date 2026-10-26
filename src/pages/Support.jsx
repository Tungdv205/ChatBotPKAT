import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { FAQ } from '../data/catalog.js'
import { relTime } from '../utils/helpers.js'

const TABS = [
  ['faq', 'Câu hỏi thường gặp'],
  ['staff', 'Liên hệ nhân viên'],
]
const TOPICS = ['Đặt hoặc đổi lịch', 'Kết quả khám', 'Thanh toán và ưu đãi', 'Tài khoản', 'Khác']

// Màn Hỗ trợ: câu hỏi thường gặp và gửi yêu cầu cho nhân viên.
// Chat với trợ lý là nút tròn nổi ở góc màn hình.
export default function Support({ tab, onTab }) {
  const { user, updateUser } = useAuth()
  const toast = useToast()
  const cur = tab === 'staff' ? 'staff' : 'faq'

  const [topic, setTopic] = useState(TOPICS[0])
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const send = (e) => {
    e.preventDefault()
    if (!msg.trim()) return setErr('Nhập nội dung cần hỗ trợ.')
    const id = 'YC-' + (1000 + Math.floor(Math.random() * 9000))
    updateUser((u) => ({
      ...u,
      tickets: [...(u.tickets || []), { id, topic, msg: msg.trim(), ts: Date.now(), status: 'Đã tiếp nhận' }],
      notifs: [
        {
          id: 'n' + Date.now() + Math.floor(Math.random() * 999),
          t: 'system',
          title: 'Đã nhận yêu cầu hỗ trợ',
          body: 'Mã ' + id + ', chủ đề: ' + topic + '. Nhân viên sẽ phản hồi trong giờ làm việc.',
          ts: Date.now(),
          read: false,
        },
        ...u.notifs,
      ],
    }))
    setMsg('')
    setErr('')
    toast('Đã gửi yêu cầu, mã ' + id)
  }

  const tickets = [...(user.tickets || [])].reverse()

  return (
    <>
      <div className="phead">
        <div>
          <h1>Hỗ trợ</h1>
          <p>Hỏi nhanh bằng nút chat ở góc màn hình, hoặc liên hệ nhân viên của phòng khám.</p>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={cur === id} onClick={() => onTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {cur === 'faq' ? (
        <div className="card" style={{ maxWidth: 720 }}>
          <h2 style={{ fontSize: 18, marginBottom: 6 }}>Câu hỏi thường gặp</h2>
          {FAQ.map(([q, a]) => (
            <details className="faq" key={q}>
              <summary>
                {q}
                <Icon name="chev" size={18} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      ) : (
        <div className="two">
          <div style={{ display: 'grid', gap: 16 }}>
            <div className="card contact">
              <h2 style={{ fontSize: 18 }}>Liên hệ nhân viên</h2>
              <div>
                <Icon name="phone" size={20} />
                <span>
                  <b>Hotline</b>
                  <br />
                  1900 6868 (mẫu)
                  <br />
                  <small className="hint">Thứ hai đến thứ bảy, 08:00 đến 18:00</small>
                </span>
              </div>
              <div>
                <Icon name="mail" size={20} />
                <span>
                  <b>Email</b>
                  <br />
                  lienhe@anhthu.example
                </span>
              </div>
              <div>
                <Icon name="pin" size={20} />
                <span>
                  <b>Quầy lễ tân</b>
                  <br />
                  Số 12 đường Trần Phú (địa chỉ mẫu)
                </span>
              </div>
              <p className="hint">Khi cần cấp cứu, hãy gọi 115 hoặc đến cơ sở y tế gần nhất.</p>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 18, marginBottom: 6 }}>Yêu cầu đã gửi</h2>
              {tickets.length ? (
                tickets.map((x) => (
                  <div className="tk" key={x.id}>
                    <div className="r">
                      <b>{x.topic}</b>
                      <span className="pill pill-accent">{x.status}</span>
                    </div>
                    <p className="hint">{x.msg}</p>
                    <small className="hint">
                      Mã {x.id} · {relTime(x.ts)}
                    </small>
                  </div>
                ))
              ) : (
                <p className="hint">Bạn chưa gửi yêu cầu nào.</p>
              )}
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 18, marginBottom: 14 }}>Gửi yêu cầu cho nhân viên</h2>
            <form onSubmit={send} noValidate>
              <div className="field">
                <label htmlFor="s-topic">Chủ đề</label>
                <select id="s-topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
                  {TOPICS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="s-msg">Nội dung</label>
                <textarea
                  id="s-msg"
                  placeholder="Mô tả vấn đề của bạn"
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                />
              </div>
              <p className="hint" style={{ marginBottom: 12 }}>
                Nhân viên sẽ gọi lại số {user.phone || 'trong hồ sơ'} trong giờ làm việc.
              </p>
              {err && (
                <p className="err" role="alert">
                  {err}
                </p>
              )}
              <button className="btn btn-primary" type="submit">
                Gửi yêu cầu
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}