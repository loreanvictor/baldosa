export const composeclass = map => Object.entries(map)
  .filter(([_, value]) => value)
  .map(([key, _]) => key)
  .join(' ')
  