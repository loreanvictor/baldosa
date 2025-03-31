import { useDispatch, attachControls } from 'minicomp'
import { ref, html } from 'rehtm'

import { singleton } from '../../util/singleton.js'

import '../glass/modal/component.js'
import '../button/components.js'


export const errmodal = singleton('error-modal', () => {
  const modal = ref()
  const title = ref()
  const msg = ref()
  const btn = ref()
  const errname = ref()
  const errmsg = ref()
  const retry = useDispatch('retry')

  attachControls({
    open: (message, error, retrylabel = 'Retry') => {
      modal.current.controls.open()
      title.current.textContent = error.status ?? 'Err'
      msg.current.textContent = message
      errname.current.textContent = `[${error.name}]::`
      errmsg.current.textContent = error.message
      btn.current.textContent = retrylabel
    }
  })

  return html`
    <style>
      pre {
        background: #08080888;
        padding: 2ch;
        margin: 1ch 0;
        color: var(--red-fg);
        border-radius: 5px;
        white-space: pre-wrap;
      }
      h1 {
        color: var(--red-fg);
        font-size: 5rem;
        margin-top: -1.5ex;
        margin-bottom: .5ex;
        font-family: monospace;

        @media screen and (max-width: 600px) {
          margin-top: -.5ex;
        }
      }
    </style>
    <glass-modal ref=${modal}>
      <h1 ref=${title}>Error</h1>
      <p ref=${msg}></p>
      <pre>
        <span ref=${errname} style='color: #424242; margin-right: 1ch'></span>
        <span ref=${errmsg}></span>
      </pre>
      <br/><br/>
      <btn-group>
        <primary-button ref=${btn} onclick=${() => {
          modal.current.controls.close()
          retry()
        }}></primary-button>
      </btn-group>
    </glass-modal>
  `
})
