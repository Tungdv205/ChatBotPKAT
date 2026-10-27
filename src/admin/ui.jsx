import { useEffect } from 'react'
import Icon from '../components/Icon.jsx'

// Ô tìm kiếm dùng chung. id="adm-q" để nút tìm kiếm ở thanh trên đưa con trỏ vào đây.
export function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="search">
      <Icon name="search" size={20} />
      <label className="sr" htmlFor="adm-q">Tìm kiếm</label>
      <input
        id="adm-q"
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    </div>
  )
}

// Hộp thoại dùng chung: bấm nền tối, nút X hoặc phím Esc để đóng
export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="hd">
          <h2>{title}</h2>
          <button className="iconbtn" onClick={onClose} aria-label="Đóng">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Công tắc bật/tắt
export function Toggle({ on, onChange, label }) {
  return <button className="switch" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}></button>
}