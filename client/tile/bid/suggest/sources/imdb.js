import { split, wikipediaSummary } from './util.js'

export const enrichIMDb = async (prev) => {
  const imdbid = extractIMDbId(prev.url)
  const [imdbtitle, _, imdbsub] = split(prev.title)

  try {
    const wid = await wikidataIdFromIMDbId(imdbid)
    if (wid) {
      const summary = await wikipediaSummary(wid)
      if (summary) {
        return {
          title: summary.title,
          subtitle: imdbsub,
          description: summary.extract,
          image: prev.image,
        }
      }
    }
  } catch (err) {
    console.log(err)
  }

  return {
    title: imdbtitle,
    subtitle: imdbsub,
    image: prev.image,
  }
}

const extractIMDbId = (url) => {
  if (url) {
    const match = url.match(/tt\d{7,8}/)
    return match && match[0]
  }
}

const wikidataIdFromIMDbId = async (imdbId) => {
  const query = `
    SELECT ?item WHERE {
      ?item wdt:P345 "${imdbId}".
    }
    LIMIT 1
  `

  const url = new URL('https://query.wikidata.org/sparql')
  url.searchParams.set('query', query)
  url.searchParams.set('format', 'json')
  const res = await fetch(url, {
    headers: {
      Accept: 'application/sparql-results+json',
    },
  })

  if (!res.ok) {
    throw new Error(await res.text())
  }

  const data = await res.json()
  const binding = data.results.bindings[0]
  if (binding) {
    return binding.item.value.split('/').pop()
  }
}
