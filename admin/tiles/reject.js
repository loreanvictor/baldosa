import { html } from 'rehtm'

import '../term/textual.js'
import { register, currentTerm, TermError } from '../term/index.js'
import { authenticated } from '../auth/index.js'
import { baseUrl } from './base.js'

const reject = async (bid) => {
  const term = currentTerm()

  if (!bid) {
    throw new TermError('please provide a bid', 'use `man reject` to learn more.')
  }

  term.log(html`<span>rejecting bid <t-cp actionable>${bid}</t-cp></span>`)
  const reason = await term.read('provide a reason')
  const res = await fetch(
    `${baseUrl(term)}/${bid}/reject`,
    authenticated(
      {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      },
      term,
    ),
  )

  if (!res.ok) {
    const msg = await res.text()
    throw new TermError(msg)
  } else {
    term.log(html`<t-succ>bid successfully rejected.</t-succ>`)
  }
}

reject.desc = 'rejects a bid (published or not)'
reject.man = (term) => {
  term.log('usage:')
  term.log('reject <bid_id>')
}
register('reject', reject)
