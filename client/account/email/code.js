import { attachControls, useDispatch } from 'minicomp'
import { ref, html } from 'rehtm'

import { observe } from '../../util/observe.js'
import { singleton } from '../../util/singleton.js'


const SPECIAL_KEYS = { ERASE: '⌫', RESET: '↺' }
const MAX_ATTEMPTS = 5

export const modal = singleton('email-code-modal', () => {
  const modal = ref()
  const complete = useDispatch('complete')
  const close = useDispatch('close')
  const codisplay = ref()
  const count = ref()
  let code = ''
  let attempts = 0

  attachControls({
    open: () => (attempts = 0, showcount(), modal.current.controls.open()),
    close: () => modal.current.controls.close(),
    invalidate: () => (codisplay.current.classList.add('error'), attempts++, showcount()),
  })

  const display = () => {
    codisplay.current.classList.remove('error')
    for (let i = 0; i < 6; i++) {
      const empty = i >= code.length
      const span = codisplay.current.children[i]
      span.textContent = empty ? '✱' : code[i]
      span.classList.toggle('filled', !empty)
    }
  }

  const showcount = () => {
    const remaining = MAX_ATTEMPTS - attempts
    count.current.textContent = remaining > 1 ? `${remaining} attempts remaining` : 'Last attempt'
  }

  const add = key => {
    if (key === SPECIAL_KEYS.ERASE) {
      code = code.slice(0, -1)
      display()
    } else if (code.length < 6) {
      code += key
      display()
    }

    if (code.length === 6) {
      complete(code)
    }
  }

  const click = event => event.target.closest('button') && add(event.target.textContent)
  observe(document, 'keydown', event => {
    if (event.key === 'Backspace') {
      add(SPECIAL_KEYS.ERASE)
    } else if (event.key.match(/[0-9]/) && code.length < 6) {
      add(event.key)
    }
  })

  return html`
    <style>
      p {
        text-align: center;
        font-weight: 100;
        opacity: .5;
        font-size: 1.5rem;
      }

      small {
        text-align: center;
        display: block;
        margin-top: -2ex;
        opacity: .35;
      }

      #code {
        display: flex;
        flex-direction: row;
        gap: 2ch;
        justify-content: center;
        font-size: 2rem;
        font-family: monospace;
        margin: 4ex 0;

        span {
          color: #424242;
          transition: color .3s, transform .3s;
          &.filled { color: #F2EAD3; transform: scale(1.5) }
        }

        &.error {
          animation: error .3s;
          span { color: var(--red-fg, red); }
        }
      }

      @keyframes error {
        0% { transform: translateX(-.35ch); }
        20% { transform: translateX(.35ch); }
        40% { transform: translateX(-.35ch); }
        60% { transform: translateX(.35ch); }
        80% { transform: translateX(-.35ch); }
        100% { transform: translateX(0); }
      }

      #keypad {
        display: grid;
        grid-template-rows: repeat(4, 1fr);
        grid-template-columns: repeat(3, 1fr);
        gap: 1ch;

        button {
          background: #31313144;
          border: none;
          color: #ffffff;
          padding: 8px;
          outline: none;
          border-radius: 5px;
          height: calc(min(100vw, 512px)  / 6);
          font-size: 1.1rem;
          cursor: pointer;
          transition: background .15s;
          &:hover { background: #31313166; }
        }
      }
    </style>
    <glass-modal ref=${modal} noheader onclose=${close}>
      <p>Enter the emailed code</p>
      <small ref=${count}></small>
      <div id='code' ref=${codisplay}>
        <span>✱</span><span>✱</span><span>✱</span>
        <span>✱</span><span>✱</span><span>✱</span>
      </div>
      <div id='keypad' onpointerdown=${click}>
        <button>1</button><button>2</button><button>3</button>
        <button>4</button><button>5</button><button>6</button>
        <button>7</button><button>8</button><button>9</button>
        <button>${SPECIAL_KEYS.ERASE}</button><button>0</button>
      </div>
    </glass-modal>
  `
})
