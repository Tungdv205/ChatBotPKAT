import { VOUCHERS } from '../../data/catalog.js'
import { staffById } from '../../utils/appointments.js'
import { calcDiscount, currentTotals } from '../../utils/booking.js'
import { longDate, vnd } from '../../utils/helpers.js'

// Bước 4: kiểm tra thông tin, nhập mã ưu đãi, ghi chú cho bác sĩ
export default function Step4Confirm({ svc, b, set, user, onGoProfile }) {
  const t = currentTotals(user.appts, b, svc)
  // Khách không chọn bác sĩ: phòng khám tự xếp bác sĩ rảnh khi xác nhận
  const st = b.staff !== 'any' ? staffById(b.staff) : null

  const applyCode = () => {
    const code = (b.codeInput || '').trim().toUpperCase()
    if (!code) return set({ codeErr: 'Nhập mã ưu đãi trước khi áp dụng.' })
    const r = calcDiscount(svc, code)
    if (r.err) set({ codeErr: r.err })
    else set({ code, codeErr: '' })
  }

  // Mã gợi ý: các mã dùng được cho dịch vụ này
  const sugg = VOUCHERS.filter((v) => !calcDiscount(svc, v.code).err)

  return (
    <>
      <div className="card" style={{ display: 'grid', gap: 14 }}>
        <h2 style={{ fontSize: 18 }}>Kiểm tra thông tin</h2>
        <dl className="kv">
          <div>
            <dt>Dịch vụ</dt>
            <dd>{svc.name}</dd>
          </div>
          <div>
            <dt>Bác sĩ</dt>
            <dd>{st ? st.name : 'Phòng khám xếp bác sĩ phù hợp'}</dd>
          </div>
          <div>
            <dt>Thời gian</dt>
            <dd>
              {b.time} · {svc.dur} phút
              <br />
              {longDate(b.date)}
            </dd>
          </div>
          <div>
            <dt>Người đặt</dt>
            <dd>
              {user.name}
              <br />
              {user.phone || 'Chưa có số điện thoại'}
            </dd>
          </div>
          <div>
            <dt>Giá dịch vụ</dt>
            <dd className="price">{vnd(svc.price)}</dd>
          </div>
          {t.d > 0 && (
            <div>
              <dt>Giảm giá ({t.code})</dt>
              <dd className="price" style={{ color: 'var(--ok-text)' }}>-{vnd(t.d)}</dd>
            </div>
          )}
          <div className="tot">
            <dt>Thanh toán tại quầy</dt>
            <dd>{vnd(t.total)}</dd>
          </div>
        </dl>
        {!user.phone && (
          <p className="err" style={{ margin: 0 }}>
            Hồ sơ chưa có số điện thoại.{' '}
            <button className="link" onClick={onGoProfile}>Cập nhật hồ sơ</button>
          </p>
        )}
      </div>

      {/* Đổi lịch thì giữ mã cũ, không cho nhập mã mới */}
      {!b.editId && (
        <div className="card" style={{ display: 'grid', gap: 10 }}>
          <label className="lbl" htmlFor="code">Mã ưu đãi</label>
          {t.code ? (
            <p className="ok-t">
              Đã áp dụng {t.code}, giảm {vnd(t.d)}.{' '}
              <button className="link" onClick={() => set({ code: '', codeInput: '' })}>Gỡ mã</button>
            </p>
          ) : (
            <>
              <div className="codebar">
                <input
                  id="code"
                  type="text"
                  placeholder="Nhập mã"
                  value={b.codeInput}
                  autoComplete="off"
                  onChange={(e) => set({ codeInput: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      applyCode()
                    }
                  }}
                />
                <button className="btn btn-line" onClick={applyCode}>Áp dụng</button>
              </div>
              {b.codeErr && <p className="err" style={{ margin: 0 }}>{b.codeErr}</p>}
              {sugg.length > 0 && (
                <div className="chips">
                  {sugg.map((v) => (
                    <button
                      key={v.code}
                      className="chip"
                      onClick={() => set({ codeInput: v.code, code: v.code, codeErr: '' })}
                    >
                      {v.code}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Đổi lịch chỉ đổi ngày giờ, ghi chú giữ như cũ */}
      {!b.editId && (
        <div className="card field" style={{ margin: 0 }}>
          <label htmlFor="note">
            Ghi chú cho bác sĩ: triệu chứng, tiền sử, thuốc đang dùng (không bắt buộc)
          </label>
          <textarea
            id="note"
            placeholder="Ví dụ: tôi đang dùng thuốc huyết áp, hoặc dị ứng penicillin"
            maxLength={500}
            value={b.note}
            onChange={(e) => set({ note: e.target.value })}
          />
        </div>
      )}
    </>
  )
}