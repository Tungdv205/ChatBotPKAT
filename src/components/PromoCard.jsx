import Icon from './Icon.jsx'

// Thẻ mã ưu đãi, dùng ở Trang chủ và màn Ưu đãi
export default function PromoCard({ voucher, onCopy, onUse }) {
  return (
    <article className="card promo">
      <h3 style={{ fontSize: 16 }}>{voucher.title}</h3>
      <p className="hint">{voucher.note}. Hết hạn 31/12/2026.</p>
      <div className="cd2">
        <code>{voucher.code}</code>
        <button className="btn btn-sm btn-line" onClick={() => onCopy(voucher.code)}>
          <Icon name="copy" size={16} />
          Sao chép
        </button>
      </div>
      <button className="btn btn-primary btn-sm" onClick={() => onUse(voucher.code)}>
        Dùng ngay
      </button>
    </article>
  )
}