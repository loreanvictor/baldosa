import { startAuthentication, finishAuthentication } from '../../client/account/auth/backend.js'

const hkdf = async (ikm, info, length = 32) => {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(),
      info: new TextEncoder().encode(info),
    },
    key,
    length * 8,
  )

  return new Uint8Array(bits)
}

const derivekey = async (cred, scope) => {
  const ext = cred.getClientExtensionResults()
  const prf = ext?.prf?.results?.first

  if (!prf) {
    throw new Error('PRF not supported on this platform')
  }

  return hkdf(new Uint8Array(prf), scope)
}

export const scopedkey = async (scope) => {
  const authOpts = await startAuthentication(scope)
  const credential = await navigator.credentials.get(authOpts)
  const user = await finishAuthentication(credential)

  const derived = await derivekey(credential, scope)
  const key = await crypto.subtle.importKey('raw', derived, 'AES-GCM', false, ['encrypt', 'decrypt'])

  return { user, key }
}

export const nonce = async () => {
  const { Base64 } = await import('js-base64')
  const bytes = crypto.getRandomValues(new Uint8Array(12))

  return Base64.fromUint8Array(bytes, true)
}

export const encrypt = async (key, text, nonce) => {
  const { Base64 } = await import('js-base64')
  const iv = Base64.toUint8Array(nonce)
  const cypher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text))

  return Base64.fromUint8Array(new Uint8Array(cypher))
}

export const decrypt = async (key, text, nonce) => {
  const { Base64 } = await import('js-base64')
  const iv = Base64.toUint8Array(nonce)
  const cypher = Base64.toUint8Array(text)
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cypher)

  return new TextDecoder().decode(plain)
}

export const encryption = (key) => ({
  nonce,
  encrypt: (text, nonce) => encrypt(key, text, nonce),
  decrypt: (text, nonce) => decrypt(key, text, nonce),
})
