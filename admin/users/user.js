import yargs from 'yargs'
import { html } from 'rehtm'

import { register, currentTerm, TermError } from '../term/index.js'
import { authenticated } from '../auth/index.js'
import '../term/components/textual.js'

import { baseUrl } from './base.js'

export const user = async (...args) => {
  const term = currentTerm()
  const { _, e, email, i, id, s, silent, I, showId, E, showEmail } = yargs(args).parse()
  const _id = i ?? id ?? _[0]
  const _email = e ?? email
  const _silent = s ?? silent
  const _showId = I ?? showId
  const _showEmail = E ?? showEmail

  if (!_id && !_email) {
    throw new TermError('must provide either id or email.', 'use `man user` to learn more.')
  }

  const res = await fetch(
    _email ? `${baseUrl()}?email=${encodeURIComponent(_email)}` : `${baseUrl()}/${_id}`,
    authenticated({
      method: 'GET',
    }),
  )

  if (!res.ok) {
    const msg = await res.text()
    throw new TermError(msg)
  }

  const user = await res.json()

  if (_showId) {
    !_silent && term.log(html`<t-cp actionable>${user.id}</t-cp>`)
    return user.id
  } else if (_showEmail) {
    !_silent && term.log(html`<t-cp actionable>${user.email}</t-cp>`)
    return user.email
  } else {
    if (!_silent) {
      term.log(html`<k-v><span slot="key">id</span><t-cp actionable>${user.id}</t-cp></k-v>`)
      term.log(html`<k-v><span slot="key">email</span><t-cp actionable>${user.email}</t-cp></k-v>`)
      term.log(html`<k-v><span slot="key">first name</span>${user.first_name}</k-v>`)
      term.log(html`<k-v><span slot="key">last_name</span>${user.last_name}</k-v>`)
      term.log(
        html`<k-v>
          <span slot="key">verified email</span>
          ${user.email_verified_at ? new Date(user.email_verified_at).toLocaleString() : '-'}
        </k-v>`,
      )
    }

    return user
  }
}

user.desc = 'fetch information on a user'
user.man = (term) => {
  term.log('usage:')
  term.log('user <id>')
  term.log('user -e <email>')
  term.hr()
  term.log('options:')
  term.log(html`<pre>-i, --id            fetch user by id.</pre>`)
  term.log(html`<pre>-e, --email         fetch user by email address.</pre>`)
  term.log(html`<pre>-I, --show-id       only display user's id.</pre>`)
  term.log(html`<pre>-E, --show-email    only display user's email address.</pre>`)
}
register('user', user)
