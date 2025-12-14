import { currentTerm } from '../term/index.js'

export const baseUrl = (term) => `${(term ?? currentTerm()).env['BANK_URL']}/bids`

export const imageUrl = (x, y, term) => {
  const env = term?.env ?? currentTerm().env

  return `${env['BASE_URL']}/tile-${x}-${y}.jpg`
}
