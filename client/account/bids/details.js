import { attachControls } from 'minicomp'
import { ref, html } from 'rehtm'

import { singleton } from '../../util/singleton.js'
import { dateish } from '../../util/format.js'
import { openlink } from '../../util/open-link.js'
import { onBroadcast } from '../../util/broadcast.js'

import '../../design/overlays/modal/component.js'
import '../../design/layout/key-val/components.js'
import '../../design/layout/quoted-content/component.js'
import '../../design/display/icon/component.js'
import '../../design/display/mark-down/component.js'
import '../../design/display/status-plaque/component.js'
import '../../design/display/eta.js'
import '../../design/buttons/button/components.js'

import { modal as rescind } from './rescind.js'


export const modal = singleton('account-bids-details-modal', () => {
  let bid

  const modal = ref()
  const status = ref()
  const coords = ref()
  const amount = ref()
  const submitted = ref()
  const title = ref()
  const subtitle = ref()
  const description = ref()
  const url = ref()
  const rescindbtn = ref()

  onBroadcast('bid:rescinded', b => {
    if (b.id === bid.id) {
      modal.current.controls.close()
    }
  })

  attachControls({
    open: _bid => {
      bid = _bid

      const pending = !bid.published_at && !bid.rejection
      const rejected = !!bid.rejection
      const published = !!bid.published_at

      status.current.removeAttribute('danger')
      status.current.removeAttribute('success')
      rescindbtn.current.style.display = 'none'

      if (pending) {
        if (bid.next_auction) {
          status.current.querySelector('span').innerHTML = `Auction <e-ta time="${bid.next_auction}"></e-ta>`
        } else {
          status.current.querySelector('span').textContent = 'Pending' // TODO
        }
        status.current.querySelector('i-con').setAttribute('src', 'bid')
        rescindbtn.current.style.display = ''
      } else if (rejected) {
        status.current.setAttribute('danger', 'true')
        status.current.querySelector('span').textContent =
          `Rejected ${dateish(bid.rejection.rejected_at)} for the following reason: "${bid.rejection.reason}"`
        status.current.querySelector('i-con').setAttribute('src', 'flag')
      } else if (published) {
        status.current.setAttribute('success', 'true')
        status.current.querySelector('span').textContent = `Published ${dateish(bid.published_at)}`
        status.current.querySelector('i-con').setAttribute('src', 'badge')
      }

      modal.current?.controls.open()
      amount.current?.setAttribute('value', bid.amount)
      coords.current?.setAttribute('value', `${bid.x}, ${bid.y}`)
      submitted.current?.setAttribute('value', dateish(bid.created_at))

      title.current.textContent = bid.content.title ?? ''
      subtitle.current.textContent = bid.content.subtitle ?? ''
      description.current.setAttribute('content', bid.content.description ?? '')

      url.current.style.display = bid.content.url ? '' : 'none'
    }
  })

  return html`
    <style>
      quoted-content {
        h2, p {
          margin: 0;
          padding: 0;
        }

        secondary-button {
          display: block;
          margin-top: 1ch;
        }
      }

      .rescind-btn {
        display: block;
        margin-top: 2ch;
      }
    </style>
    <glass-modal ref=${modal}>
      <span slot='title'>Bid Details</span>
      <status-plaque ref=${status}>
        <i-con slot='icon' src='bid' dark fill></i-con>
        <span></span>
      </status-plaque>

      <key-vals>
        <key-val ref=${amount}>
          Amount
          <i-con src='coin' dark fill slot='icon'></i-con>
        </key-val>
        <key-val ref=${coords}>
          Tile
        </key-val>
        <key-val ref=${submitted}>
          Submitted
        </key-val>
      </key-vals>
      <quoted-content>
        <h2 ref=${title}></h2>
        <sub ref=${subtitle}></sub>
        <mark-down ref=${description}></mark-down>
        <secondary-button onclick=${() => openlink(bid.content.url)} ref=${url}>
          Open
          <i-con src='square-arrow' dark thick slot='icon'></i-con>
        </secondary-button>
      </quoted-content>
      <secondary-button ref=${rescindbtn} danger class='rescind-btn'
        onclick=${() => rescind().controls.open(bid)}>Rescind Bid</secondary-button>
    </glass-modal>
  `
})