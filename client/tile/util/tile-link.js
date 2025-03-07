export const tilelink = tile =>
  `${window.location.origin}${window.location.pathname}?tile=${tile?.x ?? 0},${tile?.y ?? 0}`
