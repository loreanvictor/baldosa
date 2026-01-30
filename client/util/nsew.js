const DIRS = [
  { [-1]: 'N', [1]: 'S' },
  { [-1]: 'W', [1]: 'E' },
]

export const toNSEW = (x, y, compact, zero) => {
  const res = [y, x]
    .map((p, i) => (p !== 0 ? `${Math.abs(p)}${DIRS[i][Math.sign(p)]}` : zero === 'all' ? '0' : null))
    .filter(Boolean)

  return res.length === 0 && zero === 'any' ? '0' : compact ? res.join(',') : res.join(', ')
}

export const fromNSEW = (nsew) => {
  let x = 0
  let y = 0
  const parts = nsew.split(',').map((s) => s.trim())
  for (const part of parts) {
    const dir = part.slice(-1)
    const val = parseInt(part.slice(0, -1), 10)
    if (dir === 'N') y -= val
    else if (dir === 'S') y += val
    else if (dir === 'W') x -= val
    else if (dir === 'E') x += val
    else throw new Error(`Invalid direction: ${dir}`)
  }

  return { x, y }
}

export const fromNSEWOrCartesian = (str) => {
  try {
    return fromNSEW(str)
  } catch {
    const [xStr, yStr] = str.split(',').map((s) => s.trim())
    const x = parseInt(xStr, 10)
    const y = parseInt(yStr, 10)
    if (isNaN(x) || isNaN(y)) {
      throw new Error(`Invalid coordinate: ${str}`)
    }
    return { x, y }
  }
}
