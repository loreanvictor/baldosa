import yargs from 'yargs'
import { html } from 'rehtm'

import { register, currentTerm, TermError, withTerm } from '../term/index.js'
import { authenticated } from '../auth/index.js'
import '../term/textual.js'
import '../users/index.js'

import { baseUrl } from './base.js'

const balance = async (...args) => {
  const term = currentTerm()
  const { _, user, u, e, email } = yargs(args).parse()
  let _id = user ?? u ?? _[0]
  const _email = e ?? email

  if (!_id) {
    if (!_email) {
      throw new TermError('must provide either user id or email.')
    }

    _id = await term.run(`user -Ie ${_email} -s`, { silent: true })
  }

  const res = await fetch(
    `${baseUrl(term)}/balance/${_id}`,
    authenticated(
      {
        method: 'GET',
      },
      term,
    ),
  )

  if (!res.ok) {
    const msg = await res.text()
    throw new TermError(msg)
  }

  const tx = await res.json()
  term.log(html`<k-v><span slot="key">id</span><t-cp actionable>${tx.id}</t-cp></k-v>`)
  term.log(html`<k-v><span slot="key">owner</span><t-cp actionable>${tx.receiver}</t-cp></k-v>`)
  term.log(html`<k-v><span slot="key">amount</span>${tx.consumed_value + tx.merged_value}</k-v>`)
  term.log(html`<k-v><span slot="key">last update</span>${new Date(tx.created_at).toLocaleString()}</k-v>`)
}

balance.desc = 'fetch user balance.'
balance.man = (term) => {
  term.log('usage:')
  term.log('balance <user-id>')
  term.log('balance -e <email>')
}
register('balance', balance)
