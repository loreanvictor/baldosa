import { broadcast } from '../../util/broadcast.js'
import { waitForOne } from '../../util/wait-for-one.js'
import { startLogin, finishLogin, startRegister, finishRegister } from './backend.js'
import { modal } from './modal.js'

let _token = undefined
let _email = undefined
let _name = undefined

const setaccount = (email, name, token) => {
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
  const challenge = await startLogin()
  const credentials = await navigator.credentials.get({
    publicKey: {
      challenge: Uint8Array.from(challenge, c => c.charCodeAt(0)),
      rp: {name: 'Baldosa'},
      userVerification: 'preferred'
    }
  })

  const user = await finishLogin(credentials)
  setaccount(user.email, user.name, user.token)
}

export const register = async () => {
    modal().controls.open()
    const { name, email } = await waitForOne(modal(), 'done', 'cancel')
    const { challenge, userid } = await startRegister(email)
    
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: Uint8Array.from(challenge, c => c.charCodeAt(0)),
        rp: {name: 'Baldosa'},
        user: {
          id: Uint8Array.from(userid, c => c.charCodeAt(0)),
          name: email,
          displayName: name,
        },
        pubKeyCredParams: [{alg: -7, type: "public-key"}],
        authenticatorSelection: {
          requireResidentKey: true,
          userVerification: 'preferred',
        },
        timeout: 60000,
        attestation: "direct"
      }
    })

    const user = await finishRegister(email, name, credential)
    setaccount(user.email, user.name, user.token)
}
