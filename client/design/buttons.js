import { define, useDispatch } from 'https://esm.sh/minicomp'
import { html } from 'https://esm.sh/rehtm'


define('primary-button', () => {
  const onclick = useDispatch('click')

  return html`
    <style>
      button {
        display: block;
        width: 100%;
        background: linear-gradient(180deg, #1E5FB0, #396EB0);
        color: #DADDFC;
        border: 1px solid #1E5FB0;
        border-radius: 8px;
        font-size: 1.1rem;
        font-weight: regular;
        padding: 4px 8px;
        height: 52px;
        cursor: pointer;
      }
    </style>
    <button onclick=${onclick}><slot></slot></button>
  `
})

define('secondary-button', () => {
  const onclick = useDispatch('click')

  return html`
    <style>
      button {
        display: block;
        width: 100%;
        background: linear-gradient(180deg, #2E3031, #393C3D);
        color: #FFF6E0;
        border: 1px solid #272829;
        border-radius: 8px;
        font-size: 1.1rem;
        font-weight: regular;
        padding: 4px 8px;
        height: 52px;
        cursor: pointer;
      }
    </style>
    <button onclick=${onclick}><slot></slot></button>
  `
})
