
const MOCK_PUBLISHED = ['0:0', '1:1', '2:1', '511:511']

// TODO: this is mock, complete it
export const createGridMask = () => {
  return {
    has: (x, y) => MOCK_PUBLISHED.includes(`${x}:${y}`),
    listen: () => {},
  }
}
