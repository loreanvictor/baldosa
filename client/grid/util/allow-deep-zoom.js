export const allowDeepZoom = () => {
  const ua = navigator.userAgent
  const isIOS = /iPhone|iPad/.test(ua)
  const isMobile = /Mobi|Android|iPhone|iPad/.test(ua)

  const isSafari = /Safari\//.test(ua) && !/Chrome\//.test(ua) && !/Chromium\//.test(ua)

  const isChromium = /Chrome\//.test(ua) || /Edg\//.test(ua) || /Brave\//.test(ua)

  const isFirefox = /Firefox\//.test(ua)

  const cores = navigator.hardwareConcurrency ?? 0
  const memory = navigator.deviceMemory ?? 0
  const dpr = window.devicePixelRatio ?? 1

  // ---- iOS Safari gate (new phones only) ----
  if (isIOS && isSafari) {
    // iPhone 14+ / recent iPads land here
    return cores >= 6 && memory >= 6
  }

  // ---- Desktop Safari: still no ----
  if (isSafari && !isMobile) return false

  // ---- Desktop browsers ----
  if (!isChromium && !isFirefox) return false

  let score = 0
  if (cores >= 8) score++
  if (memory >= 8) score++
  if (dpr <= 2) score++

  return score >= 2
}
