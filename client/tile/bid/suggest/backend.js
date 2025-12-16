import { authenticated } from '../../../account/auth/index.js'
import { backendURL } from '../backend.js'

import { enrichSpotify } from './sources/spotify.js'
import { enrichIMDb } from './sources/imdb.js'
import { enrichNetflix } from './sources/netflix.js'
import { enrichGoogleMaps } from './sources/googlemaps.js'

export const preview = async (url) => {
  const requrl = new URL(`${backendURL()}/suggest`)
  requrl.searchParams.set('url', url)
  const res = await fetch(
    requrl,
    await authenticated({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  )

  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`Error fetching preview: ${msg}`)
  }

  return await res.json()
}

const cache = {}

export const getSuggestion = async (url) => {
  if (url in cache) {
    return cache[url]
  }

  const res = await _suggestion(url)
  cache[url] = res

  return res
}

const _suggestion = async (url) => {
  const prev = await preview(url)

  // TODO: maybe later try switching to a self-hosted
  //       image proxy? or maybe not. lets see in the future.
  prev.image = prev.image ? `https://images.weserv.nl/?url=${encodeURIComponent(prev.image)}` : undefined

  if (prev.url.match(/spotify\.com/)) {
    return enrichSpotify(prev)
  } else if (prev.url.match(/imdb\.com/)) {
    return enrichIMDb(prev)
  } else if (prev.url.match(/netflix\.com/)) {
    return enrichNetflix(prev)
  } else if (prev.url.match(/google\.com\/maps/)) {
    return enrichGoogleMaps(prev)
  } else {
    return prev
  }
}
