import yargs from 'yargs'
import { html } from 'rehtm'

import { register, currentTerm } from '../term/index.js'
import { authenticated } from '../auth/index.js'
import { trim } from '../util/trim.js'
import { baseUrl } from './base.js'

import '../term/textual.js'
import './preview.js'

const tiles = async (...args) => {
  const term = currentTerm()

  const { p, page, n, count } = yargs(args).parse()
  const _n = count ?? n ?? 32
  const _p = page ?? p ?? 0

  const res = await fetch(
    `${baseUrl()}/all/live?limit=${_n}&offset=${_n * _p}`,
    authenticated({
      method: 'GET',
    }),
  )

  if (!res.ok) {
    const msg = await res.text()
    throw new TermError(msg)
  }

  const bids = await res.json()

  if (bids.length > 0) {
    term.hr()
    bids.forEach((bid) => {
      term.log(
        html`<t-cols
          focusaction
          layout="1fr 5rem 1fr 1fr"
          onclick=${() => {
            term.aside(html`
              <tile-preview term=${term} x=${bid.x} y=${bid.y} content=${bid.content}></tile-preview>
              <hr />
              <k-v><span slot="key">id</span><t-cp term=${term}>${bid.id}</t-cp></k-v>
              <k-v><span slot="key">bidder</span><t-cp term=${term}>${bid.bidder}</t-cp></k-v>
              <k-v><span slot="key">amount</span>${bid.amount}</k-v>
              <k-v><span slot="key">published</span>${new Date(bid.published_at).toLocaleString()}</k-v>
              <t-btn-bar>
                <t-btn onclick=${() => term.paste(`reject ${bid.id}`, true)}>REJECT</t-btn>
              </t-btn-bar>
            `)
          }}
        >
          <t-cp actionable term=${term} content=${bid.id}>${trim(bid.id, 16, 'middle')}</t-cp>
          <a href=${`/?tile=${bid.x},${bid.y}`} target="_blank">${bid.x}, ${bid.y}</a>
          <div>${bid.content.title}</div>
          <div>${new Date(bid.published_at).toLocaleString()}</div>
        </t-cols>`,
      )
      term.hr()
    })
  } else {
    term.log(html`<t-warn>no more bids found.</t-warn>`)
  }
}

tiles.desc = 'fetch live tiles'
tiles.man = (term) => {
  term.log('usage:')
  term.log(html`<pre>tiles            -> fetches all live tiles (with a preset limit)</pre>`)
  term.log(html`<pre>tiles -n 50      -> fetches 50 live tiles</pre>`)
  term.log(html`<pre>tiles -n 50 -p 2 -> fetches the second 50 live tiles</pre>`)
}
register('tiles', tiles)
