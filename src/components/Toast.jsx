import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(() => {})

// Dùng: const toast = useToast(); toast('Đã lưu hồ sơ')
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState('')
  const [show, setShow] = useState(false)
  const timer = useRef(null)

  const toast = useCallback((m) => {
    setMsg(m)
    setShow(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setShow(false), 2600)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div id="toast" className={show ? 'show' : ''} role="status" aria-live="polite">
        {msg}
      </div>
    </ToastContext.Provider>
  )
}
