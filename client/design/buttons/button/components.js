import { define, onAttribute, on, useDispatch, ATTRIBUTE_REMOVED } from 'minicomp'
import { html, ref } from 'rehtm'

import { observe } from '../../../util/observe.js'

import { composeclass } from '../../../util/compose-class.js'


define('primary-button', ({ row = false, danger = false, type = 'button' }) => {
  const btn = ref()
  const clickdirty = useDispatch('clickdirty')

  onAttribute('disabled', d => d !== undefined && d !== ATTRIBUTE_REMOVED ?
    btn.current.setAttribute('disabled', '') : btn.current.removeAttribute('disabled'))
  on('click', event => {
    if (btn.current.disabled) {
      event.preventDefault()
      event.stopPropagation()
    }
  })

  on('pointerdown', event => clickdirty(event))

  return html`
    <link rel="stylesheet" href="./client/design/buttons/button/styles.css" />
    <style>
      button {
        --button-shade-dark: #F2EAD3;
        --button-shade-light: #F5F5F5;
        --button-text-color: #393E46;
        --button-border-color: #F2EAD3;
      }
    </style>
    <button ref=${btn} class=${composeclass({ row, danger })} type=${type}>
      <slot></slot><slot name='icon'></slot>
    </button>
  `
})

define('secondary-button', ({ row = false, danger = false, type = 'button', pressable = false, onpress, key }) => {
  const btn = ref()
  const press = useDispatch('press')

  onAttribute('disabled', d => d !== undefined && d !== ATTRIBUTE_REMOVED ?
    btn.current.setAttribute('disabled', '') : btn.current.removeAttribute('disabled'))
  on('click', event => {
    if (btn.current.disabled) {
      event.preventDefault()
      event.stopPropagation()
    }
  })

  if (pressable || onpress || key) {
    let autopresstimeout
    let autopressinterval
    let deeppresstimeout
    let deeppress = false
  
    const triggerAutoPress = () => {
      stopAutoPress()
      autopresstimeout = setTimeout(() => {
        autopressinterval = setInterval(() => {
          press({
            auto: true,
            deep: deeppress
          })
        }, 100)
        deeppresstimeout = setTimeout(() => {
          deeppress = true
        }, 1000)
      }, 500)
    }
  
    const stopAutoPress = () => {
      clearTimeout(autopresstimeout)
      clearTimeout(deeppresstimeout)
      clearInterval(autopressinterval)
      deeppress = false
    }
  
    on('pointerdown', event => {
      event.preventDefault()
      if (!btn.current.disabled) {
        press()
        triggerAutoPress()
      }
    })
  
    on('pointerup', e => (e.preventDefault(), stopAutoPress()))
    on('pointercancel', e => (e.preventDefault(), stopAutoPress()))
    on('pointerleave', e => (e.preventDefault(), stopAutoPress()))
    on('contextmenu', e => e.preventDefault())

    if (key) {
      observe(document, 'keydown', event => {
        if (event.key === key && !event.repeat) {
          event.preventDefault()
          press()
          triggerAutoPress()
        }
      })

      observe(document, 'keyup', event => {
        if (event.key === key) {
          event.preventDefault()
          stopAutoPress()
        }
      })
    }
  }

  return html`
    <link rel="stylesheet" href="./client/design/buttons/button/styles.css" />
    <style>
      button {
        --button-shade-dark: #393939;
        --button-shade-light: #3f3f3f;
        --button-text-color: #FFF6E0;
        --button-border-color: #3e3e3e;

        -webkit-touch-callout: none;
        user-select: none;
      }
    </style>
    <button ref=${btn} class=${composeclass({ row, danger })} type=${type}>
      <slot></slot><slot name='icon'></slot>
    </button>
  `
})

define('action-list', () => html`
  <link rel="stylesheet" href="./client/design/buttons/button/styles.css" />
  <div class="action-list">
    <slot></slot>
  </div>
`)


define('btn-group', () => html`
  <link rel="stylesheet" href="./client/design/button/styles.css" />
  <div class="btn-group">
    <slot></slot>
  </div>
`)
