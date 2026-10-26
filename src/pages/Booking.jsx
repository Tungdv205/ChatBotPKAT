import { useEffect, useState } from 'react'
import Step1Service from '../components/booking/Step1Service.jsx'
import Step3DateTime from '../components/booking/Step3DateTime.jsx'
import Step4Confirm from '../components/booking/Step4Confirm.jsx'
import WizardFooter from '../components/booking/WizardFooter.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { SERVICES } from '../data/catalog.js'
import { svcById } from '../utils/appointments.js'
import { calcDiscount, currentTotals, newApptId, pickStaff, slotState } from '../utils/booking.js'
import { longDate, mins } from '../utils/helpers.js'

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

const newNotif = (title, body) => ({
  id: 'n' + Date.now() + Math.floor(Math.random() * 999),
  t: 'booking',
  title,
  body,
  ts: Date.now(),
  read: false,
})

// preset: dữ liệu màn khác truyền sang (dịch vụ, mã ưu đãi, hoặc lịch cần đổi)
export default function Booking({ app, preset }) {
  const { user, updateUser } = useAuth()
  const toast = useToast()
  const [b, setB] = useState(() => ({ ...EMPTY, ...(preset || {}), staff: 'any' })) // luôn tự xếp bác sĩ, khách không chọn
  const set = (patch) => setB((s) => ({ ...s, ...patch }))

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

  const pickSvc = (id) => {
    if (b.svc === id) return
    set({ svc: id, date: null, time: null, code: '', codeErr: '' })
  }

  const confirm = () => {
    const m = mins(b.time)
    if (slotState(user.appts, svc, b.staff, b.date, m, b.editId) !== 'ok') {
      toast('Khung giờ này vừa kín, vui lòng chọn giờ khác.')
      return set({ time: null, step: 2 })
    }
    const staffId = b.staff === 'any' ? pickStaff(user.appts, svc, b.date, m, b.editId) : b.staff
    let id = b.editId
    if (b.editId) {
      updateUser((u) => ({
        ...u,
        appts: u.appts.map((a) =>
          a.id === b.editId ? { ...a, date: b.date, time: b.time, staff: staffId, note: b.note, reminded: false } : a
        ),
        notifs: [newNotif('Đã đổi lịch hẹn', svc.name + ' lúc ' + b.time + ', ' + longDate(b.date) + '.'), ...u.notifs],
      }))
    } else {
      const t = currentTotals(user.appts, b, svc)
      id = newApptId(user.appts)
      const appt = {
        id,
        svc: svc.id,
        staff: staffId,
        date: b.date,
        time: b.time,
        note: b.note,
        code: t.code,
        discount: t.d,
        total: t.total,
        status: 'upcoming',
        created: Date.now(),
      }
      updateUser((u) => ({
        ...u,
        appts: [...u.appts, appt],
        notifs: [
          newNotif('Đặt lịch thành công', svc.name + ' lúc ' + b.time + ', ' + longDate(b.date) + '. Mã ' + id + '.'),
          ...u.notifs,
        ],
      }))
    }
    app.finishBooking(id)
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
  const nextLabel = step === 3 ? (b.editId ? 'Xác nhận đổi lịch' : 'Xác nhận đặt lịch') : 'Tiếp tục'

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
      {step === 2 && <Step3DateTime svc={svc} b={b} set={set} appts={user.appts} />}
      {step === 3 && <Step4Confirm svc={svc} b={b} set={set} user={user} onGoProfile={() => app.go('profile')} />}

      <WizardFooter
        step={step}
        editId={b.editId}
        svc={svc}
        canNext={canNext}
        nextLabel={nextLabel}
        onBack={back}
        onNext={next}
      />
    </>
  )
}