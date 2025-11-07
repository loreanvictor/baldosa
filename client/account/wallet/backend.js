import createError from 'http-errors'

import { conf } from '../../config.js'
import { authenticated } from '../auth/index.js'


export const backendURL = () => `${conf('BANK_URL') ?? 'https://bank.baldosa.city'}/wallet`

export const balance = async () => {
  const res = await fetch(`${backendURL()}/balance`, await authenticated({ method: 'GET' }))

  if (!res.ok) {
    const msg = await res.text()
    throw createError(res.status, msg)
  }

  return await res.json()
}

export const history = async () => {
  const res = await fetch(`${backendURL()}/history`, await authenticated({ method: 'GET' }))

  if (!res.ok) {
    const msg = await res.text()
    throw createError(res.status, msg)
  }

  return await res.json()
}

export const offers = async () => {
  const res = await fetch(`${backendURL()}/offers`, await authenticated({ method: 'GET' }))

  if (!res.ok) {
    const msg = await res.text()
    throw createError(res.status, msg)
  }

  return await res.json()
}


export const accept = async offer => {
  const res = await fetch(`${backendURL()}/accept`, await authenticated({
    method: 'POST',
    body: JSON.stringify(offer),
    headers: {
      'Content-Type': 'application/json'
    }
  }))

  if (!res.ok) {
    const msg = await res.text()
    throw createError(res.status, msg)
  }

  return await res.json()
}


export const rescind = async offer => {
  const res = await fetch(`${backendURL()}/rescind`, await authenticated({
    method: 'POST',
    body: JSON.stringify(offer),
    headers: {
      'Content-Type': 'application/json'
    }
  }))

  if (!res.ok) {
    const msg = await res.text()
    throw createError(res.status, msg)
  }

  return await res.json()
}
