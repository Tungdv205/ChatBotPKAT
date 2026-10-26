import PromoCard from '../components/PromoCard.jsx'
import { VOUCHERS } from '../data/catalog.js'

// Màn Ưu đãi: danh sách mã giảm giá. "Dùng ngay" chuyển sang đặt lịch với mã đã gõ sẵn.
export default function Promos({ app }) {
  return (
    <>
      <div className="phead">
        <div>
          <h1>Ưu đãi</h1>
          <p>Mỗi lịch hẹn dùng một mã. Nhập ở bước Xác nhận.</p>
        </div>
      </div>
      <div className="grid promogrid">
        {VOUCHERS.map((v) => (
          <PromoCard key={v.code} voucher={v} onCopy={app.copyCode} onUse={app.usePromo} />
        ))}
      </div>
    </>
  )
}