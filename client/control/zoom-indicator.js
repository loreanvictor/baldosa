import { define, currentNode } from 'https://esm.sh/minicomp'
import { ref, html } from 'https://esm.sh/rehtm'

import { observe } from '../util/observe.js'
import { constantly } from '../util/constantly.js'


define('zoom-indicator', ({ control, initial = 200, min = 100, max = 300 }) => {
  const host = currentNode()
  const holder = ref()
  const indicator = ref()
  let zoom = initial
  let active = false
  let activetimeout

  observe(control, 'zoom', ({ detail }) => {
    zoom = detail.zoom
    min = detail.min ?? min
    max = detail.max ?? max
    active = true
    clearTimeout(activetimeout)
    activetimeout = setTimeout(() => (active = false), 1000)
  })

  constantly(() => {
    host.style.opacity = active ? 1 : (host.style.opacity > 0.01 ? host.style.opacity * .95 : 0)
    indicator.current.style.left =
      ((zoom - min) / (max - min)
        * holder.current.getBoundingClientRect().width + 16) + 'px'
  })

  return html`
    <style>
      :host {
        background: #42424288;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: #ffffff88;
        position: fixed;
        bottom: calc(5vh - 10px);
        left: calc(50vw - 40px);
        width: 64px;
        padding: 8px 16px;
        border-radius: 8px;
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
  `
})
