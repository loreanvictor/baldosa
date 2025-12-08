import { attachControls } from 'minicomp'
import { ref, html } from 'rehtm'

import { singleton } from '../../util/singleton.js'
import '../../util/show-only.js'
import '../../design/overlays/modal/component.js'
import '../../design/buttons/button/components.js'
import '../../design/display/textual.js'

import '../email/verify.js'
import './passkeys/button.js'
import './passkeys/list.js'
import { passkeySupported } from '../auth/passkeys.js'

export const modal = singleton('account-settings-modal', () => {
  const modal = ref()

  attachControls({ open: () => modal.current.controls.open() })

  return html`
    <glass-modal ref=${modal} aside>
      <span slot="title">Settings</span>
      <h3>Verification</h3>
      <small-hint>
        Verifying your account helps with account recovery, security, processing of support requests, and allows more
        relaxed usage limits of various features.
      </small-hint>
      <verify-email-button row></verify-email-button>
      <h-r></h-r>
      <h3>Passkeys</h3>
      <small-hint>
        Your passkeys appear here. To add a new passkey, login on the device you want to add the passkey on, then click
        the "Add Passkey" button.
      </small-hint>
      <passkey-list></passkey-list>
      <show-only when=${passkeySupported()}>
        <add-passkey-button row></add-passkey-button>
      </show-only>
      <show-only when=${!passkeySupported()}>
        <small-hint>
          <i-con src="warning-sign" dark thick></i-icon>
          Your device or browser does not support passkeys.
        </small-hint>
      </show-only>
      <br /><br />
    </glass-modal>
  `
})
