import { useEffect, useState } from 'react'
import Step1Service from '../components/booking/Step1Service.jsx'
import Step3DateTime from '../components/booking/Step3DateTime.jsx'
import Step4Confirm from '../components/booking/Step4Confirm.jsx'
import WizardFooter from '../components/booking/WizardFooter.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { SERVICES } from '../data/catalog.js'
import { svcById } from '../utils/appointments.js'
import { calcDiscount, currentTotals } from '../utils/booking.js'

const STEPS = ['Dịch vụ', 'Ngày giờ', 'Xác nhận']

const EMPTY = {
  step: 1,
  svc: null,
  staff: 'any',
  cat: 'all',
  date: null,
  time: null,
  note: '',
  code: '',
  codeInput: '',
  codeErr: '',
  editId: null,
}

// preset: dữ liệu màn khác truyền sang (dịch vụ, bác sĩ, mã ưu đãi, hoặc lịch cần đổi)
export default function Booking({ app, preset }) {
  const { user, createAppt, rescheduleAppt } = useAuth()
  const toast = useToast()
  const [b, setB] = useState(() => ({ ...EMPTY, ...(preset || {}), staff: 'any' })) // luôn tự xếp bác sĩ, khách không chọn
  const set = (patch) => setB((s) => ({ ...s, ...patch }))
  const [busy, setBusy] = useState(false)

  // Đã đọc xong dữ liệu chuyển tiếp thì xóa đi để lần vào sau từ menu bắt đầu mới
  useEffect(() => {
    app.clearBookingPreset()
  }, [])

  const svc = b.svc ? svcById(b.svc) : null
  const step = svc ? b.step : 1

  // Đổi bước thì cuộn lên đầu trang
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  // Bấm dịch vụ: chưa chọn thì thêm, đã chọn thì bỏ chọn. Mã lưu dạng 's1+s12' theo thứ tự danh mục
  const pickSvc = (id) => {
    const cur = b.svc ? b.svc.split('+') : []
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    next.sort((x, y) => SERVICES.findIndex((s) => s.id === x) - SERVICES.findIndex((s) => s.id === y))
    const key = next.join('+')
    const merged = key ? svcById(key) : null
    if (merged && merged.dur > 270) return toast('Tổng thời gian tối đa 4 giờ 30 phút cho một lần đặt. Hãy bỏ bớt một dịch vụ hoặc đặt thành lịch khác.')
    set({ svc: key || null, date: null, time: null, code: '', codeErr: '' })
  }

  // Gửi lên backend. Backend kiểm tra lại giờ trống, trùng lịch, mã ưu đãi rồi mới lưu.
  const confirm = async () => {
    setBusy(true)
    const r = b.editId
      ? await rescheduleAppt(b.editId, { staff: 'any', date: b.date, time: b.time })
      : await createAppt({
          svc: b.svc,
          staff: 'any',
          date: b.date,
          time: b.time,
          code: currentTotals(user.appts, b, svc).code || '',
          note: b.note.trim(),
        })
    setBusy(false)
    if (!r.ok) {
      toast(r.error)
      // Giờ vừa bị người khác đặt mất hoặc trùng lịch: quay lại chọn giờ khác
      if (r.status === 409) set({ time: null, step: 2 })
      return
    }
    app.finishBooking(r.appt.id)
  }

  const next = () => {
    if (step === 1 && svc) return set({ step: 2 })
    if (step === 2 && b.time) {
      // Có mã gõ sẵn (vd từ trang Ưu đãi) thì thử áp dụng trước khi sang bước xác nhận
      const patch = { step: 3 }
      if (!b.editId && !b.code && b.codeInput) {
        const code = b.codeInput.trim().toUpperCase()
        const r = calcDiscount(svc, code)
        if (r.err) patch.codeErr = r.err
        else patch.code = code
      }
      return set(patch)
    }
    if (step === 3) {
      if (!user.phone) return toast('Hãy thêm số điện thoại trong Hồ sơ trước khi xác nhận.')
      confirm()
    }
  }

  const back = () => set({ step: Math.max(1, step - 1) })

  const canNext = step === 1 ? !!svc : step === 2 ? !!b.time : true
  const nextLabel = busy ? 'Đang xử lý...' : step === 3 ? (b.editId ? 'Xác nhận đổi lịch' : 'Xác nhận đặt lịch') : 'Tiếp tục'

  return (
    <>
      <div className="phead">
        <div>
          <h1>{b.editId ? 'Đổi lịch hẹn' : 'Đặt lịch hẹn'}</h1>
          <p>
            {b.editId
              ? 'Mã lịch ' + b.editId + '. Chọn ngày giờ mới cho lịch này.'
              : 'Làm theo 3 bước, bạn có thể quay lại sửa bất cứ lúc nào.'}
          </p>
        </div>
      </div>

      <div className="steps" role="list">
        {STEPS.map((name, i) => {
          const k = i + 1
          const cls = k === step ? 'cur' : k < step ? 'done' : ''
          const disabled = k > step || (k > 1 && !svc) || (b.editId && k < 2)
          return (
            <button
              key={name}
              className={'stp ' + cls}
              role="listitem"
              disabled={!!disabled}
              aria-current={k === step ? 'step' : undefined}
              onClick={() => set({ step: k })}
            >
              <i></i>
              {k}. {name}
            </button>
          )
        })}
      </div>

      {step === 1 && <Step1Service b={b} set={set} onPickSvc={pickSvc} />}
      {step === 2 && <Step3DateTime svc={svc} b={b} set={set} />}
      {step === 3 && <Step4Confirm svc={svc} b={b} set={set} user={user} onGoProfile={() => app.go('profile')} />}

      <WizardFooter
        step={step}
        editId={b.editId}
        svc={svc}
        canNext={canNext && !busy}
        nextLabel={nextLabel}
        onBack={back}
        onNext={next}
      />
    </>
  )
}