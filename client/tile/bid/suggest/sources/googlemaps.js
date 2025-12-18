import { split } from './util.js'

export const enrichGoogleMaps = async (prev) => {
  let [title, address] = split(prev.title)
  let subtitle = split(prev.description).join('').trim()

  if (subtitle.match(/google maps/i)) {
    // maps link shared from the phone doesn't have the full
    // address in og metadata, but rather in the URL
    subtitle = address
    const url = new URL(prev.url)
    const q = url.searchParams.get('q')
    if (q && q.match(title)) {
      address = q
    } else {
      address = ''
    }
  }

  return {
    title,
    subtitle,
    image: prev.image,
    description: address,
  }
}
