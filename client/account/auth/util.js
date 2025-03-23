export const niceKeyName = () => {
  const ua = navigator.userAgent

  const os = (() => {
    if (/Windows NT 10/.test(ua)) return 'Windows 10'
    if (/Windows NT 6.3/.test(ua)) return 'Windows 8.1'
    if (/Windows NT 6.1/.test(ua)) return 'Windows 7'
    if (/Mac OS X 10[._]\d+/.test(ua)) return 'macOS'
    if (/Android/.test(ua)) return 'Android'
    if (/iPhone/.test(ua)) return 'iPhone'
    if (/iPad/.test(ua)) return 'iPad'
    if (/Linux/.test(ua)) return 'Linux'
    return "Unknown OS"
  })();

  const browser = (() => {
    if (/Chrome\/(\d+)/.test(ua)) return 'Chrome'
    if (/Safari\/(\d+)/.test(ua) && /Version\/(\d+)/.test(ua)) return 'Safari'
    if (/Firefox\/(\d+)/.test(ua)) return 'Firefox'
    if (/Edg\/(\d+)/.test(ua)) return 'Edge'
    return "Unknown Browser"
  })();

  return `${browser} on ${os}`
}
