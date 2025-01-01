import { define, useDispatch, onAttribute, currentNode } from 'https://esm.sh/minicomp'
import { ref, html } from 'https://esm.sh/rehtm'

import '../util/glass-pane.js'
import { observe } from '../util/observe.js'


define('pan-indicator', ({ camera }) => {
  const self = currentNode()
  const onPan = useDispatch('pan')
  const xinput = ref()
  const yinput = ref()

  const resize = input => input.style.width = `calc(${input.value.length + 1}ch)`
  const set = (input, value) => {
    if (
        value !== undefined && !isNaN(value) &&
        !(
          document.activeElement === self &&
          self.shadowRoot.activeElement === input.current
        )
      ) {
      input.current.value = Math.floor(value)
      resize(input.current)
    }
  }

  observe(camera, 'pan', ({ detail }) => {
    set(xinput, detail.camera.x)
    set(yinput, detail.camera.y)
  })

  onAttribute('x', value => set(xinput, parseInt(value)))
  onAttribute('y', value => set(yinput, parseInt(value)))

  // TODO: on mobile this is not a fun experience,
  //       since there isn't a good keyboard for coords.
  //       we should perhaps use a custom keyboard on mobile
  //       with a dialog to enter coords
  const go = (event) => {
    resize(event.target)
    const x = parseInt(xinput.current.value)
    const y = parseInt(yinput.current.value)
    if (!isNaN(x) && !isNaN(y)) {
      onPan({ x, y })
    }
  }

  return html`
    <style>
      glass-pane {
        position: fixed;
        bottom: 0px;
        right: 0px;
        padding-left: 1ch;
        padding-right: 2ch;
        border-top-left-radius: 12px;
      }

      input {
        &::-webkit-inner-spin-button,
        &::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        text-align: right;
        margin: .25rem;
        width: 1ch;
        padding: 0;
        font-size:12px;
        font-weight: bold;
        color: #ffffff88;
        background: none;
        border: none;
        outline: none;
        white-space: nowrap;
    }
    </style>
    <glass-pane>
      <input ref=${xinput} type="text" value="0" pattern="-?[0-9]*" oninput=${go} /> ,
      <input ref=${yinput} type="text" value="0" pattern="-?[0-9]*" oninput=${go} />
    </glass-pane>
  `
})
