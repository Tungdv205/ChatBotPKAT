import { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import { useToast } from './components/Toast.jsx'
import AppShell, { NAV } from './components/AppShell.jsx'
import ChatWidget from './components/ChatWidget.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Services from './pages/Services.jsx'
import Appointments from './pages/Appointments.jsx'
import Promos from './pages/Promos.jsx'
import Notifications from './pages/Notifications.jsx'
import Profile from './pages/Profile.jsx'
import Support from './pages/Support.jsx'
import Booking from './pages/Booking.jsx'
import BookingSuccess from './pages/BookingSuccess.jsx'
import WelcomePopup from './components/WelcomePopup.jsx'
import { canChange, svcById } from './utils/appointments.js'
import { copyText } from './utils/clipboard.js'
import { api } from './api/client.js'
import { applyCatalog } from './data/catalog.js'

export default function App() {
  const { user, booting } = useAuth()
  const toast = useToast()
  const [view, setView] = useState('home')
  const [stack, setStack] = useState([]) // các màn đã đi qua, để nút Quay lại dùng
  const [supTab, setSupTab] = useState('faq')

  // Dữ liệu "chuyển tiếp" giữa các màn. Các màn tương ứng sẽ đọc ở các bước sau.
  const [bookingPreset, setBookingPreset] = useState(null) // màn Đặt lịch
  const [svcPreset, setSvcPreset] = useState({ cat: 'all', detail: null }) // màn Dịch vụ
  const [lastApptId, setLastApptId] = useState(null) // lịch vừa đặt xong, màn thành công đọc

  // Danh mục dịch vụ, bác sĩ, ưu đãi lấy từ backend một lần khi mở trang
  const [catReady, setCatReady] = useState(false)
  useEffect(() => {
    api('/api/catalog', { token: null })
      .then(applyCatalog)
      .catch(() => { }) // lỗi thì dùng dữ liệu mẫu có sẵn
      .finally(() => setCatReady(true))
  }, [])

  // Đăng xuất thì lần đăng nhập sau quay về Trang chủ
  useEffect(() => {
    if (!user) {
      setView('home')
      setStack([])
    }
  }, [user])

  const go = (v) => {
    // Nhớ màn hiện tại để quay lại. Không nhớ màn "thành công", và không nhớ màn đặt lịch khi vừa đặt xong
    if (v !== view && view !== 'success' && !(view === 'book' && v === 'success')) setStack((st) => [...st.slice(-19), view])
    setView(v)
    window.scrollTo({ top: 0 })
  }

  // Nút Quay lại ở thanh trên: về màn trước đó
  const goBack = () => {
    const prev = stack[stack.length - 1]
    if (!prev) return
    setStack(stack.slice(0, -1))
    setView(prev)
    window.scrollTo({ top: 0 })
  }

  // Các hành động mà màn hình có thể gọi
  const app = {
    go,
    startBooking: (preset) => {
      setBookingPreset(preset || {})
      go('book')
    },
    openCategory: (cat) => {
      setSvcPreset({ cat, detail: null })
      go('services')
    },
    openService: (id) => {
      setSvcPreset({ cat: 'all', detail: id })
      go('services')
    },
    reschedule: (a) => {
      if (!canChange(a)) return toast('Còn dưới 2 giờ nên không thể đổi lịch trực tuyến. Hãy gọi hotline.')
      if (!svcById(a.svc)) return toast('Dịch vụ này đã ngừng cung cấp. Hãy hủy lịch và đặt dịch vụ khác.')
      app.startBooking({ svc: a.svc, editId: a.id, note: a.note, step: 2 })
    },
    clearSvcPreset: () => setSvcPreset({ cat: 'all', detail: null }),
    clearBookingPreset: () => setBookingPreset(null),
    finishBooking: (id) => {
      setLastApptId(id)
      go('success')
    },
    copyCode: (code) => copyText(code, 'Đã sao chép mã ' + code, toast),
    usePromo: (code) => {
      app.startBooking({ codeInput: code, pendingCode: code })
      toast('Chọn dịch vụ, mã ' + code + ' sẽ được thử áp dụng ở bước cuối.')
    },
  }

  const goSupport = (tab) => {
    setSupTab(tab)
    go('support')
  }

  const item = NAV.find((n) => n[0] === view) || NAV[0]

  // Đang kiểm tra phiên đăng nhập đã lưu: chưa hiện gì để khỏi nháy sang màn đăng nhập
  if (booting || !catReady) return <div style={{ padding: 40, textAlign: 'center', color: '#667' }}>Đang tải...</div>
  return (
    <>
      {user ? (
        <AppShell view={view} onNav={go} canBack={stack.length > 0} onBack={goBack}>
          {view === 'home' ? (
            <Home app={app} />
          ) : view === 'services' ? (
            <Services app={app} preset={svcPreset} />
          ) : view === 'book' ? (
            <Booking app={app} preset={bookingPreset} />
          ) : view === 'appts' ? (
            <Appointments app={app} />
          ) : view === 'promos' ? (
            <Promos app={app} />
          ) : view === 'notifs' ? (
            <Notifications />
          ) : view === 'profile' ? (
            <Profile />
          ) : view === 'support' ? (
            <Support tab={supTab} onTab={setSupTab} />
          ) : view === 'success' ? (
            <BookingSuccess app={app} apptId={lastApptId} />
                   ) : null}
        </AppShell>
      ) : (
        <Login />
      )}
      {user && <WelcomePopup app={app} />}
      <ChatWidget
        loggedIn={!!user}
        onGo={go}
        onSupport={goSupport}
        onNeedLogin={() => toast('Hãy đăng nhập để tiếp tục.')}
      />
    </>
  )
}