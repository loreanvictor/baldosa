import { attachControls, onConnected } from 'minicomp'
import { ref, html } from 'rehtm'

import { singleton } from '../../util/singleton.js'
import { onBroadcast } from '../../util/broadcast.js'

import { modal as uc } from '../../util/under-construction.js'
import '../../util/keyed-list.js'
import '../../design/glass/modal/component.js'
import '../../design/glass/toast/component.js'
import '../../design/button/components.js'
import '../../design/misc/icon/component.js'
import '../../design/misc/swipe-card/component.js'
import '../../design/misc/textual.js'

import './offers.js'
import { modal as history } from './history.js'
import * as service from './index.js'


export const modal = singleton('wallet-modal', () => {
  const modal = ref()
  const balance = ref()

  onConnected(async () => {
    balance.current.textContent = (await service.balance()).meta.total
  })

  onBroadcast('wallet:balance_changed', (state) => {
    balance.current.textContent = state.meta.total
  })

  attachControls({
    open: () => modal.current.controls.open(),
  })

  return html`
    <style>
      h1 {
        display: flex;
        align-items: center;
        justify-content: center;

        span {
          font-family: monospace;
          font-weight: 100;
          font-size: 4rem;
        }

        i-con {
          width: 64px;
          opacity: .25;
          margin-right: -36px;
        }
      }
    </style>
    <glass-modal ref=${modal} aside>
      <span slot='title'>Wallet</span>
      <h1>
        <span ref=${balance}>0</span>
        <i-con src='coin' dark fill></i-con>
      </h1>
      <small-hint>
        Coin is used for bidding on tiles. If you want to post content to a tile,
        you need to bid some coins and upload your suggested content, and the highest
        bid wins the tile.
      </small-hint>
      <h-r></h-r>
      <h2>Offers</h2>
      <offer-list></offer-list>
      <small-hint>
        Any coins offered to you for various reasons will be listed here. Accept
        these offers to use the coins.
      </small-hint>
      <h-r></h-r>
      <action-list island>
        <secondary-button row onclick=${() => history().controls.open()}>
          <i-con src='receipt' dark thick slot='icon'></i-con>
          Transaction History
        </secondary-button>
        <secondary-button row onclick=${() => uc().controls.open()}>
          <i-con src='coin' dark thick slot='icon'></i-con>
          Get More Coins
        </secondary-button>
      </action-list>
    </glass-modal>
  `
})
