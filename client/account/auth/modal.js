import { useDispatch, attachControls } from 'https://esm.sh/minicomp'
import { html, ref } from 'https://esm.sh/rehtm'

import { singleton } from '../../util/singleton.js'
import '../../design/glass/modal/component.js'
import '../../design/button/components.js'
import '../../design/input/text/component.js'
import '../../design/input/checkbox/component.js'


export const modal = singleton('register-modal', () => {
  const ok = useDispatch('done')
  const cancel = useDispatch('cancel')
  const modal = ref()
  const email = ref()
  const firstname = ref()
  const lastname = ref()
  const terms = ref()
  const btn = ref()

  attachControls({
    open: () => modal.current.controls.open(),
  })

  const check = () => {
    const valid = email.current?.validity?.valid &&
      firstname.current?.validity?.valid &&
      lastname.current?.validity?.valid &&
      terms.current?.checked

    if (!valid) {
      btn.current.setAttribute('disabled', '')
    } else {
      btn.current.removeAttribute('disabled')
    }

    return valid
  }

  const done = () => {
    const valid = check()
    if (valid) {
      ok({
        email: email.current.value,
        name: `${firstname.current.value} ${lastname.current.value}`,
      })
      modal.current.controls.close()
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
    </style>
    <glass-modal ref=${modal} onclose=${() => cancel('registration cancelled')}>
      <span slot='title'>New Account</span>
      <form>
        <div class='name-input'>
          <text-input ref=${firstname} name='first-name' label='First Name'
            required minlength='3' maxlength='32' oncheck=${check}></text-input>
          <text-input ref=${lastname} name='last-name' label='Last Name'
            required minlength='2' maxlength='32' oncheck=${check}></text-input>
        </div>
        <text-input ref=${email} name='email' label='Email'
          required type='email' oncheck=${check}>
          <span slot='hint'>
            Make sure you enter a valid email address that is unique. <br/>
            If your email is not verifiable, your account will be purged.
          </span>
        </text-input>
        <check-box ref=${terms} oncheck=${check}>
          I've read and accept the <a href='./terms.md' target='_blank'>terms and conditions</a>.
        </check-box>
        <br/><br/>
        <primary-button ref=${btn} onclick=${done} primary-modal-action>
          Create Account
        </primary-button>
      </form>
    </glass-modal>
  `
})
