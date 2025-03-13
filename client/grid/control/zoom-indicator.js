import { define, currentNode } from 'https://esm.sh/minicomp'
import { ref, html } from 'https://esm.sh/rehtm'

import '../../design/glass/pane.js'
import { observe } from '../../util/observe.js'
import { constantly } from '../../util/constantly.js'


define('zoom-indicator', ({ camera, initial = 200, min = 100, max = 300 }) => {
  const host = currentNode()
  const holder = ref()
  const indicator = ref()
  let zoom = initial
  let active = false
  let activetimeout
  let firstzoom = true

  observe(camera, 'zoom', ({ detail }) => {
    zoom = detail.zoom
    min = detail.min ?? min
    max = detail.max ?? max

    if (!firstzoom) {
      active = true
      clearTimeout(activetimeout)
      activetimeout = setTimeout(() => (active = false), 1000)
    } else {
      firstzoom = false
    }
  })

  constantly(() => {
    host.style.opacity = active ? 1 : (host.style.opacity > 0.01 ? host.style.opacity * .95 : 0)
    indicator.current.style.left =
      ((zoom - min) / (max - min)
        * holder.current.getBoundingClientRect().width + 16) + 'px'
  })

  return html`
    <style>
      glass-pane {
        position: fixed;
        bottom: calc(5vh - 10px);
        left: calc(50vw - 48px);
        width: 64px;
        padding: 8px 16px;
        border-radius: 16px;

        @media screen and (max-width: 600px) {
          bottom: calc(4ch + 48px);
        }
      }
      .holder {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 8px;
        }

        .marker {
          width: 1px;
          height: 4px;
          background: #ffffff88;

          &:nth-of-type(4n+1) {
            height: 8px;
          }
        }

        #indicator {
          width: 3px;
          border-radius: 1px;
          height: 8px;
          background: #ffffff;
          position: absolute;
        }
    </style>
    <glass-pane>
      <div class="holder" ref=${holder}>
        <div id="indicator" ref=${indicator}></div>
        <div class="marker"></div>
        <div class="marker"></div>
        <div class="marker"></div>
        <div class="marker"></div>
        <div class="marker"></div>
        <div class="marker"></div>
        <div class="marker"></div>
        <div class="marker"></div>
        <div class="marker"></div>
        <div class="marker"></div>
        <div class="marker"></div>
        <div class="marker"></div>
        <div class="marker"></div>
        <div class="marker"></div>
        <div class="marker"></div>
      </div>
    </glass-pane>
  `
})
