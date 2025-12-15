import yargs from 'yargs'
import { html, ref } from 'rehtm'

import { register, currentTerm, TermError } from '../term/index.js'
import { authenticated } from '../auth/index.js'
import { trim } from '../util/trim.js'
import '../term/textual.js'

import { baseUrl } from './base.js'

export const users = async (...args) => {
  const term = currentTerm()

  const { p, page, n, count, f, format } = yargs(args).parse()
  const _n = count ?? n ?? 32
  const _p = page ?? p ?? 0
  const _format = f ?? format ?? 'id:16,name:56,email:64'

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
  const parts = _format.split(',')
  const layout = parts
    .map((p) => p.split(':'))
    .map(([p]) => (p === 'email' ? '2fr' : '1fr'))
    .join(' ')
  const makepart = (user, part) => {
    const [key, m] = part.split(':')
    const max = m ? parseInt(m) : Infinity
    if (key === 'id') {
      return html`<t-cp actionable content=${user.id}>${trim(user.id, max, 'middle')}</t-cp>`
    } else if (key === 'name') {
      const name = user.first_name + ' ' + user.last_name
      return html`<span>${trim(name, max, 'start')}</span>`
    } else if (key === 'first_name') {
      return html`<span>${trim(user.first_name, max, 'end')}</span>`
    } else if (key === 'last_name') {
      return html`<span>${trim(user.last_name, max, 'end')}</span>`
    } else if (key === 'email') {
      return html`<t-cp actionable content=${user.email}>${trim(user.email, max, 'middle')}</t-cp>`
    } else if (key === 'verified') {
      return html`<div>${user.email_verified_at ? new Date(user.email_verified_at).toLocaleString() : '-'}</div>`
    }
  }
  const produce = (user) => {
    const cols = ref()
    const holder = html`<t-cols ref=${cols} layout=${layout} onclick=${() => term.paste(`user ${user.id}`, true)}>
    </t-cols>`

    parts.forEach((part) => cols.current.append(makepart(user, part)))

    return holder
  }

  if (users.length > 0) {
    users.forEach((user) => term.log(produce(user)))
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
  term.hr()
  term.log('options:')
  term.log(html`<pre>-n, --count         number of items to show.</pre>`)
  term.log(html`<pre>-p, --page          the page of items to show.</pre>`)
  term.log(html`<pre>-f, --format        how to format each item (see below).</pre>`)
  term.hr()
  term.log('format:')
  term.log(`
    format can be a string indicating which fields to display and the max length of the column.
    for example '-f id:16,name:56,email:64' is the default format.
    `)
  term.log('supported fields:')
  term.log(html`<pre>id                  user id</pre>`)
  term.log(html`<pre>name                user's full name</pre>`)
  term.log(html`<pre>first_name          user's first name</pre>`)
  term.log(html`<pre>last_name           user's last name</pre>`)
  term.log(html`<pre>email               user's email address</pre>`)
  term.log(html`<pre>verified            verification date of user's email, if any.</pre>`)
}
register('users', users)
