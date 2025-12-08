import { useDispatch, attachControls } from 'minicomp'
import { html, ref } from 'rehtm'

import '../../util/show-only.js'
import { singleton } from '../../util/singleton.js'
import { onBroadcast } from '../../util/broadcast.js'
import '../../design/overlays/modal/component.js'
import '../../design/buttons/button/components.js'
import '../../design/inputs/text/component.js'
import '../../design/inputs/checkbox/component.js'
import { modal as termsmodal } from '../terms.js'
import { register as registerWithEmail } from '../email/index.js'
import { passkeySupported } from './passkeys.js'

export const modal = singleton('register-modal', () => {
  const ok = useDispatch('done')
  const cancel = useDispatch('cancel')
  const modal = ref()
  const opts = ref()
  const email = ref()
  const firstname = ref()
  const lastname = ref()
  const terms = ref()
  const btn = ref()
  const emailoptbtn = ref()

  onBroadcast('account:login', () => modal.current.controls.close())

  attachControls({
    open: () => modal.current.controls.open(),
  })

  const check = () => {
    const valid =
      email.current?.validity?.valid &&
      firstname.current?.validity?.valid &&
      lastname.current?.validity?.valid &&
      terms.current?.checked

    if (!valid) {
      btn.current.setAttribute('disabled', '')
      emailoptbtn.current.setAttribute('disabled', '')
    } else {
      btn.current.removeAttribute('disabled')
      emailoptbtn.current.removeAttribute('disabled')
    }

    return valid
  }

  const done = () => {
    const valid = check()
    if (valid) {
      ok({
        email: email.current.value,
        firstname: firstname.current.value,
        lastname: lastname.current.value,
      })
      modal.current.controls.close()
    }
  }

  const withEmail = () => {
    const valid = check()
    if (valid) {
      registerWithEmail({
        email: email.current.value,
        firstname: firstname.current.value,
        lastname: lastname.current.value,
      })
    }
  }

  return html`
    <style>
      .name-input {
        display: flex;
        gap: 1em;

        text-input {
          flex-grow: 1;
        }
      }

      a {
        color: var(--blue-fg);
      }

      form {
        margin-top: -2ex;
      }

      [role='group'] {
        display: flex;
        gap: 0.5ch;

        > primary-button,
        :has(primary-button) {
          flex: 1;
        }
      }
    </style>
    <glass-modal ref=${modal} onclose=${() => cancel('registration cancelled')}>
      <span slot="title">New Account</span>
      <form>
        <div class="name-input">
          <text-input
            ref=${firstname}
            name="first-name"
            label="First Name"
            required
            minlength="3"
            maxlength="32"
            oncheck=${check}
          ></text-input>
          <text-input
            ref=${lastname}
            name="last-name"
            label="Last Name"
            required
            minlength="2"
            maxlength="32"
            oncheck=${check}
          ></text-input>
        </div>
        <text-input ref=${email} name="email" label="Email" required type="email" oncheck=${check}>
          <span slot="hint">
            Make sure you enter your correct email address. <br />
            You'll only be able to recover your account via this email address.
          </span>
        </text-input>
        <check-box ref=${terms} oncheck=${check}>
          I've read and accept the
          <a href="javascript:void(0)" onclick=${() => termsmodal().controls.open()}> terms and conditions</a>.
        </check-box>
        <br /><br />
        <show-only when=${passkeySupported()}>
          <div role="group">
            <secondary-button
              onclick=${(e) => opts.current.controls.open({ anchor: e.target.closest('secondary-button') })}
              ><i-con src="ellipsis" dark thick slot="icon"></i-con>
            </secondary-button>
            <primary-button ref=${btn} onclick=${done} primary-modal-action> Create Account </primary-button>
          </div>
        </show-only>
        <show-only when=${!passkeySupported()}>
          <primary-button ref=${btn} onclick=${withEmail} primary-modal-action>
            Create Account via Email
            <i-con src="envelop" light thick slot="icon" style="margin-left: 2ex"></i-con>
          </primary-button>
        </show-only>
      </form>
    </glass-modal>
    <glass-modal ref=${opts} noheader>
      <action-list>
        <secondary-button row ref=${emailoptbtn} onclick=${withEmail}>
          <i-con src="envelop" dark thick slot="icon"></i-con>
          Create Account via Email
        </secondary-button>
        <secondary-button row faded onclick=${() => opts.current.controls.close()}> Cancel </secondary-button>
      </action-list>
    </glass-modal>
  `
})
