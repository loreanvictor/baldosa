import { define, onAttribute } from 'minicomp'
import { html, ref } from 'rehtm'

import { onBroadcast, broadcast } from '../util/broadcast.js'

import '../tile/preview/modal.js'
import '../tile/preview/empty.js'

import './render/index.js'
import './control/camera-control.js'
import './control/pan-indicator.js'
import './control/zoom-indicator.js'

import { createGridMask } from './mask/index.js'

define('controlled-grid', () => {
  const WMIN = Math.min(window.innerWidth, window.innerHeight)
  const WMAX = Math.max(window.innerWidth, window.innerHeight)
  const SMALL_DEVICE = WMAX <= 800
  const MIN_SCALE = SMALL_DEVICE ? WMIN / 4 : WMIN / 5
  const MAX_SCALE = 300
  const IMG_CACHE_SIZE = (Math.ceil(WMIN / MIN_SCALE) + 4) * (Math.ceil(WMAX / MIN_SCALE) + 4) * 2

  const grid = ref()
  const camera = ref()
  const panind = ref()
  const prev = ref()
  const empty = ref()
  const mask = ref()

  let scale = SMALL_DEVICE ? Math.min(WMIN / 2.5, MAX_SCALE) : Math.min(WMIN / 3.5, MAX_SCALE)

  onAttribute('base-url', (baseURL) => {
    if (!baseURL) {
      return
    }

    // TODO: add cleanup logic as well.

    mask.current = createGridMask({
      mapUrl: (x, y) => `${baseURL}/tilemap-${x}-${y}.bin`,
      chunkSize: 256,
    })

    grid.current.setAttribute('src', baseURL)
    grid.current.setAttribute('zoom', scale)
    grid.current.setAttribute('image-cache-size', IMG_CACHE_SIZE)
    grid.current.setProperty('mask', mask.current)

    camera.current.setAttribute('camx', 0.5)
    camera.current.setAttribute('camy', 0.5)
    camera.current.setAttribute('zoom', scale)
    camera.current.setAttribute('minzoom', MIN_SCALE)
    camera.current.setAttribute('maxzoom', MAX_SCALE)
    camera.current.addEventListener('pan', ({ detail }) => {
      grid.current.setAttribute('camx', detail.camera.x)
      grid.current.setAttribute('camy', detail.camera.y)

      grid.current.setAttribute(
        'panv',
        Math.sqrt(detail.velocity.x * detail.velocity.x + detail.velocity.y * detail.velocity.y) / scale,
      )
    })
    camera.current.addEventListener('zoom', ({ detail }) => {
      scale = detail.zoom
      grid.current.setAttribute('zoom', detail.zoom)
    })

    panind.current.addEventListener('pan', ({ detail }) => {
      camera.current.setAttribute('camx', detail.x + 0.5)
      camera.current.setAttribute('camy', detail.y + 0.5)
    })

    grid.current.addEventListener('tile-hover', ({ detail }) => {
      grid.current.setAttribute('x', detail.x)
      grid.current.setAttribute('y', detail.y)
    })

    empty.current.setAttribute('base-url', baseURL)
    prev.current.setAttribute('base-url', baseURL)
    prev.current.setProperty('mask', mask.current)
    grid.current.addEventListener('tile-click', ({ detail }) => {
      if (mask.current.has(detail.x, detail.y) && detail.meta?.details?.preview !== false) {
        prev.current.setProperty('tile', detail)
      } else {
        empty.current.setProperty('tile', detail)
      }
    })

    const goto = new URL(window.location).searchParams.get('tile')
    if (goto) {
      const [x, y] = goto.split(',')
      camera.current.setAttribute('camx', (parseInt(x) ?? 0) + 0.5)
      camera.current.setAttribute('camy', (parseInt(y) ?? 0) + 0.5)
    }

    broadcast('grid:connected')
  })

  onBroadcast('tile:goto', ({ x, y }) => {
    camera.current.setAttribute('camx', (x ?? 0) + 0.5)
    camera.current.setAttribute('camy', (y ?? 0) + 0.5)
  })

  onBroadcast('tile:published', ({ x, y }) => mask.current?.patch(x, y, true))
  onBroadcast('tile:unpublished', ({ x, y }) => mask.current?.patch(x, y, false))

  return html`
    <infinite-grid ref=${grid}></infinite-grid>
    <tile-preview ref=${prev}></tile-preview>
    <empty-tile-actions ref=${empty}></empty-tile-actions>
    <camera-control target=${grid} ref=${camera}></camera-control>
    <pan-indicator camera=${camera} ref=${panind}></pan-indicator>
    <zoom-indicator camera=${camera}></zoom-indicator>
  `
})
