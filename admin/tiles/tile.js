import { html } from 'rehtm'

import { register, currentTerm, TermError } from '../term/index.js'
import { authenticated } from '../auth/index.js'
import './preview.js'
import { baseUrl } from './base.js'

const tile = async (x, y) => {
  const term = currentTerm()

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
  console.log(bid)
  term.aside(html`<tile-preview term=${term} x=${x} y=${y} content=${bid.content}></tile-preview>`)
  term.log(html`<k-v><span slot="key">id</span><t-cp term=${term}>${bid.id}</t-cp></k-v>`)
  term.log(html`<k-v><span slot="key">bidder</span><t-cp term=${term}>${bid.bidder}</t-cp></k-v>`)
  term.log(html`<k-v><span slot="key">amount</span>${bid.amount}</k-v>`)
  term.log(html`<k-v><span slot="key">tx</span><t-cp term=${term}>${bid.tx}</t-cp></k-v>`)
  term.log(html`<k-v><span slot="key">created</span>${bid.created_at}</k-v>`)
  term.log(html`<k-v><span slot="key">published</span>${bid.published_at}</k-v>`)
}

tile.desc = 'fetches the bid occupying the tile'
tile.man = (term) => {
  term.log('usage:')
  term.log('tile 3 4')
}

register('tile', tile)
