import { attachControls } from 'minicomp';
import { html, ref } from 'rehtm';

import { observe } from '../../util/observe.js'
import { singleton } from '../../util/singleton.js';


export const waitoverlay = singleton('wait-overlay', () => {
  const dialog = ref()
  const label = ref()

  attachControls({
    open: (msg) => {
      label.current.textContent = msg ?? 'please wait ...'
      dialog.current.showModal()
    },
    close: () => {
      dialog.current.classList.add('closing')
      setTimeout(() => {
        dialog.current.close()
        dialog.current.classList.add('closing')
      }, 300)
    },
  })

  observe(dialog, 'cancel', e => e.preventDefault())

  return html`
    <style>
      dialog {
        background: none;
        border: none;
        color: inherit;
        text-align: center;
        transition: opacity .3s;
        font-size: 1.3rem;
        line-height: 2rem;
        font-weight: 100;

        &::backdrop {
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          animation: show-dialog-backdrop .5s;
          transition: opacity .3s, backdrop-filter .3s, -webkit-backdrop-filter .3s;
        }

        &.closing {
          opacity: 0;
        }

        &.closing::backdrop {
          opacity: 0;
          backdrop-filter: blur(0);
          -webkit-backdrop-filter: blur(0);
        }

        #logo {
          --size: 12px;
          width: calc(6 * var(--size));
          height: calc(6 * var(--size));
          position: relative; display: inline-block;
          span {
            position: absolute; display: block;
            width: var(--size); height: var(--size);
            background: white;
            left: calc(var(--x, 0) * var(--size));
            top: calc(var(--y, 0) * var(--size));
            border-radius: calc(var(--size) / 5);
            animation: logo-fade 1.45s infinite;
            animation-delay: calc((var(--i, 0) - 9) * .15s);
          }
          span:nth-child(1) { --x: 0; --y: 5; --i: 0; }
          span:nth-child(2) { --x: 1; --y: 4; --i: 1; }
          span:nth-child(3) { --x: 2; --y: 5; --i: 2; }
          span:nth-child(4) { --x: 4; --y: 5; --i: 3; }
          span:nth-child(5) { --x: 5; --y: 4; --i: 4; }
          span:nth-child(6) { --x: 4; --y: 3; --i: 5; }
          span:nth-child(7) { --x: 2; --y: 3; --i: 6; }
          span:nth-child(8) { --x: 1; --y: 2; --i: 7; }
          span:nth-child(9) { --x: 1; --y: 0; --i: 8; }
        }
      }

      @keyframes logo-fade {
        0% { transform: scale(0); }
        20% { transform: scale(1); }
        80% { transform: scale(1); }
        100% { transform: scale(0); }
      }

      @keyframes show-dialog-backdrop {
        0% {
          opacity: 0;
          backdrop-filter: blur(0);
          -webkit-backdrop-filter: blur(0);
        }

        100% {
          opacity: 1;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
      }
    </style>
    <dialog ref=${dialog}>
      <span ref=${label}>Please Wait!</span><br/>
      <small>Please wait ...</small>
      <br/><br/>
      <div id='logo'>
        <span></span><span></span>
        <span></span><span></span>
        <span></span><span></span>
        <span></span><span></span>
        <span></span>
      </div>
    </dialog>
  `
})
