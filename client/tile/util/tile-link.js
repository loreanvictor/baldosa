import { toNSEW } from '../../util/nsew.js'

export const tilelink = (tile) =>
  `${window.location.origin}${window.location.pathname}?tile=${toNSEW(tile?.x ?? 0, tile?.y ?? 0, true)}`
