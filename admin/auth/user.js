import { broadcast } from '../../client/util/broadcast.js'
import { scopedkey } from './secure.js'

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
  const { key, user } = await scopedkey('admin_shell')
  if (user.email !== account()?.email) {
    throw new Error('wrong key for wrong user.')
  }

  broadcast('auth:securekeyloaded', { user, key })
}
