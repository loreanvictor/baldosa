import createError from 'http-errors'

import { authenticated } from '../auth/index.js'
import { backendURL } from '../../tile/bid/backend.js'


export const tiles = async () => {
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

export const unpublish = async ({ x, y }) => {
  const res = await fetch(`${backendURL()}/${x}:${y}`,
    await authenticated({
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  )

  if (!res.ok) {
    const msg = await res.text()
    throw createError(res.status, msg)
  }
}
