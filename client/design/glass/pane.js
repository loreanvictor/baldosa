import { define } from 'minicomp'


define('glass-pane', () => `
  <style>
    :host {
      background: #42424288;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      color: #ffffff88;
    }
  </style>
  <slot></slot>
`)
