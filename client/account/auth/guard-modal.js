import { useDispatch, attachControls } from 'minicomp'
import { html, ref } from 'rehtm'

import { singleton } from '../../util/singleton.js'
import '../../design/overlays/modal/component.js'
import '../../design/buttons/button/components.js'

import { login, register } from './index.js'
import { authenticate as emaillogin } from '../email/index.js'
import { waitForOneBroadcast } from '../../util/broadcast.js'

export const modal = singleton('auth-guard-modal', () => {
  const done = useDispatch('done')
  const cancel = useDispatch('cancel')

  const modal = ref()

  attachControls({
    open: () => modal.current.controls.open(),
  })

  const attempt = async (op) => {
    try {
      op({ silent: true })
      await waitForOneBroadcast('account:login')
      done()
      modal.current.controls.close()
    } catch {
      // Well, nothing to do, maybe the user
      // tries another method.
    }
  }

  return html`
    <glass-modal ref=${modal} noheader onclose=${() => cancel('auth cancelled')}>
      <h2>Authentication Required</h2>
      <p>
        You need to be logged in to proceed. Either login using your passkey, login with your email, or create a new
        account.
      </p>

      <action-list>
        <primary-button row onclick=${() => attempt(login)}>
          <i-con src="key" dark thick slot="icon"></i-con>
          Login
        </primary-button>
        <secondary-button row onclick=${() => attempt(emaillogin)}>
          <i-con src="envelop" dark thick slot="icon"></i-con>
          Login with Email
        </secondary-button>
        <secondary-button row onclick=${() => attempt(register)}>
          <i-con src="person-plus" dark thick slot="icon"></i-con>
          Create New Account
        </secondary-button>
        <secondary-button row faded onclick=${() => modal.current.controls.close()}> Cancel </secondary-button>
      </action-list>
    </glass-modal>
  `
})
