import { waitForOne } from '../../util/wait-for-one.js'
import { errmodal } from '../../design/misc/errmodal.js'
import { waitoverlay } from '../../design/misc/wait-overlay.js'

import { setAccount, addVerification } from '../auth/index.js'

import { modal } from './modal.js'
import { modal as code } from './code.js'
import { modal as verif } from './verify.js'
import {
  sendAuthCode, authenticateWithCode,
  sendVerificationCode, verifyEmailWithCode,
} from './backend.js'


export const authenticate = async () => {
  modal().controls.open()
  const email = await waitForOne(modal(), 'done', 'cancel')

  try {
    waitoverlay().controls.open('Sending One Time Code')
    await sendAuthCode(email)
    waitoverlay().controls.close()

    code().controls.open()
    const listener = async ({ detail }) => {
      try {
        const user = await authenticateWithCode(email, detail)
        setAccount(user.email, `${user.firstname} ${user.lastname}`, user.verification, user.token)
        code().removeEventListener('complete', listener)
        code().controls.close()
      } catch (error) {
        if (error.status === 429) {
          code().controls.close()
          errmodal().controls.open(
            `You've entered the wrong code too many times. For security reasons, your account is locked for a few minutes, and you can only authenticate using passkeys.`,
            error,
            'Retry Later'
          )
        } else {
          code().controls.invalidate()
        }
      }
    }
  
    code().addEventListener('complete', listener)
    code().addEventListener('close', () => {
      code().removeEventListener('complete', listener)
    }, { once: true })
  
  } catch (error) {
    waitoverlay().controls.close()
    if (error.status === 429) {
      errmodal().controls.open(
        `You are trying to log in too many times. For security reasons, your account is locked for a few minutes, and you can only authenticate using passkeys.`,
        error,
        'Retry Later'
      )
    } else {
      errmodal().controls.open(
        `Could not authenticate, because of the following error:`,
        error
      )
      errmodal().addEventListener('retry', authenticate, { once: true })
    }
  }
}


export const verify = async () => {
  verif().controls.open()
  await waitForOne(verif(), 'done', 'cancel')

  try {
    waitoverlay().controls.open('Sending One Time Code')
    await sendVerificationCode()
    waitoverlay().controls.close()

    code().controls.open()
    const listener = async ({ detail }) => {
      try {
        await verifyEmailWithCode(detail)
        code().removeEventListener('complete', listener)
        code().controls.close()
        addVerification({
          email_verified_at: new Date().toISOString(),
        })
      } catch (error) {
        if (error.status === 429) {
          code().controls.close()
          errmodal().controls.open(
            `You've entered the wrong code too many times. For security reasons, the verification process is locked for a few minutes, please try again later.`,
            error,
            'Retry Later'
          )
        } else {
          code().controls.invalidate()
        }
      }
    }
  
    code().addEventListener('complete', listener)
    code().addEventListener('close', () => {
      code().removeEventListener('complete', listener)
    }, { once: true })
  
  } catch (error) {
    waitoverlay().controls.close()
    if (error.status === 429) {
      errmodal().controls.open(
        `You are trying to verify too many times. For security reasons, the verification process is locked for
        a few minutes, please try again later.`,
        error,
        'Retry Later'
      )
    } else {
      errmodal().controls.open(
        `Could not verify, because of the following error:`,
        error
      )
      errmodal().addEventListener('retry', verify, { once: true })
      throw error
    }
  }
}
