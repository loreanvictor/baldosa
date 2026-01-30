const key = '--grid-position'

let saveTimeout
let lastSave
const MAX_SAVE_DELAY = 1000
const SAVE_DEBOUNCE = 250

const current = {
  x: 0,
  y: 0,
  zoom: 1,
}

const save = () => {
  lastSave = Date.now()
  clearTimeout(saveTimeout)
  localStorage.setItem(key, `${current.x}:${current.y}:${current.zoom}`)
}

const enqueueSave = () => {
  if (!lastSave) {
    save()
  } else {
    const now = Date.now()
    const diff = now - lastSave
    if (diff > MAX_SAVE_DELAY) {
      save()
    } else {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        save()
      }, SAVE_DEBOUNCE)
    }
  }
}

export const savePosition = (x, y) => {
  current.x = x
  current.y = y
  enqueueSave()
}

export const saveZoom = (zoom) => {
  current.zoom = zoom
  enqueueSave()
}

export const loadPositionAndZoom = () => {
  const pos = localStorage.getItem(key)
  if (pos) {
    const [x, y, zoom] = pos.split(':').map((v) => parseFloat(v))
    return { x, y, zoom }
  }
  return null
}
