export const scaled = (box, scale) => {
  const cx = box.left + box.width / 2
  const cy = box.top + box.height / 2

  const width = box.width * scale
  const height = box.height * scale
  const left = cx - width / 2
  const top = cy - height / 2
  const right = cx + width / 2
  const bottom = cy + height / 2

  return {
    width, height, left, top, right, bottom
  }
}
