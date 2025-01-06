import {
  define, useDispatch,
  onAttribute, onProperty, onRendered,
} from 'https://esm.sh/minicomp'
import { html, ref } from 'https://esm.sh/rehtm'

import '../util/track-cursor.js'
import { observe } from '../util/observe.js'


define('infinite-grid', () => {
  const worker = new Worker('/client/render/grid-worker.js', { type: 'module' })
  worker.postMessage({
    window: {
      width: window.innerWidth,
      height: window.innerHeight,
      hover: window.matchMedia('(any-hover: hover)').matches
    }
  })

  worker.onmessage = ({ data }) => {
    if (data.hover) {
      onHover(_lastHoveredTile = data.hover)
    } else if (data.repo) {
      const { x, y } = data.repo
      worker.postMessage({ repo: { x, y }, response: repo.current.get(x, y) })
    }
  }

  const repo = ref()
  repo.current= { get: () => undefined }

  let _lastHoveredTile = undefined
  const onHover = useDispatch('tile-hover')
  const onClick = useDispatch('tile-click')

  const canvas = ref()
  const cursor = ref()

  const camera = { x: .5, y: .5, v: 0, zoom: 200 }
  const resize = () => {
    worker.postMessage({
      size: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio
      }
    })
  }

  observe(window, 'resize', resize)
  onRendered(() => {
    const offscreen = canvas.current?.transferControlToOffscreen()
    worker.postMessage({ canvas: offscreen }, [offscreen])
    resize()

    cursor.current.addEventListener('move', ({ detail }) => {
      worker.postMessage({
        mouse: {
          x: detail.x,
          y: detail.y,
        }
      })
    })
  })

  const draw = () => {}
  const recam = () => worker.postMessage({ camera })

  const valid = (n, prev) => n !== undefined && !isNaN(n) ? n : prev
  onAttribute('camx', x => (camera.x = valid(parseFloat(x), camera.x), recam()))
  onAttribute('camy', y => (camera.y = valid(parseFloat(y), camera.y), recam()))
  onAttribute('zoom', zoom => (camera.zoom = valid(parseFloat(zoom), camera.zoom), recam()))
  onAttribute('panv', v => (camera.v = valid(parseFloat(v), camera.v), recam()))

  onProperty('repo', r => r && (repo.current = r, r.listen(draw), draw()))
  onAttribute('image-cache-size', s => {
    const size = parseInt(s)
    if (!isNaN(size)) {
      worker.postMessage({ 'image-cache-size': size })
    }
  })

  return html`
    <style>
      canvas {
        display:block;
        width:100vw;
        height:100vh;
        cursor: pointer;
        touch-action: none; /* Prevent default gestures */
      }
    </style>
    <canvas ref=${canvas} onclick=${() => onClick(_lastHoveredTile)}></canvas>
    <track-cursor ref=${cursor}></track-cursor>
  `
})
