import yargs from 'yargs'
import { html, ref } from 'rehtm'

import { register, currentTerm, TermError } from '../term/index.js'
import { authenticated } from '../auth/index.js'
import { trim } from '../util/trim.js'
import { baseUrl, imageUrl } from './base.js'

import '../term/components/textual.js'
import './preview.js'

const tiles = async (...args) => {
  const term = currentTerm()

  const { p, page, n, count, format, f, u, user } = yargs(args).parse()
  const _n = count ?? n ?? 32
  const _p = page ?? p ?? 0
  const _user = user ?? u
  const _format = f ?? format ?? 'id:16,pos,title,publish'

  const url = new URL(`${baseUrl()}/all/live`)
  url.searchParams.set('limit', _n)
  url.searchParams.set('offset', _p * _n)
  _user && url.searchParams.set('user_id', _user)
  const res = await fetch(url, authenticated({ method: 'GET' }))

  if (!res.ok) {
    const msg = await res.text()
    throw new TermError(msg)
  }

  const bids = await res.json()

  const parts = _format.split(',')
  const layout = parts.map((p) => (p === 'pos' ? '5rem' : '1fr')).join(' ')
  const makepart = (bid, part) => {
    const [key, m] = part.split(':')
    const max = m ? parseInt(m) : Infinity
    if (key === 'id') {
      return html`<t-cp actionable content=${bid.id}>${trim(bid.id, max, 'middle')}</t-cp>`
    } else if (key === 'bidder') {
      return html`<t-cp actionable content=${bid.bidder}>${trim(bid.bidder, max, 'middle')}</t-cp>`
    } else if (key === 'pos') {
      return html`<a href=${`/?tile=${bid.x},${bid.y}`} target="_blank">${bid.x}, ${bid.y}</a>`
    } else if (key === 'title') {
      return html`<div>${trim(bid.content.title, max, 'end')}</div>`
    } else if (key === 'sub') {
      return html`<div>${trim(bid.content.subtitle, max, 'end')}</div>`
    } else if (key === 'publish') {
      return html`<div>${new Date(bid.published_at).toLocaleString()}</div>`
    }
  }
  const produce = (bid) => {
    const cols = ref()
    const holder = html`<t-cols
      ref=${cols}
      focusaction
      layout=${layout}
      onclick=${() => {
        term.aside(html`
          <tile-preview
            x=${bid.x}
            y=${bid.y}
            title=${bid.content?.title}
            subtitle=${bid.content?.subtitle}
            description=${bid.content?.description}
            url=${bid.content?.url}
            img=${imageUrl(bid.x, bid.y, term)}
          ></tile-preview>
          <hr />
          <k-v><span slot="key">id</span><t-cp>${bid.id}</t-cp></k-v>
          <k-v><span slot="key">bidder</span><t-cp>${bid.bidder}</t-cp></k-v>
          <k-v><span slot="key">amount</span>${bid.amount}</k-v>
          <k-v><span slot="key">published</span>${new Date(bid.published_at).toLocaleString()}</k-v>
          <t-btn-bar>
            <t-btn onclick=${() => term.paste(`reject ${bid.id}`, true)}>REJECT</t-btn>
          </t-btn-bar>
        `)
      }}
    >
    </t-cols>`

    parts.forEach((part) => cols.current.append(makepart(bid, part)))

    return holder
  }

  if (bids.length > 0) {
    bids.forEach((bid) => term.log(produce(bid)))
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
  term.hr()
  term.log('options:')
  term.log(html`<pre>-n, --count         number of items to show.</pre>`)
  term.log(html`<pre>-p, --page          the page of items to show.</pre>`)
  term.log(html`<pre>-u, --user          filter for tiles of given user (id).</pre>`)
  term.log(html`<pre>-f, --format        how to format each item (see below).</pre>`)
  term.hr()
  term.log('format:')
  term.log(`
    format can be a string indicating which fields to display and the max length of the column.
    for example '-f id:16,pos,title,publish' is the default format.
    `)
  term.log('supported fields:')
  term.log(html`<pre>id                  occupying bid id</pre>`)
  term.log(html`<pre>bidder              bidder's id</pre>`)
  term.log(html`<pre>pos                 tile's position</pre>`)
  term.log(html`<pre>title               tile's current title</pre>`)
  term.log(html`<pre>subtitle            tile's current subtitle</pre>`)
  term.log(html`<pre>publish             publish date of the current content on the tile.</pre>`)
}
register('tiles', tiles)
