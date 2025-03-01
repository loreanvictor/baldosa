import { define, useDispatch, currentNode, onAttribute, attachControls } from 'https://esm.sh/minicomp'
import { ref, html } from 'https://esm.sh/rehtm'

import { observe } from '../util/observe.js'


const SPECIAL_KEYS = { ERASE: '⌫', RESET: '↺' }


define('coord-input', () => {

  const self = currentNode()
  const onInput = useDispatch('input')
  const onComplete = useDispatch('complete')
  const input = ref()
  const erase = ref()
  let placeholder = '0 , 0'
  let entered = ''

  const format = str => (str ?? '').split(',').slice(0, 2).map(s => s.trim()).join(' , ')

  const parse = str => {
    const [x, y] = str.split(',')
    return { x: parseInt(x.trim()), y: y ? parseInt(y.trim()) : NaN }
  }

  const display = () => {
    if (entered.length > 0) {
      input.current.textContent = entered
      input.current.classList.remove('placeholder')
    } else {
      input.current.textContent = placeholder
      input.current.classList.add('placeholder')
    }
  }

  const add = (key) => {
    const last = entered[entered.length - 1]
    let next = entered

    if (key === SPECIAL_KEYS.ERASE) { next = entered.slice(0, -1) }
    else if (key === SPECIAL_KEYS.RESET) { next = '' }
    else if (key === ',') {
      if (!entered.includes(',')) { next += ' ' + key }
    } else if (key === '-') {
      next = entered.split(',').map(p => p.trim()).map((p, i, l) => {
        if (i === l.length - 1) {
          if (p.startsWith('-')) { return p.slice(1) }
          else { return '-' + p }
        } else {
          return p
        }
      }).join(' , ')
    } else if (last === ',') { next += ' ' + key }
    else { next += key }

    self.value = parse(next.trim())
    entered = next.trim()
    display()
    onInput(self.value)
  }

  const click = event => {
    if (event.target.tagName === 'BUTTON') {
      add(event.target.textContent)
    }
  }

  self.setAttribute('tabindex', '0')
  attachControls({ reset: () => entered = '' })

  onAttribute('placeholder', (val) => {
    const clean = format(val)
    placeholder = clean
    !entered.length && (self.value = parse(clean))
    display()
  })

  observe(self, 'keydown', event => {
    if (event.key === 'Enter') {
      onComplete(self.value)
    } else if (event.key === 'Backspace') {
      add(SPECIAL_KEYS.ERASE)
    } else if (event.key.match(/[0-9]/) || event.key === '-' || event.key === ',') {
      add(event.key)
    }
  })

  let eraseinterval
  let erasetimeout
  observe(erase, 'pointerdown', () => {
    clearTimeout(erasetimeout)
    clearInterval(eraseinterval)
    erasetimeout = setTimeout(() => {
      eraseinterval = setInterval(() => {
        add(SPECIAL_KEYS.ERASE)
      }, 60)
    }, 250)
  }, { passive: true })
  observe(self, 'pointerup', () => {
    clearTimeout(erasetimeout)
    clearInterval(eraseinterval)
  }, { passive: true })

  return html`
    <link rel="stylesheet" href="./client/design/coord-input.css" />
    <span id="input" ref=${input}></span>
    <div id="keypad" onpointerdown=${click}>
      <button>1</button><button>2</button><button>3</button>
      <button>4</button><button>5</button><button>6</button>
      <button>7</button><button>8</button><button>9</button>
      <button sym>-</button><button>0</button><button sym>,</button>

      <button ref=${erase}>${SPECIAL_KEYS.ERASE}</button>
      <button></button>
      <button></button>
    </div>
  `
})
