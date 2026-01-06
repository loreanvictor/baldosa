import { define, on, onAttribute, currentNode, useDispatch, ATTRIBUTE_REMOVED } from 'minicomp'
import { ref, html } from 'rehtm'

import '../../../util/swipe-control.js'

define('confirm-button', () => {
  const touchdevice = () => window.matchMedia('(pointer: coarse)').matches
  const confirm = useDispatch('confirm')
  const self = currentNode()
  const empty = ref()
  const filled = ref()
  const knob = ref()
  let disabled = false
  let locked = false

  onAttribute('disabled', (d) => (disabled = d !== undefined && d !== ATTRIBUTE_REMOVED))
  onAttribute('locked', (value) => (locked = value !== null && value !== undefined && value !== ATTRIBUTE_REMOVED))
  onAttribute('label', (label) => {
    if (label) {
      empty.current.textContent = label
      filled.current.textContent = label
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
    self.setAttribute('engaged', '')
    self.style.setProperty('--percentage', `${(Math.max(x - rect.left, 0) / rect.width) * 100}%`)
  }

  const swipeend = ({ detail }) => {
    const rect = self.getBoundingClientRect()
    self.removeAttribute('engaged')
    const x = detail.d.x + detail.start.x
    if (x > rect.left + rect.width * 0.9) {
      confirm()
      if (!locked) {
        setTimeout(() => self.style.setProperty('--percentage', ''), 200)
      }
    } else {
      self.style.setProperty('--percentage', '')
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
    self.setAttribute('engaged', '')
    self.style.setProperty('--tx', `${((x - rect.left) / rect.width) * 100}%`)
    self.style.setProperty('--ty', `${((y - rect.top) / rect.height) * 100}%`)

    clearInterval(holdinterval)
    holdinterval = setInterval(() => {
      waited += 20
      self.style.setProperty('--percentage', `${(waited / wait) * 100}%`)

      if (waited >= wait * 0.8) {
        clearInterval(holdinterval)
        self.removeAttribute('engaged')
        confirm()

        if (!locked) {
          setTimeout(() => self.style.setProperty('--percentage', ''), 200)
        }

        waited = 0
      }
    }, 20)
  })

  on('mouseup', () => {
    if (touchdevice()) return
    clearInterval(holdinterval)
    self.removeAttribute('engaged')
    self.style.setProperty('--percentage', '')
    waited = 0
  })

  on('mouseleave', () => {
    waited = 0
    clearInterval(holdinterval)
    self.removeAttribute('engaged')
  })

  return html`
    <link rel="stylesheet" href="./client/design/buttons/confirm/styles.css" />
    <div class="empty" ref=${empty}></div>
    <div class="filled" ref=${filled}></div>
    <span class="slide-knob" ref=${knob}>
      <i-con src="arrow-right" thick></i-con>
    </span>
    <span class="slide-indicator"></span>
    <span>
      <span class="hold-indicator"></span>
      <span class="hold-indicator"></span>
      <span class="hold-indicator"></span>
      <span class="hold-indicator"></span>
    </span>
    <swipe-control
      target=${self}
      direction="horizontal"
      onstart=${swipestart}
      onswipe=${swipe}
      onrelease=${swipeend}
    ></swipe-control>
  `
})
