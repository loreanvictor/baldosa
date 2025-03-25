import { attachControls } from 'minicomp'
import { ref, html } from 'rehtm'

import { singleton } from '../../util/singleton.js'
import '../../design/glass/modal/component.js'
import '../../design/button/components.js'

import './passkeys/button.js'
import './passkeys/list.js'

import { all, remove } from './passkeys/index.js'


export const modal = singleton('account-settings-modal', () => {
  const modal = ref()

  attachControls({ open: () => modal.current.controls.open() })

  return html`
    <glass-modal ref=${modal} aside>
      <span slot='title'>Settings</span>
      <action-list island>
        <secondary-button row>
          <i-con src='envelop-check' dark thick slot='icon'></i-con>
          Verify Email
        </secondary-button>
        <add-passkey-button row></add-passkey-button>
      </action-list>
      <br/>
      <h4>Existing Passkeys</h4>
      <passkey-list></passkey-list>
      <br/>
      <small style='opacity: .5'>
        Your passkeys appear here. To add a new passkey, login on the device
        you want to add the passkey on, then click the "Add Passkey" button.
      </small>
      <br/><br/>
    </glass-modal>
  `
})
