export const composeclass = map => Object.entries(map)
  .filter(([key, value]) => value)
  .map(([key, value]) => key)
  .join(' ')
  