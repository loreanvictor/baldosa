import {
  define,
  useDispatch,
  currentNode,
  attachControls,
  on,
  onRendered,
  onConnected,
  onAttribute,
  ATTRIBUTE_REMOVED,
} from 'minicomp'
import { ref, html } from 'rehtm'

import { observe } from '../../../util/observe.js'
import { onClickOutOfMe } from '../../../util/click-out.js'
import { constrainOffset, localpos, clamp, touchdist } from './util.js'

const SIZE = 512

define('image-input', () => {
  const oncheck = useDispatch('check', { bubbles: true })
  const oninput = useDispatch('input')

  const self = currentNode()
  const input = ref()
  const canvas = ref()
  const ctx = ref()
  const overlay = ref()

  let loaded = false
  let required = false
  let img = new Image()
  let minscale = 1
  let maxscale = 1
  let scale = 1
  let offset = { x: 0, y: 0 }
  let initial = { offset: { x: 0, y: 0 }, scale: 1 }

  onRendered(() => {
    canvas.current.width = SIZE
    canvas.current.height = SIZE
    ctx.current = canvas.current.getContext('2d')
  })

  onAttribute('required', (r) => {
    if (r !== undefined) {
      if (r === ATTRIBUTE_REMOVED) {
        required = false
        input.current.removeAttribute('required')
      } else {
        required = !!r
        input.current.setAttribute('required', r)
      }

      check()
    }
  })

  const check = () => {
    self.validity = {
      valid: loaded || !required,
      valueMissing: !loaded && required,
    }

    oncheck(self.validity)
  }

  onConnected(check)

  const calcminscale = () => Math.max(SIZE / img.width, SIZE / img.height)
  const calcmaxscale = () => 1
  const calcinitoffset = () => ({
    x: (SIZE - img.width * minscale) / 2,
    y: (SIZE - img.height * minscale) / 2,
  })

  const draw = () => {
    ctx.current.clearRect(0, 0, SIZE, SIZE)
    if (loaded) {
      ctx.current.save()
      ctx.current.translate(offset.x, offset.y)
      ctx.current.scale(scale, scale)
      ctx.current.drawImage(img, 0, 0)
      ctx.current.restore()
    }
  }

  const loadimg = (src) => {
    img.onload = () => {
      loaded = true
      overlay.current.classList.add('loaded')
      scale = calcminscale()
      minscale = scale
      maxscale = calcmaxscale()
      offset = calcinitoffset()
      initial = { offset: { ...offset }, scale }

      oninput({ src: img.src, offset, scale })
      check()
      draw()
    }

    img.crossOrigin = 'anonymous'
    img.src = src
  }

  const load = (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      loadimg(reader.result)
    }

    reader.readAsDataURL(file)
  }

  const unload = () => {
    loaded = false
    overlay.current.classList.remove('loaded')
    ctx.current.clearRect(0, 0, SIZE, SIZE)
    input.current.value = ''
    img.src = ''
    oninput({ src: '' })
    check()
  }

  const reset = () => {
    offset = { ...initial.offset }
    scale = initial.scale
    draw()
    oninput({ offset, scale })
  }

  // ------ loading the image ------
  observe(overlay, 'click', () => !loaded && input.current.click())
  observe(input, 'change', () => input.current.files?.[0] && load(input.current.files[0]))
  observe(overlay, 'dragover', (e) => (e.preventDefault(), canvas.current.classList.add('dnd')))
  observe(overlay, 'dragleave', (e) => (e.preventDefault(), canvas.current.classList.remove('dnd')))
  observe(overlay, 'drop', (e) => {
    e.preventDefault()
    canvas.current.classList.remove('dnd')
    if (e.dataTransfer.files?.[0]) {
      load(e.dataTransfer.files[0])
      input.current.files = e.dataTransfer.files
    }
  })

  // ------ exporting the image ------
  const untouch = () => canvas.current.classList.remove('touched')
  attachControls({
    load: (blob) => load(blob),
    loadUrl: (url) => loadimg(url),
    loaded: () => loaded,
    set: (state) => {
      loaded = state.src !== '' && state.src !== undefined
      img.crossOrigin = 'anonymous'
      img.src = state.src
      if (loaded) {
        overlay.current.classList.add('loaded')
        offset = state.offset
        scale = state.scale
        img.onload = () => {
          minscale = calcminscale()
          maxscale = calcmaxscale()
          initial = { offset: calcinitoffset(), scale: minscale }
          draw()
        }
      } else {
        overlay.current.classList.remove('loaded')
        img.src = ''
      }

      check()
    },
    export: async () => {
      if (loaded) {
        return new Promise((resolve) => {
          canvas.current.toBlob((blob) => {
            resolve(blob)
          }, 'image/jpeg')
        })
      }
    },
    untouch,
    clear: () => {
      unload()
      untouch()
      self.validity = {}
      check()
    },
  })

  // ------ focus management ------
  const focus = () => (canvas.current.classList.add('focused'), canvas.current.classList.add('touched'))
  const blur = () => canvas.current.classList.remove('focused')
  on('pointerdown', () => focus())
  onClickOutOfMe(() => blur())

  // ------ modification feedback ------
  let modtimer
  const markmod = () => {
    focus()
    overlay.current.classList.add('mod')
    clearTimeout(modtimer)
    modtimer = setTimeout(() => overlay.current.classList.remove('mod'), 500)
  }

  // ------ drag the image around ------
  let last = { x: 0, y: 0 }
  let dragging = false

  observe(
    overlay,
    'pointerdown',
    (e) => {
      if (loaded && !pinching) {
        e.preventDefault()
        e.stopPropagation()
        dragging = true
        last = localpos(e, overlay.current).pos
        overlay.current.setPointerCapture(e.pointerId)
      }
    },
    { passive: false },
  )

  observe(
    overlay,
    'pointermove',
    (e) => {
      if (loaded && dragging && !pinching) {
        e.preventDefault()
        e.stopPropagation()
        const { pos } = localpos(e, overlay.current)
        const dx = pos.x - last.x
        const dy = pos.y - last.y
        offset.x += dx
        offset.y += dy
        constrainOffset(offset, img.width, img.height, scale, SIZE)
        oninput({ offset })
        draw()
        last = pos
        markmod()
      }
    },
    { passive: false },
  )

  observe(
    overlay,
    'pointerup',
    (e) => {
      if (loaded && dragging && !pinching) {
        e.preventDefault()
        e.stopPropagation()
        dragging = false
        overlay.current.releasePointerCapture(e.pointerId)
      }
    },
    { passive: false },
  )

  // ------ zooming the image ------

  observe(
    overlay,
    'wheel',
    (e) => {
      if (loaded) {
        e.preventDefault()
        e.stopPropagation()
        const zoom = e.deltaY < 0 ? 1.03 : 0.97
        const nscale = clamp(scale * zoom, minscale, maxscale)
        const pos = localpos(e, overlay.current).pos
        offset.x = pos.x - ((pos.x - offset.x) / scale) * nscale
        offset.y = pos.y - ((pos.y - offset.y) / scale) * nscale
        scale = nscale
        constrainOffset(offset, img.width, img.height, scale, SIZE)
        oninput({ offset, scale })

        draw()
        markmod()
      }
    },
    { passive: false },
  )

  let pinching = false
  let lastdist = 0

  observe(
    overlay,
    'touchstart',
    (e) => {
      if (loaded) {
        e.preventDefault()
        e.stopPropagation()
      }
      if (loaded && e.touches.length === 2) {
        pinching = true
        lastdist = touchdist(e)
      }
    },
    { passive: false },
  )

  observe(
    document,
    'touchmove',
    (e) => {
      if (loaded && pinching) {
        const dist = touchdist(e)
        const zoom = dist / lastdist
        const nscale = clamp(scale * zoom, minscale, maxscale)
        const rect = overlay.current.getBoundingClientRect()
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top
        const pos = {
          x: (mx * canvas.current.width) / rect.width,
          y: (my * canvas.current.height) / rect.height,
        }

        offset.x = pos.x - ((pos.x - offset.x) / scale) * nscale
        offset.y = pos.y - ((pos.y - offset.y) / scale) * nscale
        scale = nscale
        constrainOffset(offset, img.width, img.height, scale, SIZE)
        oninput({ offset, scale })
        lastdist = dist

        draw()
        markmod()
      }
    },
    { passive: false },
  )

  observe(
    document,
    'touchend',
    (e) => {
      if (loaded && pinching) {
        e.preventDefault()
        e.stopPropagation()
        pinching = false
      }
    },
    { passive: false },
  )

  return html`
    <link rel="stylesheet" href="./client/design/inputs/image/styles.css" />
    <input ref=${input} type="file" accept="image/*" style="display: none" />
    <div style="position: relative">
      <canvas ref=${canvas}></canvas>
      <div id="overlay" ref=${overlay}>
        <div id="placeholder">
          <slot name="placeholder"></slot>
        </div>
      </div>
      <div id="tools" role="group">
        <button onclick=${(e) => (e.stopPropagation(), unload())}><i-con src="trash-can" dark thick></i-con></button>
        <button onclick=${() => reset()}><i-con src="arrow-uturn-left" dark thick></i-con></button>
      </div>
    </div>
  `
})
