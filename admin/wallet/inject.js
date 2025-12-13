import yargs from 'yargs'
import { html } from 'rehtm'

import { register, currentTerm, TermError, withTerm } from '../term/index.js'
import { authenticated } from '../auth/index.js'
import '../term/textual.js'
import { user as getUser } from '../users/index.js'

import { baseUrl } from './base.js'

const inject = async (...args) => {
  const term = currentTerm()

  const { _, a, amount, user, u, e, email } = yargs(args).parse()
  const _amount = amount ?? a ?? _[0]
  let _id = user ?? u
  const _email = email ?? e

  if (!_amount) {
    throw new TermError('please specify the amount.')
  }

  if (!_id) {
    if (!_email) {
      throw new TermError('must provide either user id or email.')
    }

    const _user = await withTerm(term, () => getUser('-e', _email, '--silent'))
    _id = _user.id
  }

  const note = await term.read('write a note')
  const res = await fetch(
    `${baseUrl(term)}/inject`,
    authenticated(
      {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          receiver: {
            type: 'User',
            id: _id,
          },
          amount: _amount,
          note,
        }),
      },
      term,
    ),
  )

  if (!res.ok) {
    const msg = await res.text()
    throw new TermError(msg)
  } else {
    term.log(html`<t-succ>coins successfully injected.</t-succ>`)
  }
}

inject.desc = 'offer coins to user.'
inject.man = (term) => {
  term.log(
    'use inject to provide some extra coins for a specific user. it produces an offer that the user MUST ACCEPT before it shows in their wallet.',
  )
  term.log('usage:')
  term.log('inject 32 -u <user-id>')
  term.log('inject 32 -e <email>')
}
register('inject', inject)
