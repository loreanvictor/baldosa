import { define, useDispatch, currentNode, onAttribute, attachControls } from 'minicomp'
import { ref, html } from 'rehtm'

import { fromNSEW } from '../../../util/nsew.js'
import { observe } from '../../../util/observe.js'

const SPECIAL_KEYS = { ERASE: 'DEL', RESET: 'CLR' }

define('coord-input', () => {
  const self = currentNode()
  const onInput = useDispatch('input')
  const onComplete = useDispatch('complete')

  const value$ = ref()
  const switch$ = ref()

  let placeholder
  let value

  const display = () => {
    value$.current.textContent = value ?? placeholder
    value$.current.classList.toggle('placeholder', value === undefined)

    if (value) {
      const parts = value.split(',').map((p) => p.toUpperCase().trim())
      const last = parts[parts.length - 1]

      if (last.endsWith('N')) {
        switch$.current.textContent = 'S'
      } else if (last.endsWith('S')) {
        switch$.current.textContent = 'N'
      } else if (last.endsWith('W')) {
        switch$.current.textContent = 'E'
      } else if (last.endsWith('E')) {
        switch$.current.textContent = 'W'
      } else {
        if (parts.some((p) => p.endsWith('N') || p.endsWith('S'))) {
          switch$.current.textContent = 'W'
        } else {
          switch$.current.textContent = 'N'
        }
      }
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
        value = value.slice(0, -1)
        if (value === '') {
          value = undefined
        }
      }
    } else if (key === SPECIAL_KEYS.RESET) {
      value = undefined
    } else if (key === ',') {
      if (value && (value.endsWith('N') || value.endsWith('S') || value.endsWith('E') || value.endsWith('W'))) {
        value += ', '
      }
    } else if (/^[NSEW]$/i.test(key)) {
      if (value) {
        const parts = value.split(',').map((p) => p.toUpperCase().trim())
        const last = parts[parts.length - 1]
        if (last.endsWith('N')) {
          value = value.slice(0, -1) + 'S'
        } else if (last.endsWith('S')) {
          value = value.slice(0, -1) + 'N'
        } else if (last.endsWith('W')) {
          value = value.slice(0, -1) + 'E'
        } else if (last.endsWith('E')) {
          value = value.slice(0, -1) + 'W'
        } else if (/^[0-9]$/.test(last[last.length - 1])) {
          value += key.toUpperCase()
        }
      }
    } else if (/^[0-9]$/.test(key)) {
      value = value ?? ''
      const last = value[value.length - 1]
      if (last === undefined || /^[0-9]$/.test(last) || value.endsWith(', ')) {
        value = value + key
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
    } else if (event.key.match(/[0-9]/) || event.key === ',') {
      add(event.key)
    } else if (/^[NSEW]$/i.test(event.key)) {
      add(event.key.toUpperCase())
    }
  })

  return html`
    <link rel="stylesheet" href="./client/design/inputs/coord/styles.css" />
    <div id="input"><span ref=${value$}>0</span></div>
    <div id="keypad" onpointerdown=${click} onpointerup=${unclick}>
      <button>1</button><button>2</button><button>3</button> <button>4</button><button>5</button><button>6</button>
      <button>7</button><button>8</button><button>9</button> <button ref=${switch$}>N</button><button>0</button
      ><button sym>,</button>

      <button cmd>${SPECIAL_KEYS.ERASE}</button>
      <button primary>
        <slot name="complete-button">GO</slot>
      </button>
      <button cmd>${SPECIAL_KEYS.RESET}</button>
    </div>
  `
})
