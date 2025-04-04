import { attachControls } from 'minicomp'
import { ref, html } from 'rehtm'

import { singleton } from '../../util/singleton.js'

import '../../util/keyed-list.js'
import '../../design/glass/modal/component.js'
import '../../design/misc/icon/component.js'

import * as service from './index.js'


const trim = name => name.length > 10 ? `${name.slice(0, 6)}...${name.slice(-4)}` : name


export const modal = singleton('wallet-history-modal', () => {
  const modal = ref()
  const list = ref()
  const note = ref()
  let balance

  attachControls({
    open: async () => {
      modal.current.controls.open()
      const txs = await service.history()
      list.current.controls.init(txs)
    },
  })

  const icon = tx => {
    if (tx.meta.type === 'merged-state') {
      return 'arrow-right-join'
    } else if (tx.meta.type === 'forked-state') {
      return 'arrow-right-fork'
    } else if (tx.meta.type === 'outgoing') {
      return 'arrow-left'
    } else {
      return 'arrow-right'
    }
  }

  const desc = tx => {
    if (tx.is_state) {
      return 'balance'
    } else if (tx.meta.type === 'incoming') {
      return `from ${trim(tx.sender ?? tx.sender_sys)}`
    } else {
      return `to ${trim(tx.receiver ?? tx.receiver_sys)}`
    }
  }

  const highlight = tx => {
    const highlighted = !!list.current.querySelector(`.tx[key="${tx.id}"].sel`)
    list.current.querySelectorAll('.tx.sel, .tx.hl').forEach(el => el.classList.remove('sel', 'hl'))

    if (!highlighted) {
      list.current.querySelector(`.tx[key="${tx.id}"]`)?.classList.add('sel')
      list.current.querySelector(`.tx[key="${tx.consumes}"]`)?.classList.add('hl')
      list.current.querySelector(`.tx[key="${tx.merges}"]`)?.classList.add('hl')
    }

    if (!highlighted && !!tx.note) {
      note.current.textContent = 'Note: ' + tx.note
      note.current.classList.add('visible')
    } else {
      note.current.classList.remove('visible')
    }
  }

  return html`
    <style>
      keyed-list {
        font-family: monospace;
        max-height: 50vh;
        overflow: scroll;
        display: block;
        padding-bottom: 6ch;

        .tx {
          color: #9e9e9e;
          --color: #9e9e9e;
          display: flex;
          font-family: 1rem;
          align-items: center;
          cursor: pointer;
          &:not(:last-child) {
            border-bottom: 1px dashed #616161; 
          }
          padding: 1ch;
          transition: color .2s, background .2s, border-color .2s, border-radius .2s;
          i-con { width: 32px }

          .amount {
            i-con { width: 24px; opacity: 1 }
            display: flex;
            align-items: center;
            justify-content: flex-end;
            width: 7ch;
          }

          .date {
            flex-grow: 1;
            text-align: right;
          }

          &.hl {
            background: #424242;
            border-radius: 8px;
            border-color: #424242;
          }

          &.sel {
            background: #9e9e9e;
            color: #424242;
            --color: #424242;
            border-radius: 8px;
            border-color: #9e9e9e;
          }
        }
      }

      .note {
        opacity: 0;
        display: block;
        position: absolute;
        background: #00000088;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-radius: 8px;
        padding: 2ch;
        font-family: monospace;
        bottom: 2ch;
        left: 1ch;
        right: 1ch;
        transition: opacity .2s;

        &.visible { opacity: 1; }
      }
    </style>
    <glass-modal class="glass-modal" ref=${modal}>
      <span slot='title'>Transaction<br/>History</span>
      <keyed-list ref=${list} each=${tx => 
        html`
          <div key=${tx.id} class='tx' onclick=${() => highlight(tx)}>
            <i-con src=${icon(tx)} dark thick></i-con>
            <div class='amount'>
              ${tx.consumed_value + tx.merged_value}
              <i-con src='coin' dark fill></i-con>
            </div>
            <div class='desc'>${desc(tx)}</div>
            <div class='date'>
              ${tx.meta.time.toLocaleDateString()}<br/>${tx.meta.time.toLocaleTimeString()}
            </div>
          </div>
        `
      }>
      </keyed-list>
      <div class='note' ref=${note}></div>
    </glas-modal>
  `
})
