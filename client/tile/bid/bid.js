import { attachControls, useDispatch } from 'minicomp'
import { html, ref } from 'rehtm'

import { singleton } from '../../util/singleton.js'
import { eta } from '../../util/format.js'

import '../../design/overlays/modal/component.js'
import '../../design/layout/key-val/components.js'
import '../../design/buttons/confirm/component.js'
import '../../design/display/icon/component.js'

import { loadBid, updateBid } from './draft.js'

// FIXME: there is a bug where after submitting one bid, the form
//        clears but adding new content to it doesn't make it valid
//        so no submission can be made. the bug is possibly not
//        with the modal but the form elements and their validations
//        not resetting (someone's validation is not resetting properly?)

export const modal = singleton('bid-modal', () => {
  const submit = useDispatch('submit')

  const modal = ref()
  const bid = ref()
  const remaining = ref()
  const coords = ref()
  const lastbid = ref()
  const auctiontime = ref()

  let tile
  let content
  let info
  let amount = 1
  let balance = 32
  let min = 1

  let isOpen = false

  const updateAmount = () => {
    bid.current?.setAttribute('value', amount)
    remaining.current?.setAttribute('value', balance - amount)
    updateBid(tile, amount)
  }

  const updateAuctionTime = (info) => {
    if (info.next_auction) {
      auctiontime.current?.setAttribute('value', eta(info.next_auction))
      isOpen &&
        setTimeout(() => {
          updateAuctionTime(info)
        }, 60_000) // Update every minute
    } else {
      auctiontime.current?.setAttribute('value', 'soon')
    }
  }

  attachControls({
    open: async (_tile, _balance, _info, _content) => {
      isOpen = true
      tile = _tile
      content = _content
      info = _info

      balance = _balance.meta.total
      min = info.minimum_bid || 1
      amount = Math.max(min, await loadBid(tile))

      modal.current?.controls.open()
      coords.current?.setAttribute('value', `${_tile.x}, ${_tile.y}`)
      lastbid.current?.setAttribute('value', info.last_bid?.amount || '-')

      updateAuctionTime(info)
      updateAmount()
    },
    close: () => {
      isOpen = false
      modal.current.controls.close()
    },
  })

  const incr = (fast) => {
    amount = Math.min(balance, amount + (fast ? 4 : 1))
    updateAmount()
  }

  const decr = (fast) => {
    amount = Math.max(min, amount - (fast ? 4 : 1))
    updateAmount()
  }

  return html`
    <style>
      [role='group'] {
        display: flex;
        user-select: none;
        -webkit-user-select: none;
        gap: 0.5ex;
        --btn-top-left-rad: 0;
        --btn-top-right-rad: 0;
        --btn-bot-left-rad: 0;
        --btn-bot-right-rad: 0;
        width: 50%;
        margin: 0 auto;

        > * {
          flex: 1;
        }

        > :first-child {
          --btn-top-left-rad: 32px;
          --btn-bot-left-rad: 32px;
        }

        > :last-child {
          --btn-top-right-rad: 32px;
          --btn-bot-right-rad: 32px;
        }
      }
    </style>
    <glass-modal ref=${modal} noheader>
      <key-vals>
        <key-val ref=${bid} primary>
          Bid
          <i-con src="coin" dark fill slot="icon"></i-con>
        </key-val>
        <key-val ref=${coords}> On Tile </key-val>
        <key-val value=${'in 17 hours'} ref=${auctiontime}> Auction Time </key-val>
        <key-val ref=${remaining}>
          Remaining Balance
          <i-con src="coin" dark fill slot="icon"></i-con>
        </key-val>
        <key-val value=${30} ref=${lastbid}>
          Last Winning Bid
          <i-con src="coin" dark fill slot="icon"></i-con>
        </key-val>
      </key-vals>
      <br /><br />
      <div role="group">
        <secondary-button key="ArrowDown" onpress=${(e) => decr(e.detail?.deep)}>
          <i-con src="arrow-down" thick dark></i-con>
        </secondary-button>
        <secondary-button key="ArrowUp" onpress=${(e) => incr(e.detail?.deep)}>
          <i-con src="arrow-up" thick dark></i-con>
        </secondary-button>
      </div>
      <br />
      <confirm-button label="Place Bid" onconfirm=${() => submit({ tile, amount, content, info })}></confirm-button>
    </glass-modal>
  `
})
