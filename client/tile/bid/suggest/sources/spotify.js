import { split, searchWikidata, wikipediaSummary } from './util.js'

export const enrichSpotify = async (prev) => {
  if (prev.description.match(/^Artist ·/i)) {
    let subtitle = undefined
    let description = undefined
    try {
      const search = await searchWikidata(prev.title)
      if (search) {
        const candidate = search.find((entry) => entry.description.match(/band/i))
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
  } else if (prev.description.match(/· album ·/i)) {
    return {
      title: split(prev.title)[0],
      subtitle: `Album by ${split(prev.description)[0]}`,
      image: prev.image,
    }
  } else if (prev.description.match(/· Song ·/i)) {
    return {
      title: prev.title,
      subtitle: `Song by ${split(prev.description)[0]}`,
      image: prev.image,
    }
  }
}
