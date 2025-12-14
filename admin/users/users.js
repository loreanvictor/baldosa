import yargs from 'yargs'
import { html } from 'rehtm'

import { register, currentTerm, TermError } from '../term/index.js'
import { authenticated } from '../auth/index.js'
import { trim } from '../util/trim.js'
import '../term/textual.js'

import { baseUrl } from './base.js'

export const users = async (...args) => {
  const term = currentTerm()

  const { p, page, n, count } = yargs(args).parse()
  const _n = count ?? n ?? 32
  const _p = page ?? p ?? 0

  const res = await fetch(
    `${baseUrl()}?limit=${_n}&offset=${_n * _p}`,
    authenticated({
      method: 'GET',
    }),
  )

  if (!res.ok) {
    const msg = await res.text()
    throw new TermError(msg)
  }

  const users = await res.json()
  if (users.length > 0) {
    term.hr()
    users.forEach((user) => {
      term.log(
        html`<t-cols layout="1fr 1fr 2fr" onclick=${() => term.paste(`user ${user.id}`, true)}>
          <t-cp actionable content=${user.id}>${trim(user.id, 16, 'middle')}</t-cp>
          <span>${trim(user.first_name + ' ' + user.last_name, 56, 'end')}</span>
          <t-cp>${trim(user.email, 64, 'middle')}</t-cp>
        </t-cols>`,
      )
      term.hr()
    })
  } else {
    term.log(html`<t-warn>no more users found.</t-warn>`)
  }
}

users.desc = 'fetch all users'
users.man = (term) => {
  term.log('usage:')
  term.log(html`<pre>users            -> fetches all users (with a preset limit)</pre>`)
  term.log(html`<pre>users -n 50      -> fetches 50 users</pre>`)
  term.log(html`<pre>users -n 50 -p 2 -> fetches the second 50 users</pre>`)
}
register('users', users)
