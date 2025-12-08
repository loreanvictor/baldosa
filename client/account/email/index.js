import { waitForOne } from '../../util/wait-for-one.js'
import { errmodal } from '../../design/overlays/errmodal.js'
import { waitoverlay } from '../../design/overlays/wait-overlay.js'

import { setAccount, addVerification } from '../auth/index.js'

import { modal as login } from './login.js'
import { modal as registration } from './register.js'
import { modal as code } from './code.js'
import { modal as verif } from './verify.js'
import {
  sendAuthCode,
  authenticateWithCode,
  sendRegistrationCode,
  registerWithCode,
  sendVerificationCode,
  verifyEmailWithCode,
} from './backend.js'

export const authenticate = async (opts) => {
  login().controls.open()
  const email = await waitForOne(login(), 'done', 'cancel')

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
          code().removeEventListener('complete', listener)
          code().controls.close()
          errmodal().controls.open(
            `You've entered the wrong code too many times. For security reasons, your account is locked for a few minutes, and you can only authenticate using passkeys.`,
            error,
            'Retry Later',
          )

          if (opts?.silent) {
            await waitForOne(errmodal(), 'close')
            throw error
          }
        } else {
          code().controls.invalidate()
        }
      }
    }

    code().addEventListener('complete', listener)
    code().addEventListener(
      'close',
      () => {
        code().removeEventListener('complete', listener)
      },
      { once: true },
    )
  } catch (error) {
    waitoverlay().controls.close()
    if (error.status === 429) {
      errmodal().controls.open(
        `You are trying to log in too many times. For security reasons, your account is locked for a few minutes, and you can only authenticate using passkeys.`,
        error,
        'Retry Later',
      )
    } else {
      errmodal().controls.open(`Could not authenticate, because of the following error:`, error)
      errmodal().addEventListener('retry', authenticate, { once: true })
    }

    if (opts?.silent) {
      await waitForOne(errmodal(), 'close')
      throw error
    }
  }
}

export const register = async (user) => {
  registration().controls.open(user)
  await waitForOne(registration(), 'done', 'cancel')

  try {
    waitoverlay().controls.open('Sending One Time Code')
    await sendRegistrationCode(user)
    waitoverlay().controls.close()

    code().controls.open()
    const listener = async ({ detail }) => {
      try {
        const signed = await registerWithCode(user, detail)
        setAccount(signed.email, `${signed.firstname} ${signed.lastname}`, signed.verification, signed.token)
        code().removeEventListener('complete', listener)
        code().controls.close()
      } catch (error) {
        if (error.status === 429) {
          code().removeEventListener('complete', listener)
          code().controls.close()
          errmodal().controls.open(
            `You've entered the wrong code too many times. For security reasons, your account is locked for a few minutes, and you can only register using passkeys.`,
            error,
            'Retry Later',
          )
        } else {
          code().controls.invalidate()
        }
      }
    }

    code().addEventListener('complete', listener)
    code().addEventListener(
      'close',
      () => {
        code().removeEventListener('complete', listener)
      },
      { once: true },
    )
  } catch (error) {
    waitoverlay().controls.close()
    if (error.status === 429) {
      errmodal().controls.open(
        `You are trying too many times. For security reasons, your account is locked for a few minutes, and you can only register using passkeys.`,
        error,
        'Retry Later',
      )
    } else {
      errmodal().controls.open(`Could not register, because of the following error:`, error)
      errmodal().addEventListener('retry', register, { once: true })
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
            'Retry Later',
          )
        } else {
          code().controls.invalidate()
        }
      }
    }

    code().addEventListener('complete', listener)
    code().addEventListener(
      'close',
      () => {
        code().removeEventListener('complete', listener)
      },
      { once: true },
    )
  } catch (error) {
    waitoverlay().controls.close()
    if (error.status === 429) {
      errmodal().controls.open(
        `You are trying to verify too many times. For security reasons, the verification process is locked for
        a few minutes, please try again later.`,
        error,
        'Retry Later',
      )
    } else {
      errmodal().controls.open(`Could not verify, because of the following error:`, error)
      errmodal().addEventListener('retry', verify, { once: true })
      throw error
    }
  }
}
