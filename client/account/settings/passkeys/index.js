import { errmodal } from '../../../design/overlays/errmodal.js'
import { broadcast } from '../../../util/broadcast.js'
import { waitForOne } from '../../../util/wait-for-one.js'

import { getPasskeys, removePasskey, startAddingPasskey, finishAddingPasskey } from './backend.js'
import { modal as removeModal } from './remove-modal.js'


// TODO: add error handling
export const all = getPasskeys

export const remove = async (key) => {
  removeModal().controls.open(key)
  await waitForOne(removeModal(), 'confirm', 'cancel')
  await removePasskey(key)
}

export const add = async () => {
  try {
    const opts = await startAddingPasskey()
    const credential = await navigator.credentials.create(opts)
    const key = await finishAddingPasskey(credential)

    broadcast('passkey:added', key)
  } catch (error) {
    if (!error.message.match(/timed out/)) {
      errmodal().controls.open(
        `Could not register new passkey, because of the following error:`,
        error
      )
      errmodal().addEventListener('retry', add, { once: true })
    }

    throw error
  }
}
