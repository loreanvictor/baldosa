export const isNumber = (v) => /^[0-9]+$/.test(v)
export const isDirection = (v) => /^[NSEW]$/i.test(v)
export const isDirectedNumber = (v) => /^[0-9]+[NSEW]$/i.test(v)
export const isCoordinate = (v) =>
  v &&
  v
    .split(',')
    .map((p) => p.trim())
    .every((part) => isDirectedNumber(part))

export const isLastPartNumber = (v) => {
  if (v === undefined) {
    return false
  }

  const parts = v.split(',').map((p) => p.trim())
  const last = parts[parts.length - 1]

  return !last || isNumber(last) || last === ''
}

export const toggleDirection = (v, dir) => {
  const D = dir.toUpperCase()
  if (isDirectedNumber(v)) {
    const numberPart = v.slice(0, -1)
    const directionPart = v[v.length - 1].toUpperCase()
    if (directionPart === D) {
      return numberPart + (D === 'N' ? 'S' : D === 'S' ? 'N' : D === 'E' ? 'W' : 'E')
    } else {
      return numberPart + D
    }
  } else if (isNumber(v)) {
    return v + D
  }
}

export const toggleDirectionOfLastPart = (v, dir) => {
  const D = dir.toUpperCase()
  if (v) {
    const parts = v.split(',').map((p) => p.trim())
    const last = parts[parts.length - 1]
    const toggledLast = toggleDirection(last, D)
    if (toggledLast) {
      parts[parts.length - 1] = toggledLast

      return parts.join(', ')
    }
  }
}
