import { broadcast } from '../../util/broadcast.js'
import { waitForOne } from '../../util/wait-for-one.js'
import { startAuthentication, finishAuthentication,
    startRegistration, finishRegistration } from './backend.js'
import { modal } from './modal.js'
import { errmodal } from '../../design/misc/errmodal.js'


let _token = undefined
let _email = undefined
let _name = undefined

const setaccount = (email, name, token) => {
  console.log('--- LOGIN! ---')
  _token = token
  _name = name
  _email = email
  localStorage.setItem('current-user', JSON.stringify({ email, name, token }))
  broadcast('account:login')
}

export const logout = () => {
  _token = undefined
  _email = undefined
  _name = undefined
  localStorage.removeItem('current-user')
  broadcast('account:logout')
}

export const user = () => (_email && _token && { name: _name, email: _email, token: _token })

export const init = () => {
  const current = JSON.parse(localStorage.getItem('current-user') ?? '{}')

  if (current.email && current.token) {
    setaccount(current.email, current.name ?? 'Anonymous User', current.token)
  }
}

export const login = async () => {
  try {
    const authOpts = await startAuthentication()
    const credential = await navigator.credentials.get(authOpts)
  
    const user = await finishAuthentication(credential)
    setaccount(user.email, `${user.firstname} ${user.lastname}`, user.token)
  } catch (error) {
    errmodal().controls.open(
      `Could not login, because of the following error:`,
      error
    )
    errmodal().addEventListener('retry', login, { once: true })
  }
}

export const register = async () => {
  modal().controls.open()
  const { email, firstname, lastname } = await waitForOne(modal(), 'done', 'cancel')

  try {
    const createCredentialOptions = await startRegistration({ email, firstname, lastname })
    const credential = await navigator.credentials.create(createCredentialOptions)

    const user = await finishRegistration(credential)
    setaccount(user.email, `${user.firstname} ${user.lastname}`, user.token)
  } catch (error) {
    errmodal().controls.open(
      `Could not register new user with email ${email}, because of the following error:`,
      error
    )
    errmodal().addEventListener('retry', register, { once: true })
  }
}


export const authenticated = (opts) => {
  return {
    ...opts,
    headers: {
      ...opts.headers,
      'Authorization': `Bearer ${_token}`
    }
  }
}
