import { parse } from 'https://esm.sh/envfile'
import { define } from 'https://esm.sh/minicomp'


let devModeAlert = false

export const isDevMode = () => {
  const devMode = localStorage.getItem('--dev-mode') === 'true'

  if (devMode && !devModeAlert) {
    devModeAlert = true
    console.log('%cBALDOSA DEV MODE IS ON', 'color: #EFA73E; font-weight: bold; font-size: 1.1rem')
    console.log('run %csetDevMode(false)', 'background: black; padding: .5rem; border-radius: 3px',
                'to disable dev mode.')

    const $ind = document.querySelector('dev-mode-indicator')
    $ind.style.display = 'block'
    setTimeout(() => $ind.style.transition = 'opacity 1s', 10)
    setTimeout(() => $ind.style.opacity = 1, 20)
  }

  return devMode
}

export const setDevMode = (value) => {
  localStorage.setItem('--dev-mode', value)
  window.location.reload()
}

export const loadDevEnv = async () => {
  const envfile = await fetch('/.env')
  const text = await envfile.text()
  const env = parse(text)

  console.log('loaded dev env:')
  Object.entries(env).forEach(([key, value]) => {
    console.log(`%c${key}: %c${value}`, 'color: #447ED3; font-weight: bold', 'color: #48A1D8')
  })

  return env
}


define('dev-mode-indicator', () => {
  return `
    <style>
    :host {
      display: none;
      opacity: 0;
    } 
    glass-pane {
      position: fixed;
      bottom: 0px;
      left: 0px;
      padding: 1ch;
      border-top-right-radius: 12px;
      font-size: 0.8rem;
    }
    </style>
    <glass-pane>
      <span>developer mode</span>
    </glass-pane>
  `
})