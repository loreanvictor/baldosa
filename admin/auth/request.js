import { currentTerm, TermError } from '../term/index.js'
import { token } from './user.js'

export const authenticated = (opts, _term) => {
  const term = _term ?? currentTerm()
  const t = token()

  if (!t) {
    throw new TermError('authentication required!')
  }

  const key = term.env['ADMIN_KEY']
  if (!key) {
    throw new TermError('no admin key found!')
  }

  return {
    ...opts,
    headers: {
      ...opts.headers,
      Authorization: `Bearer ${t}`,
      ['X-Admin-Key']: key,
    },
  }
}
