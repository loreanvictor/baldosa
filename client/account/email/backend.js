import createError from 'http-errors'

import { backendURL as authBackendURL } from '../auth/backend.js'
import { authenticated } from '../auth/index.js'

export const backendURL = () => `${authBackendURL()}/email`


export const sendAuthCode = async (email) => {
  const res = await fetch(`${backendURL()}/code`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  })

  if (!res.ok) {
    const msg = await res.text()
    throw createError(res.status, msg)
  }
}


export const authenticateWithCode = async (email, code) => {
  const res = await fetch(`${backendURL()}/authenticate`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, code })
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
    verification: user.verification,
  }
}


export const sendVerificationCode = async () => {
  const res = await fetch(`${backendURL()}/verification-code`,
    await authenticated({
      method: 'POST',
      credentials: 'include',
    })
  )

  if (!res.ok) {
    const msg = await res.text()
    throw createError(res.status, msg)
  }
}


export const verifyEmailWithCode = async (code) => {
  const res = await fetch(`${backendURL()}/verify`, 
    await authenticated({
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    })
  )

  if (!res.ok) {
    const msg = await res.text()
    throw createError(res.status, msg)
  }
}
