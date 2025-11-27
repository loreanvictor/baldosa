import { broadcast } from '../../util/broadcast.js'
import { waitForOne } from '../../util/wait-for-one.js'
import { startAuthentication, finishAuthentication, startRegistration, finishRegistration } from './backend.js'
import { modal as registermodal } from './register-modal.js'
import { modal as guardmodal } from './guard-modal.js'
import { errmodal } from '../../design/overlays/errmodal.js'

let _token = undefined
let _email = undefined
let _name = undefined
let _verification = undefined

export const setAccount = (email, name, verification, token) => {
  if (token && email) {
    _token = token
    _name = name
    _email = email
    _verification = verification
    localStorage.setItem('current-user', JSON.stringify({ email, name, verification, token }))
    broadcast('account:login')
  } else {
    throw new Error('Wrong credentials for logging in')
  }
}

export const addVerification = (verification) => {
  _verification = {
    ..._verification,
    ...verification,
  }

  broadcast('account:verification_updated', _verification)
}

export const logout = () => {
  _token = undefined
  _email = undefined
  _name = undefined
  _verification = undefined
  localStorage.removeItem('current-user')
  broadcast('account:logout')
}

export const user = () =>
  _email &&
  _token && {
    name: _name,
    email: _email,
    verification: _verification,
    token: _token,
  }

export const init = () => {
  const current = JSON.parse(localStorage.getItem('current-user') ?? '{}')

  if (current.email && current.token) {
    setAccount(current.email, current.name ?? 'Anonymous User', current.verification, current.token)
  }
}

export const login = async (opts) => {
  try {
    const authOpts = await startAuthentication()
    const credential = await navigator.credentials.get(authOpts)

    const user = await finishAuthentication(credential)
    setAccount(user.email, `${user.firstname} ${user.lastname}`, user.verification, user.token)
  } catch (error) {
    if (opts?.silent) {
      throw error
    } else {
      errmodal().controls.open(`Could not login, because of the following error:`, error)
      errmodal().addEventListener('retry', login, { once: true })
    }
  }
}

export const register = async (opts) => {
  registermodal().controls.open()
  const { email, firstname, lastname } = await waitForOne(registermodal(), 'done', 'cancel')

  try {
    const createCredentialOptions = await startRegistration({ email, firstname, lastname })
    const credential = await navigator.credentials.create(createCredentialOptions)

    const user = await finishRegistration(credential)
    setAccount(user.email, `${user.firstname} ${user.lastname}`, user.verification, user.token)
  } catch (error) {
    if (opts?.silent) {
      throw error
    } else {
      errmodal().controls.open(
        `Could not register new user with email ${email}, because of the following error:`,
        error,
      )
      errmodal().addEventListener('retry', register, { once: true })
    }
  }
}

export const authenticated = async (opts) => {
  if (!_token) {
    guardmodal().controls.open()
    await waitForOne(guardmodal(), 'done', 'cancel')
  }

  return {
    ...opts,
    headers: {
      ...opts.headers,
      Authorization: `Bearer ${_token}`,
    },
  }
}
