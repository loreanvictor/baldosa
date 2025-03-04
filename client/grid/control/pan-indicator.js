import { define, useDispatch, onAttribute, currentNode } from 'https://esm.sh/minicomp'
import { ref, html } from 'https://esm.sh/rehtm'

import '../../design/glass-pane.js'
import '../../design/glass-modal.js'
import '../../design/coord-input.js'
import '../../design/buttons.js'
import '../../design/icon.js'
import { observe } from '../../util/observe.js'


define('pan-indicator', ({ camera }) => {
  const onPan = useDispatch('pan')
  const x = ref()
  const y = ref()

  const modal = ref()
  const coord = ref()

  const set = (span, value) => {
    if (value !== undefined && !isNaN(value)) {
      span.current.textContent = Math.floor(value)
    }
  }

  observe(camera, 'pan', ({ detail }) => {
    set(x, detail.camera.x)
    set(y, detail.camera.y)
  })

  onAttribute('x', value => set(x, parseInt(value)))
  onAttribute('y', value => set(y, parseInt(value)))

  const go = () => {
    const target = coord.current.value
    coord.current.controls.reset()
    if (target.x !== NaN && target.y !== NaN) {
      onPan(target)
      modal.current.controls.close()
    }
  }

  return html`
    <style>
      glass-pane {
        cursor: pointer;
        position: fixed;
        bottom: 0px;
        right: 0px;
        padding-left: 1ch;
        padding-right: 2ch;
        border-top-left-radius: 12px;
        padding: 0.25ch 2ch;

        span {
          font-size: 0.8rem;
          font-weight: bold;
        }
      }

      glass-modal {
        input {
          border: none;
          background: none;
          outline: none;
          font-size: 1.1rem;
          color: white;
        }
      }
    </style>
    <glass-pane onclick=${() => {
      coord.current.setAttribute('placeholder', `${x.current.textContent},${y.current.textContent}`)
      modal.current.controls.open()
      coord.current.controls.reset()
      coord.current.focus()
    }}>
      <span ref=${x}>0</span> , <span ref=${y}>0</span>
    </glass-pane>
    <glass-modal ref=${modal}>
      <p>
        <coord-input ref=${coord} oncomplete=${go}></coord-input>
      </p>
      <primary-button onclick=${go}>
        <i-con src='arrow-right' thick slot='icon'></i-con>
        <!-- <img slot='icon' src='./client/assets/icons/arrow-right-light-thick.svg'/> -->
        Jump to Location
      </primary-button>
    </glass-modal>
  `
})
