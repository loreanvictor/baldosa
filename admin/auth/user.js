import { broadcast } from '../../client/util/broadcast.js'
import { scopedkey } from '../../client/account/auth/secure.js'

let _token = undefined
let _email = undefined
let _name = undefined
let _securekey = undefined

export const account = () =>
  _token && {
    email: _email,
    name: _name,
  }

export const token = () => _token
export const securekey = () => _securekey

export const init = async () => {
  const current = JSON.parse(localStorage.getItem('current-user') ?? '{}')

  if (current.email && current.token) {
    _email = current.email
    _token = current.token
    _name = current.name

    broadcast('auth:init')
  }
}

export const loadsecurekey = async () => {
  _securekey = await scopedkey('admin_shell')
  broadcast('auth:securekeyloaded')
}
