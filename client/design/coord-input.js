import { define, useDispatch, currentNode, onAttribute } from 'https://esm.sh/minicomp'
import { ref, html } from 'https://esm.sh/rehtm'

import { observe } from '../util/observe.js'


define('coord-input', () => {
  const self = currentNode()
  const onInput = useDispatch('input')
  const onComplete = useDispatch('complete')
  const input = ref()

  const parse = str => {
    const [x, y] = str.split(',')
    return { x: parseInt(x.trim()), y: y ? parseInt(y.trim()) : NaN }
  }

  const format = str => (str ?? '').split(',')
    .slice(0, 2)
    .map(s => s.trim())
    .join(' , ')

  onAttribute('value', (val) => {
    const clean = format(val)
    input.current.textContent = clean
    self.value = parse(clean)
  })

  const add = (key) => {
    const current = input.current.textContent.trim()
    const last = current[current.length - 1]
    let next = current

    if (key === '⌫') {
      next = current.slice(0, -1)
    } else if (key === ',') {
      if (!current.includes(',')) {
        next += ' ' + key
      }
    } else if (key === '-') {
      if (last === '-') {
        next = current.slice(0, -1)
      } else if (!last) {
        next += key
      } else if (last === ',') {
        next += ' ' + key
      }
    } else if (last === ',') {
      next += ' ' + key
    } else if (key === '⏻') {
      next = ''
    } else {
      next += key
    }

    self.value = parse(next)
    input.current.textContent = next
    onInput(self.value)
  }

  const click = event => {
    if (event.target.tagName === 'BUTTON') {
      add(event.target.textContent)
    }
  }

  const keypress = event => {
    if (event.key === 'Enter') {
      onComplete(self.value)
    } else if (event.key === 'Backspace') {
      add('⌫')
    } else if (event.key.match(/[0-9]/) || event.key === '-' || event.key === ',') {
      add(event.key)
    }
  }

  observe(self, 'keydown', keypress)
  self.setAttribute('tabindex', '0')

  return html`
    <style>
      :host {
        outline: none;
      }

      #input {
        display: block;
        width: 100%;
        border: none;
        background: none;
        outline: none;
        font-size: 1.8rem;
        font-weight: bold;
        text-align: center;
        height: 2ch;
        color: white;
      }

      #keypad {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 4px;
        margin: 2ch 0;
        outline: none;

        button {
          background: #42424288;
          border: none;
          color: #ffffff44;
          padding: 8px;
          outline: none;
          border-radius: 5px;
          height: calc(min(100vw, 512px)  / 6);
          font-size: 1.2rem;
          font-weight: bold;
          cursor: pointer;
        }
      }
    </style>
    <span id="input" ref=${input}></span>
    <div id="keypad" onclick=${click}>
      <button>1</button><button>2</button><button>3</button>
      <button>4</button><button>5</button><button>6</button>
      <button>7</button><button>8</button><button>9</button>
      <button>-</button><button>0</button><button>,</button>
      <button>⌫</button><button></button><button>⏻</button>
    </div>
  `
})
