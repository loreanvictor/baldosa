export const trim = (str, max, pos = 'end') => {
  if (str.length <= max) return str
  if (max <= 3) return '.'.repeat(maxLength)

  const ellipsis = '...'
  const avail = max - ellipsis.length

  switch (pos) {
    case 'start':
      return ellipsis + str.slice(str.length - avail)

    case 'middle': {
      const left = Math.ceil(avail / 2)
      const right = Math.floor(avail / 2)
      return str.slice(0, left) + ellipsis + str.slice(str.length - right)
    }

    case 'end':
    default:
      return str.slice(0, avail) + ellipsis
  }
}
