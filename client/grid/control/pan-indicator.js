import { define, useDispatch, onAttribute } from 'minicomp'
import { ref, html } from 'rehtm'

import '../../design/overlays/pane.js'
import '../../design/overlays/modal/component.js'
import '../../design/inputs/coord/component.js'
import '../../design/buttons/button/components.js'
import '../../design/display/icon/component.js'
import { observe } from '../../util/observe.js'
import { isTyping } from '../../util/typing.js'
import { toNSEW } from '../../util/nsew.js'

define('pan-indicator', ({ camera }) => {
  const onPan = useDispatch('pan')
  const pos$ = ref()
  const modal$ = ref()
  const coord$ = ref()

  let x, y

  const update = () => (pos$.current.textContent = toNSEW(x, y, false, 'any'))

  observe(camera, 'pan', ({ detail }) => {
    x = Math.floor(detail.camera.x)
    y = Math.floor(detail.camera.y)
    update()
  })

  observe(window, 'keydown', (event) => {
    if (event.key === '/' && !isTyping()) {
      event.preventDefault()
      modal$.current.controls.open()
      coord$.current.setAttribute('placeholder', `${toNSEW(x, y)}`)
      coord$.current.controls.reset()
      coord$.current.focus()
    }
  })

  onAttribute('x', (value) => ((x = parseInt(value)), update()))
  onAttribute('y', (value) => ((y = parseInt(value)), update()))

  const go = () => {
    const target = coord$.current.value
    coord$.current.controls.reset()
    if (target.x !== NaN && target.y !== NaN) {
      onPan(target)
      modal$.current.controls.close()
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

        @media screen and (max-width: 600px) {
          bottom: auto;
          top: 12px;
          border-top-left-radius: 12px;
          border-bottom-left-radius: 12px;
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
    <glass-pane
      onclick=${() => {
        coord$.current.setAttribute('placeholder', `${toNSEW(x, y)}`)
        modal$.current.controls.open()
        coord$.current.controls.reset()
        coord$.current.focus()
      }}
    >
      <span ref=${pos$}>0</span>
    </glass-pane>
    <glass-modal ref=${modal$}>
      <coord-input ref=${coord$} oncomplete=${go} completebtn></coord-input>
    </glass-modal>
  `
})
