import { define, useDispatch, onConnected, onCleanup, onAttribute } from 'https://esm.sh/minicomp'
import { template, ref } from 'https://esm.sh/rehtm'

import './drag-pan.js'
import './pinch-zoom.js'
import './wheel-pan-zoom.js'
import './touch-pan.js'
import './tap-zoom.js'


define('camera-control', ({ target,
    friction = 0.035, 
    camx = 0, camy = 0,
    zoom = 200, maxzoom = 300, minzoom = 100,
  }) => {

  const onPan = useDispatch('pan')
  const onZoom = useDispatch('zoom')

  let camera = { x: parseFloat(camx), y: parseFloat(camy) }
  let _zoom = zoom

  const boundZoom = zoom => {
    return Math.max(minzoom ?? 100, Math.min(maxzoom ?? 300, zoom ?? 200))
  }

  onAttribute('camx', value => (camera.x = parseFloat(value), onPan({ camera, velocity: { x: 0, y: 0 } })))
  onAttribute('camy', value => (camera.y = parseFloat(value), onPan({ camera, velocity: { x: 0, y: 0 } })))
  onAttribute('zoom', value => (
    _zoom = zoom = (value ? boundZoom(parseFloat(value)) : _zoom),
    onZoom({ zoom, velocity: 0 })
  ))
  onAttribute('maxzoom', value => maxzoom = value ? parseFloat(value) : maxzoom)
  onAttribute('minzoom', value => minzoom = value ? parseFloat(value) : minzoom)

  const drag = ref()
  const pinch = ref()
  const wheel = ref()
  const touch = ref()
  const tap = ref()

  const listeners = {
    drag: ({ detail }) => {
      camera.x += detail.x / _zoom
      camera.y += detail.y / _zoom
      onPan({ camera, velocity: detail })
    },
    pinch: ({ detail }) => {
      const zoom = boundZoom(_zoom + detail)
      if (zoom !== _zoom) {
        _zoom = zoom
        onZoom({ zoom: _zoom, velocity: detail, min: minzoom, max: maxzoom })
      }
    },
    wheelpan: ({ detail }) => {
      camera.x += detail.x / _zoom
      camera.y += detail.y / _zoom
      onPan({ camera, velocity: detail })
    },
    wheelzoom: ({ detail }) => {
      const zoom = boundZoom(_zoom + detail)
      if (zoom !== _zoom) {
        _zoom = zoom
        onZoom({ zoom: _zoom, velocity: detail, min: minzoom, max: maxzoom })
      }
    },
    touchpan: ({ detail }) => {
      camera.x += detail.x / _zoom
      camera.y += detail.y / _zoom
      onPan({ camera, velocity :detail })
    },
    tapzoom: ({ detail }) => {
      const zoom = boundZoom(_zoom + detail)
      if (zoom !== _zoom) {
        _zoom = zoom
        onZoom({ zoom: _zoom, velocity: detail, min: minzoom, max: maxzoom })
      }
    }, 
    tapreset: () => {
      let steps = 20
      const step = () => {
        const diff = (zoom - _zoom) / 5
        _zoom += diff
        if (--steps > 0) {
          requestAnimationFrame(step)
        } else {
          _zoom = zoom
        }
        onZoom({ zoom: _zoom, velocity: diff, min: minzoom, max: maxzoom })
      }
      step()
    },
  }

  onConnected(() => {
    drag.current?.addEventListener('pan', listeners.drag)
    pinch.current?.addEventListener('zoom', listeners.pinch)
    wheel.current?.addEventListener('pan', listeners.wheelpan)
    wheel.current?.addEventListener('zoom', listeners.wheelzoom)
    touch.current?.addEventListener('pan', listeners.touchpan)
    tap.current?.addEventListener('zoom', listeners.tapzoom)
    tap.current?.addEventListener('reset', listeners.tapreset)
  })

  onCleanup(() => {
    drag.current?.removeEventListener('pan', listeners.drag)
    pinch.current?.removeEventListener('zoom', listeners.pinch)
    wheel.current?.removeEventListener('pan', listeners.wheelpan)
    wheel.current?.removeEventListener('zoom', listeners.wheelzoom)
    touch.current?.removeEventListener('pan', listeners.touchpan)
    tap.current?.removeEventListener('zoom', listeners.tapzoom)
    tap.current?.removeEventListener('reset', listeners.tapreset)
  })

  return template`
    <drag-pan ref=${drag} target=${target} friction=${friction} />
    <pinch-zoom ref=${pinch} target=${target} friction=${friction} />
    <wheel-pan-zoom ref=${wheel} target=${target} friction=${friction} />
    <touch-pan ref=${touch} target=${target} friction=${friction} />
    <tap-zoom ref=${tap} target=${target} friction=${friction} />
  `
})
