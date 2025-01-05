import {
  define, useDispatch,
  onAttribute, onProperty, onConnected, onCleanup,
} from 'https://esm.sh/minicomp'
import { html, ref } from 'https://esm.sh/rehtm'

import '../util/track-cursor.js'
import { constantly } from '../util/constantly.js'
import { observe } from '../util/observe.js'
import { createGallery } from './image/gallery.js'
import { drawTile } from './tile.js'


define('infinite-grid', () => {
  const WMIN = Math.min(window.innerWidth, window.innerHeight)
  const WMAX = Math.max(window.innerWidth, window.innerHeight)
  const SUPPORTS_HOVER = window.matchMedia('(any-hover: hover)').matches
  const SMALL_DEVICE = WMAX <= 800
  /**
   * how many frames to draw after a change is triggered?
   * - 1 is minimum.
   * - more is smoother animation, but more battery usage
   */
  const ANIMATION_SMOOTHNESS = SMALL_DEVICE ? 2 : 32

  //
  // TODO:
  //   rendering should be done offscreen for increased performance.
  // this means gallery should be inlined with the rendering worker
  // as it needs to reside in the same memroy space.
  //
  // also we'd need to cook up a way for having the rendering worker
  // access the repo (since the repo object itself is not transferrable
  // and should not be transferred, and needs to reside in the main worker).
  //
  const repo = ref()
  repo.current= { get: () => undefined }

  let imageCacheSize = 100
  const gallery = createGallery(imageCacheSize)

  const onHover = useDispatch('tile-hover')
  const onClick = useDispatch('tile-click')

  const canvas = ref()
  const ctx = ref()

  const camera = { x: .5, y: .5, v: 0, zoom: 200 }
  let width, height

  let _last_hovered_tile
  const mouse = {
    x: -Infinity, y: -Infinity, supportsHover: SUPPORTS_HOVER,
    onHover: tile => {
      if (tile !== _last_hovered_tile) {
        onHover(tile)
      }

      _last_hovered_tile = tile
    }
  }

  const resize = () => {
    width = window.innerWidth
    height = window.innerHeight + (SMALL_DEVICE ? 80 : 0)

    canvas.current.width = width * devicePixelRatio
    canvas.current.height = height * devicePixelRatio

    ctx.current.resetTransform()
    ctx.current.scale(devicePixelRatio, devicePixelRatio)
    draw()
  }

  const _draw = () => {
    ctx.current.fillStyle = '#000'
    ctx.current.fillRect(0, 0, width, height)

    const left = Math.floor(camera.x - width / (2 * camera.zoom)) - 2
    const right = Math.floor(camera.x + width / (2 * camera.zoom)) + 2
    const top = Math.floor(camera.y - height / (2 * camera.zoom)) - 2
    const bottom = Math.floor(camera.y + height / (2 * camera.zoom)) + 2

    const bounds = { width, height, wmin: WMIN }

    for (let x = left; x <= right; x++) {
      for (let y = top; y <= bottom; y++) {
        drawTile(ctx.current, {x, y}, bounds, camera, mouse, gallery, repo.current)
      }
    }
  }

  let _drawReq = 0
  const draw = () => _drawReq = ANIMATION_SMOOTHNESS

  constantly(() => _drawReq > 0 && (_drawReq--, _draw()))
  /** generally repaint every second, so images in view remain cached. */
  constantly(_draw, f => setTimeout(f, 1000))
  gallery.listen(draw)

  observe(window, 'resize', resize)
  onConnected(() => {
    ctx.current ??= canvas.current?.getContext('2d', { alpha: false })
    resize()
    draw()
  })
  onCleanup(() => gallery.dispose())

  const valid = (n, prev) => n !== undefined && !isNaN(n) ? n : prev
  onAttribute('camx', x => (camera.x = valid(parseFloat(x), camera.x), draw()))
  onAttribute('camy', y => (camera.y = valid(parseFloat(y), camera.y), draw()))
  onAttribute('zoom', zoom => (camera.zoom = valid(parseFloat(zoom), camera.zoom), draw()))
  onAttribute('panv', v => (camera.v = valid(parseFloat(v), camera.v), draw()))

  onProperty('repo', r => r && (repo.current = r, r.listen(draw), draw()))
  onAttribute('image-cache-size', s => gallery.limit(imageCacheSize = valid(parseInt(s), imageCacheSize)))

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
    <canvas ref=${canvas} onclick=${() => onClick(_last_hovered_tile)}></canvas>
    <track-cursor onmove=${({ detail }) => (mouse.x = detail.x, mouse.y = detail.y, draw())}></track-cursor>
  `
})
