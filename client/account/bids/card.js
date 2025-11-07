import { define } from 'minicomp'
import { ref, html } from 'rehtm'

import { trim, dateish } from '../../util/format.js'
import { broadcast } from '../../util/broadcast.js'

import '../../design/buttons/button/components.js'
import '../../design/overlays/modal/component.js'
import '../../design/layout/swipe-card/component.js'
import '../../design/display/icon/component.js'
import '../../design/display/eta.js'

import { modal as details } from './details.js'


define('account-bid-card', ({ bid }) => {
  const opts = ref()

  const pending = !bid.published_at && !bid.rejection
  const rejected = !!bid.rejection
  const published = !!bid.published_at
  const coords = `${bid.x}, ${bid.y}`

  const goto = () => {
    opts.current.controls.close()
    broadcast('tile:goto', bid)
  }

  const view = () => {
    opts.current.controls.close()
    details().controls.open(bid)
  }

  return html`
    <link rel="stylesheet" href="./client/account/bids/styles.css" />
    <swipe-card class=${pending ? 'pending' : rejected ? 'rejected' : 'published'}
      onaction=${() => view()}
      onswipeleft=${() => view()}
      onswiperight=${() => goto()}>
      <div slot='image'>
        <i-con src=${(pending && 'bid') || (rejected && 'flag') || (published && 'badge')} dark fill></i-con>
      </div>
      <h1>${trim(bid.content.title, 32)}</h1>
      <p>
        ${
        (pending && 
          (
            bid.next_auction ?
            html`<span><e-ta short time=${bid.next_auction}></e-ta> to auction</span>` :
            html`<span><span role=status>Pending</span></span>`
          )
        ) ||
        (rejected && html`<span>
          <span role=status>Rejected</span> ${dateish(bid.rejection.rejected_at)}
        </span>`) ||
        (published && html`<span>
          <span role=status>Published</span> ${dateish(bid.published_at)}
        </span>`)
      }, ${bid.amount}<i-con src='coin' dark fill></i-con> on ${coords}
      </p>
      <div slot='actions'>
        <secondary-button
          onclick=${(e) => opts.current.controls.open({ anchor: e.target.closest('secondary-button') })}
        ><i-con src='ellipsis' dark thick slot='icon'></i-con>
        </secondary-button>
      </div>
      <div slot='left'>Bid Details <i-con src='receipt' dark thick></i-con></div>
      <div slot='right'>Go to Tile <i-con src='arrow-right' dark thick></i-con></div>
    </swipe-card>

    <glass-modal noheader ref=${opts}>
      <action-list>
        <secondary-button row onclick=${() => goto()}>
          Go to Tile
          <i-con src='arrow-right' dark thick slot='icon'></i-con>
        </secondary-button>
        <secondary-button row onclick=${() => view()}>
          Bid Details
          <i-con src='receipt' dark thick slot='icon'></i-con>
        </secondary-button>
        <secondary-button row faded onclick=${() => opts.current.controls.close()}>
          Cancel
        </secondary-button>
      </action-list>
    </glass-modal>
  `
})
