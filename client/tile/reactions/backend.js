import { authenticatedIfPossible, authenticated } from '../../account/auth/index.js'
import { backendURL as bidsBackendURL } from '../bid/backend.js'

export const backendURL = (tile) => `${bidsBackendURL()}/${tile.x}:${tile.y}/reactions`

export const REACTIONS = {
  LIKE: 'like',
}

export const reactions = async (tile) => {
  const res = await fetch(
    backendURL(tile),
    authenticatedIfPossible({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  )

  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`Error fetching reaction info: ${msg}`)
  }

  const summary = await res.json()
  return {
    likes: summary.like_count,
    likedByUser: summary.viewer_reaction === REACTIONS.LIKE,
  }
}

export const like = async (tile) => {
  const res = await fetch(
    backendURL(tile),
    await authenticated({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reaction: REACTIONS.LIKE }),
    }),
  )

  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`Error liking tile: ${msg}`)
  }
}

export const unlike = async (tile) => {
  const res = await fetch(
    backendURL(tile),
    await authenticated({
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reaction: REACTIONS.LIKE }),
    }),
  )

  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`Error unliking tile: ${msg}`)
  }
}
