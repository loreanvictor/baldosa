import { define, on, onAttribute, currentNode, useDispatch, ATTRIBUTE_REMOVED } from 'minicomp'
import { ref, html } from 'rehtm'

import '../../util/swipe-control.js'


define('confirm-button', () => {
  const touchdevice = () => window.matchMedia('(pointer: coarse)').matches
  const confirm = useDispatch('confirm')
  const self = currentNode()
  const empty = ref()
  const filled = ref()
  let disabled = false
  let locked = false

  onAttribute('disabled', d => disabled = d !== undefined && d !== ATTRIBUTE_REMOVED)
  onAttribute('locked', (value) => locked = value !== null && value !== undefined && value !== ATTRIBUTE_REMOVED)
  onAttribute('label', (label) => {
    if (label) {
      const action = touchdevice() ? 'Slide' : 'Hold'
      empty.current.textContent = action + ' to ' + label
      filled.current.textContent = action + ' to ' + label
    }
  })

  const swipestart = ({ detail }) => {
    const rect = self.getBoundingClientRect()
    if (disabled || detail.start.x > rect.left + rect.width / 4) {
      detail.disqualify()
    }
  }

  const swipe = ({ detail }) => {
    const rect = self.getBoundingClientRect()
    const x = detail.d.x + detail.start.x
    filled.current.style.setProperty('transition', 'none')
    filled.current.style.setProperty('--percentage', `${Math.max((x - rect.left), 0) / rect.width * 100}%`)
  }

  const swipeend = ({ detail }) => {
    const rect = self.getBoundingClientRect()
    filled.current.style.setProperty('transition', '')
    const x = detail.d.x + detail.start.x
    if (x > rect.left + rect.width * .9) {
      confirm()
      if (!locked) {
        setTimeout(() => filled.current.style.setProperty('--percentage', ''), 200)
      }
    } else {
      filled.current.style.setProperty('--percentage', '')
    }
  }

  let holdinterval
  let waited = 0
  const wait = 2000
  on('mousedown', (event) => {
    if (touchdevice() || disabled) return

    const rect = self.getBoundingClientRect()
    const x = event.clientX
    const y = event.clientY
    filled.current.style.setProperty('transition', 'none')
    const clippath = `circle(var(--percentage) at
      ${(x - rect.left) / rect.width * 100}% ${(y - rect.top) / rect.height * 100}%)`
    filled.current.style.clipPath = clippath
    filled.current.style.webkitClipPath = clippath
    clearInterval(holdinterval)
    holdinterval = setInterval(() => {
      waited += 20
      filled.current.style.setProperty('--percentage', `${waited / wait * 100}%`)
    }, 20)
  })

  on('mouseup', () => {
    if (touchdevice()) return
    clearInterval(holdinterval)
    filled.current.style.setProperty('transition', '')
    
    if (waited >= wait * .8) {
      confirm()
      filled.current.style.setProperty('transition', '')
      clearInterval(holdinterval)

      if (!locked) {
        setTimeout(() => filled.current.style.setProperty('--percentage', ''), 200)
      }
    } else {
      filled.current.style.setProperty('--percentage', '')
    }

    waited = 0
  })

  on('mouseleave', () => {
    waited = 0
    clearInterval(holdinterval)
    filled.current.style.setProperty('transition', '')
    filled.current.style.setProperty('--percentage', '')
  })

  return html`
    <link rel="stylesheet" href="./client/design/confirm/styles.css" />
    <div class='empty' ref=${empty}>
    </div>
    <div class='filled' ref=${filled}>
    </div>
    <span class='slide-indicator'></span>
    <swipe-control target=${self}
      direction='horizontal'
      onstart=${swipestart} onswipe=${swipe} onrelease=${swipeend}></swipe-control>

  `
})
