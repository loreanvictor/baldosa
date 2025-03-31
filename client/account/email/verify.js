import { define, attachControls, useDispatch, onConnected } from 'minicomp'
import { ref, html } from 'rehtm'

import { singleton } from '../../util/singleton.js'
import { onBroadcast } from '../../util/broadcast.js'

import '../../design/glass/modal/component.js'
import '../../design/confirm/component.js'
import '../../design/misc/textual.js'
import '../../design/button/components.js'

import { user } from '../auth/index.js'
import { verify } from './index.js'


define('verify-email-button', ({ row }) => {
  let verified = false

  const btn = ref()
  const icon = ref()
  const text = ref()

  const display = () => {
    if (verified) {
      icon.current.setAttribute('src', 'badge')
      icon.current.removeAttribute('thick')
      icon.current.setAttribute('fill', 'true')
      text.current.textContent = 'Email Verified'
      btn.current.setAttribute('disabled', '')
    } else {
      icon.current.setAttribute('src', 'envelop-check')
      icon.current.setAttribute('thick', 'true')
      icon.current.removeAttribute('fill')
      text.current.textContent = 'Verify Email'
      btn.current.removeAttribute('disabled')
    }
  }

  const update = () => {
    verified = user().verification?.email_verified_at !== null
    display()
  }

  onConnected(update)
  onBroadcast('account:login', update)
  onBroadcast('account:verification_updated', update)

  return html`
    <secondary-button row=${row} onclick=${verify} ref=${btn}>
      <i-con ref=${icon} src='envelop-check' dark slot='icon'></i-con>
      <span ref=${text}></span>
    </secondary-button>
  `
})

export const modal = singleton('email-verify-modal', () => {
  const modal = ref()
  const confirm = ref()
  const done = useDispatch('done')
  const cancel = useDispatch('cancel')

  attachControls({
    open: () => modal.current.controls.open(),
    close: () => modal.current.controls.close(),
  })

  return html`
    <glass-modal ref=${modal} onclose=${() => cancel('verification cancelled')}>
      <span slot='title'>Verify Email</span>
      <small-hint>
        A 6 digit one time code will be emailed to you, and by entering it you
        can verify your email address. We highly recommend verifying
        your email address as it allows you to recover your account in case you lose
        access to your passkeys.
      </small-hint>
      <br/>
      <confirm-button ref=${confirm} label='Send One Time Code'
        onconfirm=${() => {
            done()
            modal.current.controls.close()
          }}></confirm-button>
    </glass-modal>
  `
})
