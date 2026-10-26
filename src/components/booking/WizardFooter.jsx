import Icon from '../Icon.jsx'
import { vnd } from '../../utils/helpers.js'

// Thanh dưới của các bước đặt lịch: Quay lại, tóm tắt dịch vụ, Tiếp tục
export default function WizardFooter({ step, editId, svc, canNext, nextLabel, onBack, onNext }) {
  const showBack = step > 1 && !(editId && step === 2)
  return (
    <div className="wizfoot">
      {showBack ? (
        <button className="btn btn-line" onClick={onBack}>
          <Icon name="chevl" size={18} />
          Quay lại
        </button>
      ) : (
        <span></span>
      )}
      {svc ? (
        <span className="sum">
          <b>{svc.name}</b> · {svc.dur} phút · {vnd(svc.price)}
        </span>
      ) : (
        <span className="sum">Chưa chọn dịch vụ</span>
      )}
      <button className="btn btn-primary" disabled={!canNext} onClick={onNext}>
        {nextLabel}
        {step < 3 && <Icon name="chev" size={18} />}
      </button>
    </div>
  )
}