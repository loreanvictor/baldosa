// import conf from 'https://esm.run/canvas-confetti@1.9.4'

import sleep from 'sleep-promise'
import { define, onAttribute, on, currentNode, onConnected, useDispatch } from 'minicomp'
import { html, ref } from 'rehtm'

import '../../display/icon/component.js'
import '../../overlays/pane.js'

import { prepConfetti } from './confetti.js'

const reactionCountDisplay = (count) => {
  if (count >= 1_000_000_000_000) {
    return '∞'
  } else if (count >= 1_000_000_000) {
    return `${Math.floor(count / 100_000_000) / 10}B`
  } else if (count >= 1_000_000) {
    return `${Math.floor(count / 100_000) / 10}M`
  } else if (count >= 1_000) {
    return `${Math.floor(count / 100) / 10}K`
  } else {
    return `${count}`
  }
}

define('reaction-button', ({ icon, confetti }) => {
  const toggled = useDispatch('toggle')
  const self = currentNode()
  const icon$ = ref()
  const iconReacted$ = ref()
  const count$ = ref()

  let count = 0
  let fireConfetti

  on('click', async () => {
    if (!self.hasAttribute('loading')) {
      let resolve
      let blocked = false
      let promise
      toggled({
        reacted: !self.hasAttribute('reacted'),
        block: () => {
          blocked = true
          promise = new Promise((res) => {
            resolve = res
          })
        },
        unblock: () => {
          blocked = false
          resolve && resolve()
        },
      })
      await sleep(1)
      await promise

      self.toggleAttribute('reacted')
      if (self.hasAttribute('reacted')) {
        fireConfetti && setTimeout(() => fireConfetti(icon$.current), 100)
        count$.current.textContent = reactionCountDisplay(++count)
      } else {
        count$.current.textContent = reactionCountDisplay(--count)
      }
    }
  })

  onAttribute('count', (c) => {
    if (c === undefined) {
      count = 0
      count$.current.textContent = '---'
    } else {
      count = parseInt(c, 10) || 0
      count$.current.textContent = reactionCountDisplay(count)
    }
  })

  onConnected(() => {
    if (confetti) {
      const canvas$ = ref()
      self.shadowRoot.appendChild(html`<canvas ref=${canvas$}></canvas>`)
      fireConfetti = prepConfetti(canvas$.current, confetti)
    }
  })

  return html`
    <link rel="stylesheet" href="./client/design/buttons/reaction-button/styles.css" />
    <glass-pane>
      <div>
        <i-con id="unset" ref=${icon$} src=${icon ?? '👍'} dark thick></i-con>
        <i-con id="reacted" ref=${iconReacted$} src=${icon ?? '👍'} dark fill></i-con>
      </div>
      <span ref=${count$}>---</span>
    </glass-pane>
  `
})
