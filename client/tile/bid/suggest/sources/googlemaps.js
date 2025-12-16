import { split } from './util.js'

export const enrichGoogleMaps = async (prev) => {
  const [title, address] = split(prev.title)
  const subtitle = split(prev.description).join('').trim()

  return {
    title,
    subtitle,
    image: prev.image,
    description: address,
  }
}
