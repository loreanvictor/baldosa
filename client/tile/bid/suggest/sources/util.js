const KNIFE = /\||\s-\s|·|⭐|★|☆/

export const split = (s) => s.split(KNIFE).map((_) => _.trim())

export const searchWikidata = async (name) => {
  const url = new URL('https://www.wikidata.org/w/api.php')
  url.searchParams.set('search', name)
  url.searchParams.set('action', 'wbsearchentities')
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')
  url.searchParams.set('origin', '*')

  const response = await fetch(url)

  if (response.ok) {
    const res = await response.json()
    if (res.success) {
      return res.search
    } else {
      return []
    }
  } else {
    throw new Error(await response.text())
  }
}

export const wikipediaSummary = async (qid) => {
  const entresp = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`)
  if (!entresp.ok) {
    throw new Error(await entresp.text())
  }
  const entities = await entresp.json()

  if (entities.entities[qid].sitelinks.enwiki) {
    const slug = encodeURIComponent(entities.entities[qid].sitelinks.enwiki.title)
    const wikiresp = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`)
    if (!wikiresp.ok) {
      throw new Error(await wikiresp.text())
    }

    const wiki = await wikiresp.json()

    return wiki
  }
}
