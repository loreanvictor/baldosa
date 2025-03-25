import createError from 'http-errors'

import { backendURL as authBackendURL } from '../../auth/backend.js'
import { authenticated } from '../../auth/index.js'
import { niceKeyName } from '../../auth/util.js'


export const backendURL = () => `${authBackendURL()}/passkeys`

export const getPasskeys = async () => {
  const res = await fetch(backendURL(), authenticated({ method: 'GET' }))
  const keys = await res.json()

  return keys
}

export const startAddingPasskey = async () => {
  const { Base64 } = await import('js-base64')

  const res = await fetch(`${backendURL()}/start`,
    authenticated({
      method: 'POST',
      credentials: 'include'
    })
  )

  if (!res.ok) {
    const msg = await res.text()
    throw createError(res.status, msg)
  }

  const credOpts = await res.json()
  credOpts.publicKey.challenge = Base64.toUint8Array(credOpts.publicKey.challenge)
  credOpts.publicKey.user.id = Base64.toUint8Array(credOpts.publicKey.user.id)
  credOpts.publicKey.excludeCredentials?.forEach((cred) => {
    cred.id = Base64.toUint8Array(cred.id)
  })

  return credOpts
}

export const finishAddingPasskey = async credential => {
  const { Base64 } = await import('js-base64')

  const res = await fetch(`${backendURL()}/finish`,
    authenticated({
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
  )

  if (!res.ok) {
    const msg = await res.text()
    throw createError(res.status, msg)
  }

  return await res.json()
}

export const removePasskey = async passkey => {
  await fetch(`${backendURL()}/${passkey.id}`,
    authenticated({
      method: 'DELETE',
    })
  )
}
