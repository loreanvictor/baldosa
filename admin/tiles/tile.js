import yargs from 'yargs'
import { html } from 'rehtm'

import { register, currentTerm, TermError } from '../term/index.js'
import { authenticated } from '../auth/index.js'
import { baseUrl, imageUrl } from './base.js'

import '../term/textual.js'
import './preview.js'

const tile = async (...args) => {
  const term = currentTerm()
  const { _, p, preview, I, showId, B, showBidder } = yargs(args).parse()

  const [x, y] = _
  if (x === undefined || y === undefined) {
    throw new TermError('invalid coordinates.')
  }

  const _preview = p ?? preview
  const _showId = I ?? showId
  const _showBidder = B ?? showBidder

  const res = await fetch(
    `${baseUrl()}/${x}:${y}/occupant`,
    authenticated({
      method: 'GET',
    }),
  )

  if (!res.ok) {
    const msg = await res.text()
    throw new TermError(msg)
  }

  const bid = await res.json()
  if (_showId) {
    term.log(html`<t-cp actionable>${bid.id}</t-cp>`)
    return bid.id
  } else if (_showBidder) {
    term.log(html`<t-cp actionable>${bid.bidder}</t-cp>`)
    return bid.bidder
  } else {
    const prev = html`<tile-preview
      x=${x}
      y=${y}
      title=${bid.content?.title}
      subtitle=${bid.content?.subtitle}
      description=${bid.content?.description}
      url=${bid.content?.url}
      img=${imageUrl(x, y, term)}
    ></tile-preview>`

    if (_preview) {
      term.log(prev)
    } else {
      term.aside(prev)
      term.log(html`<k-v><span slot="key">id</span><t-cp actionable>${bid.id}</t-cp></k-v>`)
      term.log(html`<k-v><span slot="key">bidder</span><t-cp actionable>${bid.bidder}</t-cp></k-v>`)
      term.log(html`<k-v><span slot="key">amount</span>${bid.amount}</k-v>`)
      term.log(html`<k-v><span slot="key">tx</span><t-cp actionable>${bid.tx}</t-cp></k-v>`)
      term.log(html`<k-v><span slot="key">created</span>${new Date(bid.created_at).toLocaleString()}</k-v>`)
      term.log(html`<k-v><span slot="key">published</span>${new Date(bid.published_at).toLocaleString()}</k-v>`)
      term.log(
        html`<t-btn-bar>
          <t-btn onclick=${() => term.paste(`reject ${bid.id}`, true)}> REJECT </t-btn>
        </t-btn-bar>`,
      )
    }

    return bid
  }
}

tile.desc = 'fetches the bid occupying the tile'
tile.man = (term) => {
  term.log('usage:')
  term.log('tile 3 4')
  term.log('tile -1 10 -I')
  term.hr()
  term.log('options:')
  term.log(html`<pre>-p, --preview       show only tile's preview.</pre>`)
  term.log(html`<pre>-I, --show-id       show only the bid's id.</pre>`)
  term.log(html`<pre>-B, --show-bidder   show only the bidder's id.</pre>`)
}

register('tile', tile)
