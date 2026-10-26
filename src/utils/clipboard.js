// Sao chép văn bản vào bộ nhớ tạm, có phương án dự phòng cho trình duyệt cũ.
// toast: hàm hiện thông báo nhỏ (lấy từ useToast)
export function copyText(txt, okMsg, toast) {
  const failMsg = 'Không sao chép được, hãy chọn và sao chép thủ công.'
  const fallback = () => {
    try {
      const ta = document.createElement('textarea')
      ta.value = txt
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      toast(ok ? okMsg : failMsg)
    } catch (e) {
      toast(failMsg)
    }
  }
  try {
    navigator.clipboard.writeText(txt).then(() => toast(okMsg), fallback)
  } catch (e) {
    fallback()
  }
}