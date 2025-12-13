import yargs from 'yargs'
import { html } from 'rehtm'

import { register, currentTerm, TermError } from '../term/index.js'
import { authenticated } from '../auth/index.js'
import '../term/textual.js'

import { baseUrl } from './base.js'

export const user = async (...args) => {
  const term = currentTerm()
  const { _, e, email, i, id, silent } = yargs(args).parse()
  const _id = i ?? id ?? _[0]
  const _email = e ?? email

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

  if (!silent) {
    term.log(html`<k-v><span slot="key">id</span><t-cp actionable term=${term}>${user.id}</t-cp></k-v>`)
    term.log(html`<k-v><span slot="key">email</span><t-cp actionable term=${term}>${user.email}</t-cp></k-v>`)
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

user.desc = 'fetch information on a user'
user.man = (term) => {
  term.log('usage:')
  term.log('user <id>')
  term.log('user -e <email>')
}
register('user', user)
