import { currentTerm } from '../term/index.js'

export const imageUrl = (x, y, term) => {
  const env = term?.env ?? currentTerm().env

  return `${env['BASE_URL']}/tile-${x}-${y}.jpg`
}
