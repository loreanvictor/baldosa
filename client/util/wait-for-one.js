export const waitForOne = (target, event, errevent) => {
  return new Promise((resolve, reject) => {
    target.addEventListener(event, event => resolve(event.detail), { once: true })
    errevent && target.addEventListener(errevent, event => reject(event.detail), { once: true })
  })
}
