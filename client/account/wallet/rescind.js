import { attachControls, useDispatch } from 'minicomp'
import { ref, html } from 'rehtm'

import { singleton } from '../../util/singleton.js'

import '../../design/overlays/modal/component.js'
import '../../design/layout/key-val/components.js'
import '../../design/display/icon/component.js'
import '../../design/buttons/confirm/component.js'

import { rescind } from './index.js'


export const modal = singleton('wallet-rescind-modal', () => {
  const close = useDispatch('close')

  const modal = ref()
  const receiver = ref()
  const note = ref()
  const amount = ref()
  const date = ref()

  let tx

  attachControls({
    open: _tx => {
      tx = _tx
      modal.current.controls.open()
      amount.current?.setAttribute('value', tx.consumed_value)
      receiver.current?.setAttribute('value', tx.receiver_sys || tx.receiver)
      date.current?.setAttribute('value', new Date(tx.created_at).toLocaleDateString())
      note.current?.setAttribute('value', tx.note || '-')
    }
  })

  const doRescind = async () => {
    try {
      await rescind(tx)
      modal.current.controls.close()
    } catch (error) {
      console.error('Failed to rescind transaction:', error)
      // TODO: show error to user
    }
  }

  return html`
    <glass-modal ref=${modal} onclose=${close}>
      <span slot='title'>Rescind Offer</span>
      <p>
        Are you sure you want to rescind this transaction? If any bids
        are pending on it, they will become invalid and won't take effect.
      </p>
      <key-vals>
        <key-val ref=${amount}>
          Amount
          <i-con src='coin' dark fill slot='icon'></i-con>
        </key-val>
        <key-val ref=${receiver}>Receiver</key-val>
        <key-val ref=${date}>Date</key-val>
        <key-val ref=${note}>Note</key-val>
      </key-vals>
      <br/>
      <confirm-button label="Rescind Transaction" onconfirm=${doRescind}>
      </confirm-button>
    </glass-modal>
  `
})
