import { attachControls } from 'minicomp'
import { ref, html } from 'rehtm'

import { singleton } from './singleton.js'

import '../design/overlays/modal/component.js'
import '../design/buttons/button/components.js'
import '../design/display/textual.js'


export const modal = singleton('under-construction-modal', () => {
  const modal = ref()

  attachControls({
    open: () => modal.current.controls.open(),
  })

  return html`
    <style>
      h2 { margin: 0 }

      img {
        width: 320px;
        display: block;
        margin: 0 auto;
        mix-blend-mode: screen;
        animation: cycle 96s infinite;
      }

      @keyframes cycle {
        0% { filter: invert(0) blur(0px); -webkit-filter: invert(0) blur(0px); }
        10% { filter: invert(0) blur(4px); -webkit-filter: invert(0) blur(4px); }
        20% { filter: invert(0) blur(0px); -webkit-filter: invert(0) blur(0px); }
        40% { filter: invert(1) blur(1px); -webkit-filter: invert(1) blur(1px); }
        60% { filter: invert(1) blur(4px); -webkit-filter: invert(1) blur(4px); }
        80% { filter: invert(0) blur(1px); -webkit-filter: invert(0) blur(1px); }
      }
    </style>
    <glass-modal ref=${modal}>
      <img src='./client/assets/under-construction.png'/>
      <h2>Under Construction</h2>
      <small-hint>
        Sorry for the inconvenience, but this feature is currently under construction.
        Generally speaking, Baldosa is quite at an early stage and features might be missing
        or require further work.
      </small-hint>
      <small-hint>
        The good news is that Baldosa is open source, so you can help us!
        Report bugs, propose features, or help us implement missing features. Checkout our GitHub repository.
      </small-hint>
      <br/>
      <primary-button onclick=${() => window.open('https://github.com/loreanvictor/baldosa', '_blank')}>
        Open GitHub
        <i-con src='square-arrow' thick slot='icon'></i-con>
      </primary-button>
    </glass-modal>
  `
})