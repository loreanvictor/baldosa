import { define } from 'https://esm.sh/minicomp'
import { html } from 'https://esm.sh/rehtm'

import { composeclass } from '../../util/compose-class.js'


define('primary-button', ({ row = false, warn = false }) => {
  return html`
    <link rel="stylesheet" href="./client/design/button/styles.css" />
    <style>
      button {
        --button-shade-dark: #F2EAD3;
        --button-shade-light: #F5F5F5;
        --button-text-color: #393E46;
        --button-border-color: #F2EAD3;
      }
    </style>
    <button class=${composeclass({ row, warn })}><slot></slot><slot name='icon'></slot></button>
  `
})

define('secondary-button', ({ row = false, warn = false }) => {
  return html`
    <link rel="stylesheet" href="./client/design/button/styles.css" />
    <style>
      button {
        --button-shade-dark: #2E3031;
        --button-shade-light: #303334;
        --button-text-color: #FFF6E0;
        --button-border-color: #272829;
      }
    </style>
    <button class=${composeclass({ row, warn })}><slot></slot><slot name='icon'></slot></button>
  `
})

define('action-list', () => html`
  <link rel="stylesheet" href="./client/design/button/styles.css" />
  <div class="action-list">
    <slot></slot>
  </div>
`)
