import { define, useDispatch, currentNode, on, onAttribute } from 'minicomp'
import { html, ref } from 'rehtm'

import './toast.js'
import { getSuggestion } from './backend.js'

define('suggest-bid-content-btn', () => {
  const suggest = useDispatch('suggest')
  const host = currentNode()
  const toast = ref()
  let url = ''

  host.setAttribute('title', '[try to] autofill by looking up the link and related content.')
  onAttribute('url', (u) => u && (url = u))

  on('click', async () => {
    if (!host.hasAttribute('loading') && !host.hasAttribute('disabled') && url && url.trim() !== '') {
      host.setAttribute('loading', 'true')
      toast.current.controls.open()

      try {
        const suggestion = await getSuggestion(url)
        toast.current.controls.succeed()
        suggest(suggestion)
      } catch (err) {
        console.error(err)
        toast.current.controls.fail()
      } finally {
        host.setAttribute('disabled', '')
        host.removeAttribute('loading')
      }
    }
  })

  return html`
    <style>
      @keyframes flimsy {
        from {
          filter: blur(1px) contrast(2);
          -webkit-filter: blur(1px) contrast(2);
        }
        to {
          filter: blur(2px) contrast(2);
          -webkit-filter: blur(2px) contrast(2);
        }
      }

      @keyframes wave {
        0% {
          background-position: 0% 50%;
          background-size: 200% 200%;
          transform: scale(1.05);
        }
        25% {
          background-position: 50% 100%;
          background-size: 75% 120%;
          transform: translateX(0px) translateY(0.5px);
        }
        50% {
          background-position: 100% 50%;
          background-size: 200% 300%;
          transform: scale(0.95) translateX(1px) translateY(-0.5px);
        }
        75% {
          background-position: 50% 0%;
          background-size: 120% 75%;
          transform: translateX(0.5px) translateY(-0.5px);
        }
        100% {
          background-position: 0% 50%;
          background-size: 200% 200%;
          transform: scale(1.05);
          transform: translateX(-0.5px) translateY(0px);
        }
      }

      :host {
        position: relative;
        cursor: pointer;
        width: 42px;
        height: 42px;
        display: inline-block;
        background: #ffffff11;
        border-radius: 6px;

        opacity: 1;
        transition:
          opacity 0.15s,
          background 0.3s;
      }

      :host(:hover) {
        background: #ffffff24;
      }

      :host([disabled]) {
        opacity: 0.25;
        filter: saturate(0);
        -webkit-filter: saturate(0);
      }
      :host([loading]) {
        background: #ffffff00;
        animation: flimsy 1s alternate infinite;
      }

      span {
        display: block;
        width: 100%;
        height: 100%;
        mask: url('/client/assets/icons/bolt-dark-fill.svg') center / 36px no-repeat;
        -webkit-mask: url('/client/assets/icons/bolt-dark-fill.svg') center / 36px no-repeat;
        background:
          radial-gradient(circle at 30% 30%, var(--smart-ter), transparent 40%),
          radial-gradient(circle at 70% 60%, var(--smart-inv), transparent 40%),
          radial-gradient(circle at 50% 80%, var(--smart-prim), transparent 40%),
          linear-gradient(120deg, var(--smart-inv), var(--smart-quat), var(--smart-prim));
        background-size: 200% 200%;
        animation: wave 10s ease-in-out alternate infinite;
        transition: transform 0.3s;
      }
    </style>
    <span></span>
    <suggest-bid-content-toast ref=${toast}></suggest-bid-content-toast>
  `
})
