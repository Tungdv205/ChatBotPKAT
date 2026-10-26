import { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import { useToast } from './components/Toast.jsx'
import AppShell, { NAV } from './components/AppShell.jsx'
import ChatWidget from './components/ChatWidget.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Services from './pages/Services.jsx'
import Promos from './pages/Promos.jsx'
import Notifications from './pages/Notifications.jsx'
import Profile from './pages/Profile.jsx'
import Support from './pages/Support.jsx'
import Booking from './pages/Booking.jsx'
import BookingSuccess from './pages/BookingSuccess.jsx'
import Appointments from './pages/Appointments.jsx'
import Placeholder from './pages/Placeholder.jsx'
import { canChange } from './utils/appointments.js'
import { copyText } from './utils/clipboard.js'

export default function App() {
  const { user } = useAuth()
  const toast = useToast()
  const [view, setView] = useState('home')
  const [supTab, setSupTab] = useState('faq') // dùng cho màn Hỗ trợ ở bước sau

  // Dữ liệu "chuyển tiếp" giữa các màn. Các màn tương ứng sẽ đọc ở các bước sau.
  const [bookingPreset, setBookingPreset] = useState(null) // màn Đặt lịch
  const [svcPreset, setSvcPreset] = useState({ cat: 'all', detail: null }) // màn Dịch vụ
  const [lastApptId, setLastApptId] = useState(null) // lịch vừa đặt xong, màn thành công đọc

  // Đăng xuất thì lần đăng nhập sau quay về Trang chủ
  useEffect(() => {
    if (!user) setView('home')
  }, [user])

  const go = (v) => {
    setView(v)
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

  return (
    <>
      {user ? (
        <AppShell view={view} onNav={go}>
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
              ) : view === 'notifs' ? (
            <Notifications />
          ) : view === 'profile' ? (
            <Profile />
          ) : view === 'support' ? (
            <Support tab={supTab} onTab={setSupTab} />
          ) : view === 'success' ? (
            <BookingSuccess app={app} apptId={lastApptId} />
          ) : (
            // Mỗi màn thật sẽ thay Placeholder ở các bước sau
            <Placeholder title={item[1]} icon={item[2]} />
          )}
        </AppShell>
      ) : (
        <Login />
      )}
      <ChatWidget
        loggedIn={!!user}
        onGo={go}
        onSupport={goSupport}
        onNeedLogin={() => toast('Hãy đăng nhập để tiếp tục.')}
      />
    </>
  )
}