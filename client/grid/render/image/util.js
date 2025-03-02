export function fillSquareWithImage(img, x, y, size) {
  const iw = img.width
  const ih = img.height

  const k = size / Math.min(iw, ih)
  const dw = iw * k
  const dh = ih * k
  const dx = x + (size - dw) / 2
  const dy = y + (size - dh) / 2
  
  return [dx, dy, dw, dh]
}
