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
  term.aside(html`<tile-preview term=${term} x=${x} y=${y} content=${bid.content}></tile-preview>`)
  term.log(html`<k-v><span slot="key">id</span><t-cp term=${term}>${bid.id}</t-cp></k-v>`)
  term.log(html`<k-v><span slot="key">bidder</span><t-cp term=${term}>${bid.bidder}</t-cp></k-v>`)
  term.log(html`<k-v><span slot="key">amount</span>${bid.amount}</k-v>`)
  term.log(html`<k-v><span slot="key">tx</span><t-cp term=${term}>${bid.tx}</t-cp></k-v>`)
  term.log(html`<k-v><span slot="key">created</span>${new Date(bid.created_at).toLocaleString()}</k-v>`)
  term.log(html`<k-v><span slot="key">published</span>${new Date(bid.published_at).toLocaleString()}</k-v>`)
  term.log(
    html`<t-btn-bar>
      <t-btn onclick=${() => term.paste(`reject ${bid.id}`, true)}> REJECT </t-btn>
    </t-btn-bar>`,
  )
}

tile.desc = 'fetches the bid occupying the tile'
tile.man = (term) => {
  term.log('usage:')
  term.log('tile 3 4')
}

register('tile', tile)
