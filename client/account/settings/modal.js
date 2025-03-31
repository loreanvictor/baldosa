import { attachControls } from 'minicomp'
import { ref, html } from 'rehtm'

import { singleton } from '../../util/singleton.js'
import '../../design/glass/modal/component.js'
import '../../design/button/components.js'
import '../../design/misc/textual.js'

import '../email/verify.js'
import './passkeys/button.js'
import './passkeys/list.js'

import { all, remove } from './passkeys/index.js'


export const modal = singleton('account-settings-modal', () => {
  const modal = ref()

  attachControls({ open: () => modal.current.controls.open() })

  return html`
    <glass-modal ref=${modal} aside>
      <span slot='title'>Settings</span>
      <h3>Verification</h3>
      <small-hint>
      Verifying your account helps with account recovery, security, processing of
      support requests, and allows more relaxed usage limits of various features.
      </small-hint>
      <verify-email-button row></verify-email-button>
      <h-r></h-r>
      <h3>Passkeys</h3>
      <small-hint>
        Your passkeys appear here. To add a new passkey, login on the device
        you want to add the passkey on, then click the "Add Passkey" button.
      </small-hint>
      <passkey-list></passkey-list>
      <add-passkey-button row></add-passkey-button>
      <br/><br/>
    </glass-modal>
  `
})
