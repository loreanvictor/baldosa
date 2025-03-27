import { waitForOne } from '../../util/wait-for-one.js'
import { errmodal } from '../../design/misc/errmodal.js'

import { setaccount } from '../auth/index.js'

import { modal } from './modal.js'
import { modal as code } from './code.js'
import { sendAuthCode, authenticateWithCode } from './backend.js'


export const authenticate = async () => {
  modal().controls.open()
  const email = await waitForOne(modal(), 'done', 'cancel')

  try {
    await sendAuthCode(email)
  
    code().controls.open()
    const listener = async ({ detail }) => {
      try {
        const user = await authenticateWithCode(email, detail)
        setaccount(user.email, `${user.firstname} ${user.lastname}`, user.token)
        code().removeEventListener('complete', listener)
        code().controls.close()
      } catch (error) {
        console.log(error)
        code().controls.invalidate()
      }
    }
  
    code().addEventListener('complete', listener)
    code().addEventListener('close', () => {
      code().removeEventListener('complete', listener)
    }, { once: true })
  
  } catch (error) {
    errmodal().controls.open(
      `Could not authenticate, because of the following error:`,
      error
    )
    errmodal().addEventListener('retry', authenticate, { once: true })
  }
}
