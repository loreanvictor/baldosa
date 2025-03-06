import { define, onAttribute, onConnected } from 'https://esm.sh/minicomp'
import { html, ref } from 'https://esm.sh/rehtm'

import '../tile/preview/component.js'
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

  let scale = SMALL_DEVICE ? Math.min(WMIN / 2.5, MAX_SCALE) : Math.min(WMIN / 3.5, MAX_SCALE)

  onAttribute('base-url', baseURL => {
    if (!baseURL) {
      return
    }

    // TODO: add cleanup logic as well.

    const mask = createGridMask({
      mapUrl: (x, y) => `${baseURL}/tilemap-${x}-${y}.bin`,
      chunkSize: 256
    })
  
    grid.current.setAttribute('src', baseURL)
    grid.current.setAttribute('zoom', scale)
    grid.current.setAttribute('image-cache-size', IMG_CACHE_SIZE)
    grid.current.setProperty('mask', mask)
  
    camera.current.setAttribute('camx', .5)
    camera.current.setAttribute('camy', .5)
    camera.current.setAttribute('zoom', scale)
    camera.current.setAttribute('minzoom', MIN_SCALE)
    camera.current.setAttribute('maxzoom', MAX_SCALE)
    camera.current.addEventListener('pan', ({ detail }) => {
      grid.current.setAttribute('camx', detail.camera.x)
      grid.current.setAttribute('camy', detail.camera.y)
  
      grid.current.setAttribute('panv', Math.sqrt(
        detail.velocity.x * detail.velocity.x
        + detail.velocity.y * detail.velocity.y
      ) / scale)
    })
    camera.current.addEventListener('zoom', ({ detail }) => {
      scale = detail.zoom
      grid.current.setAttribute('zoom', detail.zoom)
    })
  
    panind.current.addEventListener('pan', ({ detail }) => {
      camera.current.setAttribute('camx', detail.x + .5)
      camera.current.setAttribute('camy', detail.y + .5)
    })
  
    grid.current.addEventListener('tile-hover', ({ detail }) => {
      grid.current.setAttribute('x', detail.x)
      grid.current.setAttribute('y', detail.y)
    })
  
    prev.current.setAttribute('base-url', baseURL)
    prev.current.setProperty('mask', mask)
    grid.current.addEventListener('tile-click', ({ detail }) => {
      prev.current.setProperty('tile', detail)
    })

    const goto = URL.parse(window.location).searchParams.get('tile')
    if (goto) {
      const [x, y] = goto.split(',')
      camera.current.setAttribute('camx', (parseInt(x) ?? 0) + .5)
      camera.current.setAttribute('camy', (parseInt(y) ?? 0) + .5)
    }
  })

  return html`
    <infinite-grid ref=${grid}></infinite-grid>
    <tile-preview ref=${prev}></tile-preview>
    <camera-control target=${grid} ref=${camera}></camera-control>
    <pan-indicator camera=${camera} ref=${panind}></pan-indicator>
    <zoom-indicator camera=${camera}></zoom-indicator>
  `
})

