import { attachControls, useDispatch } from 'minicomp'
import { ref, html } from 'rehtm'

import { singleton } from '../../util/singleton.js'

import '../../design/glass/modal/component.js'
import '../../design/confirm/component.js'
import '../../design/input/text/component.js'


export const modal = singleton('email-signin-modal', () => {
  const modal = ref()
  const email = ref()
  const confirm = ref()
  const done = useDispatch('done')
  const cancel = useDispatch('cancel')

  attachControls({
    open: () => modal.current.controls.open(),
  })

  const check = ({ detail }) => {
    if (detail.valid) {
      confirm.current.removeAttribute('disabled')
    } else {
      confirm.current.setAttribute('disabled', '')
    }
  }

  return html`
    <glass-modal ref=${modal} onclose=${() => cancel('login cancelled')}>
      <span slot='title'>Sign in <br/> with Email</span>
      <p style='opacity: .5; font-weight: 100'>
        If you want to sign in on a device not supporting passkeys,
        or without access to your passkeys, simply enter your email address,
        and use the one time code that is sent to you. Note that you need
        to already have an account to sing in this way.
      </p>
      <text-input ref=${email} name='email' label='Email'
          required type='email' oncheck=${check}>
        <span slot='hint'>
          Make sure you enter your correct email address.
        </span>
      </text-input>
      <br/>
      <confirm-button ref=${confirm} disabled label='Send One Time Code'
        onconfirm=${() => {
            done(email.current.value)
            modal.current.controls.close()
          }}></confirm-button>
    </glass-modal>
  `
})
