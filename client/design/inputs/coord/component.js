import { define, useDispatch, currentNode, onAttribute, attachControls } from 'minicomp'
import { ref, html } from 'rehtm'

import { observe } from '../../../util/observe.js'

const SPECIAL_KEYS = { ERASE: 'DEL', RESET: '↺' }

define('coord-input', () => {
  const self = currentNode()
  const onInput = useDispatch('input')
  const onComplete = useDispatch('complete')

  const inputx = ref()
  const inputc = ref()
  const inputy = ref()

  let placeholder = { x: 0, y: 0 }
  let entered = ''

  const format = (str) =>
    (str ?? '')
      .split(',')
      .slice(0, 2)
      .map((s) => s.trim())
      .join(',')

  const parse = (str) => {
    const [x, y] = str.split(',')
    return { x: parseInt(x.trim()), y: y ? parseInt(y.trim()) : NaN }
  }

  const setinput = (v, pv, inp) => {
    const empty = !v?.length
    inp.classList.toggle('placeholder', empty)
    inp.textContent = empty ? pv : v
  }

  const display = () => {
    const [x, y] = entered.split(',')
    const comma = entered.includes(',')

    setinput(x, placeholder.x, inputx.current)
    setinput(y, placeholder.y, inputy.current)
    inputc.current.classList.toggle('placeholder', !comma)
  }

  const add = (key) => {
    const last = entered[entered.length - 1]
    let next = entered

    if (key === SPECIAL_KEYS.ERASE) {
      next = entered.slice(0, -1)
    } else if (key === SPECIAL_KEYS.RESET) {
      next = ''
    } else if (key === ',') {
      if (!entered.includes(',')) {
        next += key
      }
    } else if (key === '-') {
      next = entered
        .split(',')
        .map((p) => p.trim())
        .map((p, i, l) => {
          if (i === l.length - 1) {
            if (p.startsWith('-')) {
              return p.slice(1)
            } else {
              return '-' + p
            }
          } else {
            return p
          }
        })
        .join(',')
    } else if (last === ',') {
      next += key
    } else {
      const split = next.split(',')
      const last = split[split.length - 1]
      if (last.length < 5) {
        next += key
      }
    }

    self.value = parse(next.trim())
    entered = next.trim()
    display()
    onInput(self.value)
  }

  let erasetimeout
  let eraseinterval

  const click = (event) => {
    if (event.target.closest('button')) {
      const key = event.target.textContent
      add(key)

      if (key === SPECIAL_KEYS.ERASE) {
        clearTimeout(erasetimeout)
        clearInterval(eraseinterval)

        erasetimeout = setTimeout(() => {
          eraseinterval = setInterval(() => {
            add(SPECIAL_KEYS.ERASE)
          }, 80)
        }, 250)
      }
    }
  }

  const unclick = () => {
    clearTimeout(erasetimeout)
    clearInterval(eraseinterval)
  }

  self.setAttribute('tabindex', '0')
  attachControls({ reset: () => (entered = '') })

  onAttribute('placeholder', (val) => {
    const parsed = parse(format(val))
    placeholder = { x: parsed.x ?? 0, y: parsed.y ?? 0 }
    !entered.length && (self.value = parsed)
    display()
  })

  observe(self, 'keydown', (event) => {
    if (event.key === 'Enter') {
      onComplete(self.value)
    } else if (event.key === 'Backspace') {
      add(SPECIAL_KEYS.ERASE)
    } else if (event.key.match(/[0-9]/) || event.key === '-' || event.key === ',') {
      add(event.key)
    }
  })

  return html`
    <link rel="stylesheet" href="./client/design/inputs/coord/styles.css" />
    <div id="input"><span ref=${inputx}>0</span><span ref=${inputc}>,</span><span ref=${inputy}>0</span></div>
    <div id="keypad" onpointerdown=${click} onpointerup=${unclick}>
      <button>1</button><button>2</button><button>3</button> <button>4</button><button>5</button><button>6</button>
      <button>7</button><button>8</button><button>9</button> <button sym>-</button><button>0</button
      ><button sym>,</button>

      <button cmd>${SPECIAL_KEYS.ERASE}</button>
      <button></button>
      <button></button>
    </div>
  `
})
