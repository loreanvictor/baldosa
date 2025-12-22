export const slashjoin = (a, b) =>
  a.startsWith('/')
    ? '/' + [a.split('/').filter(Boolean).join('/'), b.split('/').filter(Boolean).join('/')].filter(Boolean).join('/')
    : [a.split('/').filter(Boolean).join('/'), b.split('/').filter(Boolean).join('/')].filter(Boolean).join('/')

const expand = (path, home) => {
  if (!home) return path
  if (path === '~') return home
  if (path.startsWith('~/')) return home + path.slice(1)

  return path
}

const isAbsolute = (path) => path.startsWith('/')

const normalize = (path) => {
  const isAbs = path.startsWith('/')
  const parts = path.split('/')

  const stack = []
  for (const part of parts) {
    if (!part || part === '.') continue
    if (part === '..') {
      if (stack.length && stack[stack.length - 1] !== '..') {
        stack.pop()
      } else if (!isAbs) {
        stack.push('..')
      }
    } else {
      stack.push(part)
    }
  }

  return (isAbs ? '/' : '') + stack.join('/')
}

export const absolute = (path, cwd, home) => {
  path = expand(path, home)
  return normalize(isAbsolute(path) ? path : cwd.replace(/\/+$/, '') + '/' + path)
}

export const join = (cwd, rel, home) => {
  rel = expand(rel, home)
  return normalize(isAbsolute(rel) ? rel : cwd.replace(/\/+$/, '') + '/' + rel)
}

export const basename = (path, home) => {
  path = expand(path, home)
  if (path === '/') return '/'
  const parts = path.replace(/\/+$/, '').split('/')
  return parts[parts.length - 1] || ''
}

export const dirname = (path, home) => {
  path = expand(path, home)
  if (path === '/') return '/'
  const parts = path.replace(/\/+$/, '').split('/')
  parts.pop()

  if (parts.length === 0) return '.'
  if (parts.length === 1 && parts[0] === '') return '/'

  return parts.join('/') || '/'
}
