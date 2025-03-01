import { parse } from 'https://esm.sh/envfile'
import { define, attachControls } from 'https://esm.sh/minicomp'
import { ref, html } from 'https://esm.sh/rehtm'

import '../design/glass-modal.js'
import '../design/buttons.js'


let devModeAlert = false

export const isDevMode = () => {
  const devMode = localStorage.getItem('--dev-mode') === 'true'

  if (devMode && !devModeAlert) {
    devModeAlert = true
    console.log('%c-= BALDOSA DEV MODE =-', 'color: #EFA73E; font-weight: bold; font-size: 1.1rem')
    console.log('run %csetDevMode%c(%cfalse%c) %cin the console to disable dev mode',
        'color: #9e9e9e', 'color: #48A1D8', 'color: #EFA73E', 'color: #48A1D8', 'color: inherit'
    )

    const $ind = document.querySelector('dev-mode-indicator')
    $ind.style.display = 'block'
    setTimeout(() => $ind.style.transition = 'opacity 1s', 10)
    setTimeout(() => $ind.style.opacity = 1, 20)
  }

  return devMode
}

export const setDevMode = (value, reload = true) => {
  localStorage.setItem('--dev-mode', value)
  reload && window.location.reload()
}

export const loadDevEnv = async () => {
  const response = await fetch('/.env')
  if (!response.ok) {
    console.warn('no .env file found')
    return {}
  }

  const text = await response.text()
  const env = parse(text)

  document.querySelector('dev-mode-indicator')?.controls?.setEnv(env)

  console.log('loaded dev env:')
  Object.entries(env).forEach(([key, value]) => {
    console.log(`%c${key}: %c${value}`, 'color: #447ED3; font-weight: bold', 'color: #48A1D8')
  })

  return env
}


define('dev-mode-indicator', () => {
  const modal = ref()
  const env = ref()

  attachControls({
    setEnv: vars => {
      env.current.innerHTML = Object.entries(vars).map(([key, value]) =>
        `<li><label>${key}</label> = ${value}</li>`
      ).join('')
    }
  })

  return html`
    <style>
    :host {
      display: none;
      opacity: 0;
    } 
    glass-pane {
      position: fixed;
      top: 0px;
      left: 0px;
      padding: 0.5ch 2ch;
      border-bottom-right-radius: 12px;
      font-size: 0.8rem;
      font-weight: bold;
      cursor: pointer;
    }
    code {
      padding: .5ch;
      border-radius: .5ch;
      margin: .5ch;
      [fn] { color: #9e9e9e; }
      [par] { color: #48A1D8; }
      [val] { color: #EFA73E; }
    }
    ul {
      list-style: none;
      padding: 1ch;
      margin: 0;

      li {
        color: #48A1D8;
        label {
          color: #447ED3;
          font-weight: bold;
        }
      }
    }
    </style>
    <glass-pane onclick=${() => modal.current.controls.open()}>
      dev mode
    </glass-pane>
    <glass-modal ref=${modal}>
      <span slot="title">Developer Mode</span>
      <div>
        <p>
          Developer mode is enabled. You can disable it by running
          <code><span fn>setDevMode</span><span par>(</span><span val>false</span><span par>)</span></code>
          in the console.
        </p>
        <p>
          Defined dev env:
          <ul ref=${env}>
          </ul>
        </p>
        <primary-button onclick=${() => setDevMode(false)}>Turn Off Dev Mode</primary-button>
      </div>
    </glass-modal>
  `
})