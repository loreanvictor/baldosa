import createError from 'http-errors'

import { broadcast } from '../../util/broadcast.js'

import { authenticated } from '../auth/index.js'
import { backendURL } from '../../tile/bid/backend.js'


export const live = async () => {
  const res = await fetch(`${backendURL()}/live`,
    await authenticated({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  )

  if (!res.ok) {
    const msg = await res.text()
    throw createError(res.status, msg)
  }

  return await res.json()
}

export const pending = async () => {
  const res = await fetch(`${backendURL()}`,
    await authenticated({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  )

  if (!res.ok) {
    const msg = await res.text()
    throw createError(res.status, msg)
  }

  const pending = await res.json()

  return pending.map(p => ({
    ...p.bid,
    next_auction: p.next_auction,
  }))
}

export const history = async () => {
  const res = await fetch(`${backendURL()}/history`,
    await authenticated({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  )

  if (!res.ok) {
    const msg = await res.text()
    throw createError(res.status, msg)
  }

  return await res.json()
}


export const pendingAndHistory = async () => {
  const [_pending, _history] = await Promise.all([
    pending(),
    history()
  ])

  const pidmap = new Map(_pending.map(p => [p.id, p]))

  return [
    _pending, _history.map(h => pidmap.get(h.id) || h)
  ]
}


export const rescind = async bid => {
  const res = await fetch(`${backendURL()}/${bid.id}/rescind`, await authenticated({
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  }))

  if (!res.ok) {
    const msg = await res.text()
    throw createError(res.status, msg)
  }

  broadcast('bid:rescinded', bid)
}
