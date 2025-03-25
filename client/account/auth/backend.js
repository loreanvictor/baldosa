import createError from 'http-errors'

import { conf } from '../../config.js'
import { niceKeyName } from './util.js'


export const backendURL = () => `${conf('BANK_URL') ?? 'https://bank.baldosa.city'}/auth`

export const startAuthentication = async () => {
  const { Base64 } = await import('js-base64')

  const res = await fetch(`${backendURL()}/authenticate/start`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!res.ok) {
    const msg = await res.text()
    throw createError(res.status, msg)
  }

  const authOpts = await res.json()
  authOpts.publicKey.challenge = Base64.toUint8Array(authOpts.publicKey.challenge)
  delete authOpts.mediation

  return authOpts
}

export const finishAuthentication = async (credentials) => {
  const { Base64 } = await import('js-base64')

  const res = await fetch(`${backendURL()}/authenticate/finish`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      credential: {
        id: credentials.id,
        rawId: Base64.fromUint8Array(new Uint8Array(credentials.rawId), true),
        type: credentials.type,
        authenticatorAttachment: credentials.authenticatorAttachment,
        response: {
          authenticatorData: Base64.fromUint8Array(new Uint8Array(credentials.response.authenticatorData), true),
          clientDataJSON: Base64.fromUint8Array(new Uint8Array(credentials.response.clientDataJSON), true),
          signature: Base64.fromUint8Array(new Uint8Array(credentials.response.signature), true),
          userHandle: Base64.fromUint8Array(new Uint8Array(credentials.response.userHandle), true),
        },
      },
    })
  })

  if (!res.ok) {
    const msg = await res.text()
    throw createError(res.status, msg)
  }

  const user = await res.json()

  return {
    email: user.email,
    token: user.token,
    firstname: user.first_name,
    lastname: user.last_name,
  }
}

export const startRegistration = async (user) => {
  const { Base64 } = await import('js-base64')

  const res = await fetch(`${backendURL()}/register/start`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: user.email,
      first_name: user.firstname,
      last_name: user.lastname,
    })
  })

  if (!res.ok) {
    const msg = await res.text()
    throw createError(res.status, msg)
  }

  const createCredOpts = await res.json()
  createCredOpts.publicKey.challenge = Base64.toUint8Array(createCredOpts.publicKey.challenge)
  createCredOpts.publicKey.user.id = Base64.toUint8Array(createCredOpts.publicKey.user.id)
  createCredOpts.publicKey.excludeCredentials?.forEach((cred) => {
    cred.id = Base64.toUint8Array(cred.id)
  })

  return createCredOpts
}

export const finishRegistration = async (credential) => {
  const { Base64 } = await import('js-base64')

  const res = await fetch(`${backendURL()}/register/finish`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      credential: {
        id: credential.id,
        rawId: Base64.fromUint8Array(new Uint8Array(credential.rawId), true),
        type: credential.type,
        response: {
          attestationObject: Base64.fromUint8Array(new Uint8Array(credential.response.attestationObject), true),
          clientDataJSON: Base64.fromUint8Array(new Uint8Array(credential.response.clientDataJSON), true),
        },
      },
      key_name: await niceKeyName(),
    })
  })

  if (!res.ok) {
    const msg = await res.text()
    throw createError(res.status, msg)
  }

  const user = await res.json()

  return {
    email: user.email,
    token: user.token,
    firstname: user.first_name,
    lastname: user.last_name,
  }
}
