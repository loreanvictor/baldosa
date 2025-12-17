import { define, useDispatch, currentNode, on, onAttribute } from 'minicomp'
import { html, ref } from 'rehtm'

import '../../../design/overlays/toast/component.js'
import '../../../design/display/icon/component.js'

import './toast.js'
import { getSuggestion } from './backend.js'

define('suggest-bid-content-btn', () => {
  const suggest = useDispatch('suggest')
  const host = currentNode()
  const toast = ref()
  let url = ''

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
        host.setAttribute('disabled', '')
        toast.current.controls.fail()
      } finally {
        host.removeAttribute('loading')
      }
    }
  })

  return html`
    <style>
      @keyframes flimsy {
        from {
          filter: blur(0px);
          -webkit-filter: blur(0px);
        }
        to {
          filter: blur(4px);
          -webkit-filter: blur(4px);
        }
      }

      :host {
        position: relative;
        cursor: pointer;
        width: 36px;
        display: inline-block;
        opacity: 0.5;

        transition: opacity 0.15s;
      }

      :host(:hover) {
        opacity: 1;
      }

      :host([disabled]) {
        opacity: 0.25;
      }

      i-con {
        width: 36px;
        transition: opacity 0.15s;

        &:last-of-type {
          position: absolute;
          opacity: 0;
          left: 0;
          top: 0;
        }
      }

      :host([loading]) {
        opacity: 1;
        i-con:last-of-type {
          opacity: 1;
          animation: flimsy 1s alternate infinite;
        }
      }
    </style>
    <i-con src="magic" dark thick></i-con>
    <i-con src="magic" dark fill></i-con>
    <suggest-bid-content-toast ref=${toast}></suggest-bid-content-toast>
  `
})
