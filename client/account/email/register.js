import { attachControls, useDispatch } from 'minicomp'
import { ref, html } from 'rehtm'

import { singleton } from '../../util/singleton.js'

import '../../design/overlays/modal/component.js'
import '../../design/buttons/confirm/component.js'
import '../../design/display/textual.js'

export const modal = singleton('email-register-modal', () => {
  const done = useDispatch('done')
  const cancel = useDispatch('cancel')
  const modal = ref()
  const email = ref()

  attachControls({
    open: (user) => {
      modal.current.controls.open()
      email.current.textContent = user.email
    },
  })

  return html`
    <glass-modal ref=${modal} onclose=${() => cancel('registration cancelled')}>
      <span slot="title">Create Account <br />via Email</span>
      <small-hint>
        A one time code will be sent to <strong><email ref=${email}></email></strong>. Use that code to complete your
        account registration. We highly recommend adding a passkey to your account afterwards for easier and more secure
        access.
      </small-hint>
      <br />
      <confirm-button
        ref=${confirm}
        label="Send One Time Code"
        onconfirm=${() => {
          done()
          modal.current.controls.close()
        }}
      ></confirm-button>
    </glass-modal>
  `
})
