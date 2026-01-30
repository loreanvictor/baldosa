import { define, useDispatch, currentNode, onAttribute, attachControls } from 'minicomp'
import { ref, html } from 'rehtm'

import { fromNSEW } from '../../../util/nsew.js'
import { observe } from '../../../util/observe.js'
import { isCoordinate, isDirection, isNumber, isLastPartNumber, toggleDirectionOfLastPart } from './util.js'

const SPECIAL_KEYS = { ERASE: 'DEL', RESET: 'CLR', NORTH_SOUTH: 'N S', WEST_EAST: 'W E' }

define('coord-input', () => {
  const self = currentNode()
  const onInput = useDispatch('input')
  const onComplete = useDispatch('complete')

  const value$ = ref()
  const nsswitch$ = ref()
  const weswitch$ = ref()

  let placeholder
  let value

  const display = () => {
    value$.current.textContent = value ?? placeholder
    value$.current.classList.toggle('placeholder', value === undefined)

    if (value) {
      const parts = value.split(',').map((p) => p.toUpperCase().trim())
      const last = parts[parts.length - 1]
    }
  }

  const setvalue = () => {
    try {
      self.value = fromNSEW(value ?? placeholder)
    } catch {
      self.value = { x: 0, y: 0 }
    }
  }

  const complete = () => {
    try {
      if (value === '0') {
        self.value = { x: 0, y: 0 }
      } else {
        self.value = fromNSEW(value)
      }
      onComplete(self.value)
    } catch {}
  }

  const add = (key) => {
    if (key === SPECIAL_KEYS.ERASE) {
      if (value) {
        value = value.trim().slice(0, -1)
        if (value === '') {
          value = undefined
        }
      }
    } else if (key === SPECIAL_KEYS.RESET) {
      value = undefined
    } else if (key === ',') {
      if (isCoordinate(value)) {
        value += ', '
      }
    } else if (key === SPECIAL_KEYS.NORTH_SOUTH) {
      value = toggleDirectionOfLastPart(value, 'N') ?? value
    } else if (key === SPECIAL_KEYS.WEST_EAST) {
      value = toggleDirectionOfLastPart(value, 'W') ?? value
    } else if (isDirection(key)) {
      value = toggleDirectionOfLastPart(value, key) ?? value
    } else if (isNumber(key)) {
      value = value ?? ''
      if (isLastPartNumber(value)) {
        value += key
      }
    }

    display()
    setvalue()
    onInput(self.value)
  }

  let erasetimeout
  let eraseinterval

  const click = (event) => {
    const btn$ = event.target.closest('button')
    if (btn$) {
      if (btn$.hasAttribute('primary')) {
        complete()
      } else {
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
  }

  const unclick = () => {
    clearTimeout(erasetimeout)
    clearInterval(eraseinterval)
  }

  self.setAttribute('tabindex', '0')
  attachControls({
    reset: () => {
      value = undefined
      setvalue()
      display()
    },
  })

  onAttribute('placeholder', (val) => {
    if (val) {
      placeholder = val
      setvalue()
      display()
    }
  })

  observe(self, 'keydown', (event) => {
    if (event.key === 'Enter') {
      complete()
    } else if (event.key === 'Backspace') {
      add(SPECIAL_KEYS.ERASE)
    } else if (isNumber(event.key) || isDirection(event.key) || event.key === ',') {
      add(event.key)
    }
  })

  return html`
    <link rel="stylesheet" href="./client/design/inputs/coord/styles.css" />
    <div id="input"><span ref=${value$}>0</span></div>
    <div id="keypad-wrapper">
      <div class="dots" left></div>
      <div id="keypad" onpointerdown=${click} onpointerup=${unclick}>
        <button>1</button><button>2</button><button>3</button> <button>4</button><button>5</button><button>6</button>
        <button>7</button><button>8</button><button>9</button>
        <button ref=${nsswitch$} cmd style="padding: 0 calc((var(--btn-size) - 1em) / 2)">
          ${SPECIAL_KEYS.NORTH_SOUTH}
        </button>
        <button>0</button>
        <button ref=${weswitch$} cmd>${SPECIAL_KEYS.WEST_EAST}</button>

        <button cmd>${SPECIAL_KEYS.ERASE}</button>
        <button primary>
          <slot name="complete-button">GO</slot>
        </button>
        <button sym>,</button>
      </div>
      <div class="dots" right></div>
    </div>
  `
})
