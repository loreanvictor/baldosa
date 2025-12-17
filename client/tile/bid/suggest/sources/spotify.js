import { split, searchWikidata, wikipediaSummary } from './util.js'

export const enrichSpotify = async (prev) => {
  if (prev.description.match(/^Artist ·/i)) {
    let subtitle = undefined
    let description = undefined
    try {
      const search = await searchWikidata(prev.title)
      if (search) {
        const candidate = search.find((entry) => entry.description.match(/(band)|(music)/i))
        if (candidate) {
          subtitle = candidate.description
          const summary = await wikipediaSummary(candidate.id)
          description = summary?.extract
        }
      }
    } catch (err) {
      console.error(err)
    }

    return {
      title: prev.title,
      image: prev.image,
      subtitle,
      description,
    }
  } else if (prev.description.match(/· album ·/i) || prev.description.match(/· EP ·/)) {
    const [artist, type] = split(prev.description)
    const [title, subtitle] = split(prev.title)
    let description = undefined

    try {
      const search = await searchWikidata(title)
      if (search) {
        const candidate = search.find((entry) => entry.description.includes(artist) && entry.description.includes(type))
        if (candidate) {
          const summary = await wikipediaSummary(candidate.id)
          description = summary?.extract
        }
      }
    } catch (err) {
      console.error(err)
    }

    return {
      title,
      subtitle,
      description,
      image: prev.image,
    }
  } else if (prev.description.match(/· Song ·/i)) {
    return {
      title: prev.title,
      subtitle: `Song by ${split(prev.description)[0]}`,
      image: prev.image,
    }
  } else {
    const [title, subtitle] = split(prev.title)
    return {
      title,
      subtitle,
      image: prev.image,
    }
  }
}
