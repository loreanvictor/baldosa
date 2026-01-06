import { define, onAttribute, on, useDispatch, ATTRIBUTE_REMOVED } from 'minicomp'
import { html, ref } from 'rehtm'

import { observe } from '../../../util/observe.js'

import { composeclass } from '../../../util/compose-class.js'

define('primary-button', ({ row = false, danger = false, type = 'button' }) => {
  const btn = ref()
  const clickdirty = useDispatch('clickdirty')

  onAttribute('disabled', (d) =>
    d !== undefined && d !== ATTRIBUTE_REMOVED
      ? btn.current.setAttribute('disabled', '')
      : btn.current.removeAttribute('disabled'),
  )
  on('click', (event) => {
    if (btn.current.disabled) {
      event.preventDefault()
      event.stopPropagation()
    }
  })

  on('pointerdown', (event) => clickdirty(event))

  return html`
    <link rel="stylesheet" href="./client/design/buttons/button/styles.css" />
    <style>
      button {
        --button-shade-dark: #f2ead3;
        --button-shade-light: #f5f5f5;
        --button-text-color: #393e46;
        --button-border-color: #f2ead3;
      }
    </style>
    <button ref=${btn} class=${composeclass({ row, danger })} type=${type}>
      <slot></slot><slot name="icon"></slot>
    </button>
  `
})

define('secondary-button', ({ row = false, danger = false, type = 'button', pressable = false, onpress, key }) => {
  const btn = ref()
  const press = useDispatch('press')

  onAttribute('disabled', (d) =>
    d !== undefined && d !== ATTRIBUTE_REMOVED
      ? btn.current.setAttribute('disabled', '')
      : btn.current.removeAttribute('disabled'),
  )
  on('click', (event) => {
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
            deep: deeppress,
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

    on('pointerdown', (event) => {
      event.preventDefault()
      if (!btn.current.disabled) {
        press()
        triggerAutoPress()
      }
    })

    on('pointerup', (e) => (e.preventDefault(), stopAutoPress()))
    on('pointercancel', (e) => (e.preventDefault(), stopAutoPress()))
    on('pointerleave', (e) => (e.preventDefault(), stopAutoPress()))
    on('contextmenu', (e) => e.preventDefault())

    if (key) {
      observe(document, 'keydown', (event) => {
        if (event.key === key && !event.repeat) {
          event.preventDefault()
          press()
          triggerAutoPress()
        }
      })

      observe(document, 'keyup', (event) => {
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
        --button-shade-dark: #ffffff20;
        --button-shade-light: #ffffff32;
        --button-text-color: #fff6e0;
        --button-border-color: #ffffff11;

        -webkit-touch-callout: none;
        user-select: none;
      }
    </style>
    <button ref=${btn} class=${composeclass({ row, danger })} type=${type}>
      <slot></slot><slot name="icon"></slot>
    </button>
  `
})

define(
  'action-list',
  () => html`
    <link rel="stylesheet" href="./client/design/buttons/button/styles.css" />
    <div class="action-list">
      <slot></slot>
    </div>
  `,
)

define(
  'btn-group',
  () => html`
    <link rel="stylesheet" href="./client/design/buttons/button/styles.css" />
    <div class="btn-group">
      <slot></slot>
    </div>
  `,
)
