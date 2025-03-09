import { define, onAttribute } from 'https://esm.sh/minicomp'
import { html, ref } from 'https://esm.sh/rehtm' 


define('resizing-label', () => {
  const label = ref()
  let locked = true

  onAttribute('locked', l => locked = l === false ? false : true)
  onAttribute('text', text => {
    const curr = label.current.textContent
    const next = text ?? ''
    let animation

    if (locked) {
      label.current.textContent = next
    } else if (curr !== next) {
      label.current.style = 'opacity: .5'
      clearInterval(animation)
      let iter = curr.split('')
      let index = 0
      animation = setInterval(() => {
        if (index < next.length && index < curr.length) {
          iter[index] = next[index]
        } else if (index < next.length) {
          iter.push(next[index])
        } else if (index < curr.length) {
          iter.pop()
        } else {
          clearInterval(animation)
          label.current.style = 'opacity: 1'
        }

        label.current.textContent = iter.join('')
        index++
      }, 200 / next.length)
    }
  })

  return html`
    <style>
      span {
        width: auto;
        transition: opacity .1s;
        overflow: hidden;
        display: inline-block;
        white-space: nowrap;
      }
    </style>
    <span ref=${label}></span>
  `
})
