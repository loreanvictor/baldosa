// TODO: maybe this should be tile based?
//      I'm unsure about this. but if it is, then
//      we should use indexeddb instead of localstorage

let draft
const DRAFT_KEY = '--tile-bid-draft'

export const loadDraft = async tile => {
  const stored = localStorage.getItem(DRAFT_KEY)

  if (stored) {
    draft = JSON.parse(stored)
  }

  return draft
}

let saveDraftTimeout

export const updateDraft = async (tile, content) => {
  draft ??= content

  'title' in content && (draft.title = content.title)
  'subtitle' in content && (draft.subtitle = content.subtitle)
  'url' in content && (draft.url = content.url)
  'description' in content && (draft.description = content.description)

  if ('image' in content) {
    draft.image ??= content.image

    if (content.image) {
      'src' in content.image && (draft.image.src = content.image.src)
      'offset' in content.image && (draft.image.offset = content.image.offset)
      'scale' in content.image && (draft.image.scale = content.image.scale)
    }
  }

  if (saveDraftTimeout) {
    clearTimeout(saveDraftTimeout)
  }

  saveDraftTimeout = setTimeout(() => saveDraft(tile), 200)
}

export const saveDraft = async tile => {
  if (!draft) {
    localStorage.removeItem(DRAFT_KEY)
  } else {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }
}


const BID_KEY = '--tile-bid'

export const loadBid = async tile => {
  const stored = localStorage.getItem(BID_KEY)
  const parsed = stored && JSON.parse(stored)

  return (!parsed || isNaN(parsed)) ? 1 : parsed
}

export const updateBid = async (tile, amount) => {
  localStorage.setItem(BID_KEY, JSON.stringify(amount))
}
