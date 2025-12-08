import { define } from 'minicomp'

define(
  'small-hint',
  () => `
  <small style="opacity: .5; display: block; margin: 1ex 0">
  <style>
    ::slotted(i-con) {
      vertical-align: middle;
      width: 2rem;
    }
  </style>
  <slot></slot>
  </small>
  `,
)
define('h-r', () => '<hr style="border: none; height: 1px; background: #424242; margin: 3ex 0"/>')
