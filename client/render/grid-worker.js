import { drawTile } from './tile.js'
import { createGallery } from './image/gallery.js'

let width
let height
let canvas
let ctx

const window = { width: 0, height: 0 }
const camera = { x: 0, y: 0, v: 0, zoom: 200 }

let _lastHoveredTile = undefined
const mouse = {
  x: -Infinity, y: -Infinity, supportsHover: false,
  onHover: tile => {
    if (tile !== _lastHoveredTile) {
      self.postMessage({ hover: tile })
      _lastHoveredTile = tile
    }
  }
}

let SMALL_DEVICE = false
let WMIN = 0
let WMAX = 0
const ANIMATION_SMOOTHNESS = 32

self.onmessage = ({ data }) => {
  if (data.window) {
    init(data.window)
  } else if (data.canvas) {
    plug(data.canvas)
  } else if (data.repo) {
    cache(data.repo, data.response)
  } else if (data['image-cache-size']) {
    gallery.limit(data['image-cache-size'])
  } else if (canvas) {
    if (data.size) {
      resize(data.size.width, data.size.height, data.size.devicePixelRatio)
    } else if (data.camera) {
      recam(data.camera)
    } else if (data.mouse) {
      recursor(data.mouse)
    }
  }
}

const init = ({ width, height, hover }) => {
  window.width = width
  window.height = height
  mouse.supportsHover = hover

  WMIN = Math.min(window.width, window.height)
  WMAX = Math.max(window.width, window.height)
  SMALL_DEVICE = WMAX <= 800
}

const plug = c => {
  canvas = c
  ctx = canvas.getContext('2d', { alpha: false })
}

const resize = (w, h, devicePixelRatio) => {
  width = w
  height = h + (SMALL_DEVICE ? 80 : 0)

  canvas.width = width * devicePixelRatio
  canvas.height = height * devicePixelRatio

  ctx.resetTransform()
  ctx.scale(devicePixelRatio, devicePixelRatio)

  draw()
}

const recam = cam => {
  camera.x = cam.x
  camera.y = cam.y
  camera.v = cam.v
  camera.zoom = cam.zoom

  draw()
}

const recursor = m => {
  mouse.x = m.x
  mouse.y = m.y

  draw()
}

const gallery = createGallery(100)

const repoCache = new Map()
const repoProxy = { 
  get: (x, y) => {
    const addr = `${x},${y}`
    if (repoCache.has(addr)) {
      return repoCache.get(addr)
    } else {
      self.postMessage({ repo: { x, y } })

      return undefined
    }
  }
}

const cache = ({x, y}, data) => {
  const addr = `${x},${y}`
  repoCache.set(addr, data)
}

// TODO: add a mechanism for limiting and cleaning the cache

const _draw = () => {
  if (!ctx) return

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)

  const left = Math.floor(camera.x - width / (2 * camera.zoom)) - 2
  const right = Math.floor(camera.x + width / (2 * camera.zoom)) + 2
  const top = Math.floor(camera.y - height / (2 * camera.zoom)) - 2
  const bottom = Math.floor(camera.y + height / (2 * camera.zoom)) + 2

  const bounds = { width, height, wmin: WMIN }

  for (let x = left; x <= right; x++) {
    for (let y = top; y <= bottom; y++) {
      drawTile(ctx, {x, y}, bounds, camera, mouse, gallery, repoProxy)
    }
  }
}

const schedule = f => setTimeout(f, 10)

let stopped = false
let _drawReq = 0
const draw = () => _drawReq = ANIMATION_SMOOTHNESS
const constantly = () => {
  if (_drawReq > 0) {
    _drawReq--
    _draw()
  }

  if (!stopped) {
    schedule(constantly)
  }
}
constantly()

gallery.listen(() => draw())