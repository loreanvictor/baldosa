const MOCK_PUBLISHED = ['0:0', '1:1', '2:1', '511:511']

export const createMockGridMask = () => {
  return {
    has: (x, y) => MOCK_PUBLISHED.includes(`${x}:${y}`),
    listen: () => {},
  }
}
