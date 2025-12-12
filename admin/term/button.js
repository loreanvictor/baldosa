import { define, useDispatch } from 'minicomp'
import { html } from 'rehtm'

define('t-btn', () => {
  const click = useDispatch('click')

  return html`
    <style>
      button {
        padding: 1ch;
        min-width: 12ch;
        border-radius: 0.75ch;
        cursor: pointer;
        font-family: var(--font);
        background: var(--hl);
        color: var(--bg);
      }
    </style>
    <button onclick=${click}><slot></slot></button>
  `
})

define(
  't-btn-bar',
  () => html`
    <style>
      div {
        text-align: right;
        padding: 2ch 0;
      }
    </style>
    <div><slot></slot></div>
  `,
)
