import { attachControls, useDispatch } from 'minicomp'
import { ref, html } from 'rehtm'

import { singleton } from '../../../util/singleton.js'
import '../../../design/glass/modal/component.js'
import '../../../design/button/components.js'
import '../../../design/confirm/component.js'

export const modal = singleton('remove-passkey-modal', () => {
  const onconfirm = useDispatch('confirm')
  const oncancel = useDispatch('cancel')
  const modal = ref()
  const keyname = ref()

  attachControls({ open: (key) => {
    keyname.current.textContent = key.key_name
    modal.current.controls.open()
  }})

  const confirm = () => (onconfirm(), modal.current.controls.close())
  const cancel = (close = true) => {
    oncancel('cancelled removing passkey')
    close && modal.current.controls.close()
  }

  return html`
    <style>
      btn-group > * {
        flex: 1;
      }

      i-con.danger {
        --color: var(--red-fg);
        width: 16ex;
        display: block;
        margin: auto;

        @media screen and (min-width: 600px) {
          margin-top: -7ch;
        }
      }

      p {
        font-weight: 100;
        color: #9e9e9e;
        margin-top: 0;
        margin-bottom: 4ex;

        span { font-weight: bold; color: var(--red-fg); }
      }
    </style>
    <glass-modal ref=${modal} onclose=${() => cancel(false)}>
      <i-con class='danger' src='warning-sign' dark thick></i-con>
      <p>
        You're about to delete <span ref=${keyname}>Passkey</span>. You won't be able to
        log in with this passkey anymore. This action is permanent
        and <u>cannot be undone</u>. You also need to delete the passkey from your browser manually.
      </p>
      <btn-group>
        <confirm-button danger label='Delete Passkey' onconfirm=${confirm}></confirm-button>
      </btn-group>
    </glass-modal>
  `
})
