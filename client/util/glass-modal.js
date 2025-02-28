import { define, attachControls } from 'https://esm.sh/minicomp'
import { ref, html } from 'https://esm.sh/rehtm'

import { observe } from './observe.js'


define('glass-modal', () => {
  const dialog = ref()
  let opened = false
  let warmup

  const controls = {
    open: () => {
      dialog.current?.showModal()
      clearTimeout(warmup)
      warmup = setTimeout(() => opened = true, 50)
    },
    close: () => {
      dialog.current?.close()
      clearTimeout(warmup)
      opened = false
    },
    isOpen: () => opened,
  }

  attachControls(controls)
  observe(document, 'click', event => {
    if (opened) {
      const rect = dialog.current?.getBoundingClientRect()
      if (!(
        rect &&
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      )) {
        controls.close()
      }
    }
  })

  return html`
    <style>
      dialog {
        animation: grow-in .3s;
        width: 512px;
        background: linear-gradient(180deg, #42424288, #3d3d3d88);
        border-radius: 16px;
        padding: 2ch;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        color: white;
        border: none;
        outline: none;

        &::backdrop {
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          animation: show-dialog-backdrop 3s;
        }

        header {
          display: flex;
          align-items: center;

          h1 {
            margin: 0;
            padding: 0;
            flex-grow: 1;
            font-size: 1.8rem;
            font-weight: 300;
          }

          button {
            background: linear-gradient(180deg, #33333388, #61616188);
            border: 1px solid #424242;
            color: white;
            cursor: pointer;
            outline: none;
            width: 32px;
            height: 32px;
            border-radius: 16px;
            overflow: hidden;
            position: relative;

            &::before, &::after {
              content: '';
              position: absolute;
              top: 50%;
              left: 50%;
              width: 50%;
              height: 2px;
              background: linear-gradient(180deg, #eeeeee, #212121);
              border-radius: 2px;
              transform: translate(-50%, -50%) rotate(45deg); 
            }

            &::after {
              transform: translate(-50%, -50%) rotate(-45deg); 
            }
          }
        }
      }

      @media (max-width: 512px) {
        dialog {
          width: calc(100vw - 5ch);
          animation: come-up .2s;
          bottom: 0;
          top: auto;
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;

          header > button {
            width: 36px;
            height: 36px;
            border-radius: 20px;
          }
        }
      }

      @keyframes show-dialog-backdrop {
          0% {
            opacity: 0;
            backdrop-filter: blur(0);
          }

          10% {
            opacity: 1;
          }

          100% {
            opacity: 1;
            backdrop-filter: blur(5px);
          }
        }

      @keyframes come-up {
        from {
          opacity: 0;
          transform: translateY(5vh);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes grow-in {
        from {
          opacity: 0;
          transform: scale(0.9);
        }

        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    </style>
    <dialog ref=${dialog}>
      <header>
        <h1><slot name="title"></slot></h1>
        <button onclick=${() => controls.close()}></button>
      </header>
      <slot></slot>
    </dialog>
  `
})
