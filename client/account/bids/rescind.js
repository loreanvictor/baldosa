import { attachControls } from 'minicomp'
import { ref, html } from 'rehtm'

import { singleton } from '../../util/singleton.js'

import '../../design/overlays/modal/component.js'
import '../../design/buttons/confirm/component.js'
import '../../design/display/icon/component.js'
import '../../design/display/textual.js'

import { rescind } from './backend.js'


export const modal = singleton('rescind-bid-modal', () => {
  const modal = ref()
  const label = ref()
  const amount = ref()

  let bid

  attachControls({
    open: _bid => {
      bid = _bid
      modal.current.controls.open()

      label.current.textContent = `"${bid.content.title}" (at ${bid.x}, ${bid.y})`
      amount.current.textContent = bid.amount
    }
  })

  const _rescind = async () => {
    await rescind(bid)
    modal.current.controls.close()
  }

  return html`
    <style>
      i-con.danger {
        --color: var(--red-fg);
        width: 16ex;
        display: block;
        margin: auto;

        @media screen and (min-width: 600px) {
          margin-top: -7ch;
        }
      }

      i-con:not(.danger) {
        width: 2.5ex;
        vertical-align: -.25ch;
        margin-left: -.75ex;
        opacity: .5;
      }
    </style>
    <glass-modal ref=${modal}>
      <i-con class="danger" src="warning-sign" thick dark></i-con>
      <p>
        Are you certain you want to rescind the bid <span ref=${label}></span>? You can't undo this action
        and would need to resubmit the bid. 
      </p>
      
      <small-hint>
        When rescinded, the corresponding transaction will also be rescinded, refunding its amount of <span ref=${amount}></span> <i-con src="coin" dark fill></i-con> back to your wallet, with no further action required.
      </small-hint>
      <br/>
      <confirm-button danger label="Rescind Bid" onconfirm=${_rescind}></confirm-button>
    </glass-modal>
  `
})