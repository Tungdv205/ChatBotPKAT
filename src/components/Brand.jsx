import Icon from './Icon.jsx'

export function Logo() {
  return (
    <div className="logo">
      <span className="logo-mark">
        <Icon name="cross" size={20} />
      </span>
      Đa khoa Anh Thu
    </div>
  )
}

const TONES = ['accent', 'sun', 'ok', 'bad']

// Ảnh đại diện bằng chữ cái đầu (bỏ tiền tố BS., KTV, CKI...)
export function Avatar({ name, index = 0, size = 44 }) {
  const w = String(name)
    .replace(/^((BS|ThS|KTV|CKI|CKII)\.?\s+)+/, '')
    .trim()
    .split(/\s+/)
  const ini = (w.length > 1 ? w[0][0] + w[w.length - 1][0] : w[0][0]).toUpperCase()
  return (
    <span
      className={'av av-' + TONES[index % 4]}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-hidden="true"
    >
      {ini}
    </span>
  )
}
