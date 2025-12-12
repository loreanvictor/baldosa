import { broadcast } from '../../client/util/broadcast.js'

let _token = undefined
let _email = undefined
let _name = undefined

export const account = () =>
  _token && {
    email: _email,
    name: _name,
  }

export const token = () => _token

export const init = () => {
  const current = JSON.parse(localStorage.getItem('current-user') ?? '{}')

  if (current.email && current.token) {
    _email = current.email
    _token = current.token
    _name = current.name

    broadcast('auth:init')
  }
}
