import { attachControls, onConnected } from 'minicomp'
import { ref, html } from 'rehtm'

import { singleton } from '../../util/singleton.js'
import { onBroadcast } from '../../util/broadcast.js'
import '../../util/keyed-list.js'

import '../../design/overlays/modal/component.js'
import '../../design/buttons/switcher/component.js'
import '../../design/layout/tabbed-content/component.js'
import '../../design/display/textual.js'

import './card.js'
import { pendingAndHistory } from './backend.js'

export const modal = singleton('account-bids-modal', () => {
  const modal = ref()
  const tabs = ref()
  const pendingTab = ref()
  const historyTab = ref()
  const rejectedTab = ref()
  const pendingList = ref()
  const historyList = ref()
  const rejectedList = ref()

  const fetch = async () => {
    // TODO: rejected would need its own endpoint to avoid
    //       pagination issues. fix this when pagination is added here.
    const [_pending, _history] = await pendingAndHistory()

    pendingList.current.controls.init(_pending)
    historyList.current.controls.init(_history)
    rejectedList.current.controls.init(_history.filter((bid) => !!bid.rejection))
  }

  onBroadcast('bid:submitted', (bid) => {
    historyList.current.controls.prepend(bid)
    !bid.published_at && pendingList.current.controls.prepend(bid)
    bid.rejection && rejectedList.current.controls.prepend(bid)
  })

  onBroadcast('bid:rescinded', (bid) => {
    historyList.current.controls.remove(bid.id)
    pendingList.current.controls.remove(bid.id)
    rejectedList.current.controls.remove(bid.id)
  })

  attachControls({
    open: async () => {
      modal.current.controls.open()
      await fetch()
    },
  })

  return html`
    <style>
      .switcher-holder {
        position: absolute;
        top: 1.5ch;
        right: 8ex;
        z-index: 1;
      }

      tabbed-content {
        section {
          max-height: 85vh;
          overflow: auto;
        }
      }

      @media (max-width: 600px) {
        .switcher-holder {
          top: auto;
          bottom: 2ex;
          left: 0;
          right: 0;
          text-align: center;
        }

        tabbed-content {
          display: block;
          margin-bottom: calc(4ex + 32px);

          section {
            max-height: 50vh;
          }
        }
      }
    </style>
    <glass-modal ref=${modal} aside>
      <span slot="title">Bids</span>
      <div class="switcher-holder">
        <switcher-button>
          <button selected onclick=${() => tabs.current.controls.select(pendingTab.current)}>Pending</button>
          <hr />
          <button onclick=${() => tabs.current.controls.select(historyTab.current)}>History</button>
          <hr />
          <button onclick=${() => tabs.current.controls.select(rejectedTab.current)}>Rejected</button>
        </switcher-button>
      </div>
      <tabbed-content ref=${tabs}>
        <section ref=${pendingTab} selected>
          <keyed-list
            ref=${pendingList}
            each=${(bid) => html`<account-bid-card key=${bid.id} bid=${bid}></account-bid-card>`}
          >
          </keyed-list>
          <small-hint>
            Your pending bids appear here. Pending bids are awaiting the next auction of their corresponding tile, and
            will be published if they win. If not, they will remain pending for the following auctions on the same tile.
          </small-hint>
        </section>
        <section ref=${historyTab}>
          <keyed-list
            ref=${historyList}
            each=${(bid) => html`<account-bid-card key=${bid.id} bid=${bid}></account-bid-card>`}
          >
          </keyed-list>
          <small-hint>
            All your bids appear here, including the ones who are live, past published bids, pending bids, and rejected
            bids. To see the tiles you currently have bids published to, check out the "Tiles" section.
          </small-hint>
        </section>
        <section ref=${rejectedTab}>
          <keyed-list
            ref=${rejectedList}
            each=${(bid) => html`<account-bid-card key=${bid.id} bid=${bid}></account-bid-card>`}
          >
          </keyed-list>
          <small-hint>
            All your bids that are rejected appear here. Rejected bids violate our terms of service and rules for
            content in Baldosa, hence why they are rejected. A bid might get rejected after it is published, in which
            case the coins used for publishing it won't be refunded.
          </small-hint>
        </section>
      </tabbed-content>
    </glass-modal>
  `
})
