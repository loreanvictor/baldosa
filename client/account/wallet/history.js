import { attachControls } from 'minicomp'
import { ref, html } from 'rehtm'

import { waitForOne } from '../../util/wait-for-one.js'
import { singleton } from '../../util/singleton.js'
import { midtrim } from '../../util/format.js'
import '../../util/keyed-list.js'

import '../../design/overlays/modal/component.js'
import '../../design/display/icon/component.js'

import * as service from './index.js'
import { modal as rescindmodal } from './rescind.js'


export const modal = singleton('wallet-history-modal', () => {
  const modal = ref()
  const list = ref()
  const note = ref()
  const notext = ref()
  const rescindbtn = ref()
  let balance
  let selected

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
      return `from ${midtrim(tx.sender ?? tx.sender_sys, 10, 6)}`
    } else {
      return `to ${midtrim(tx.receiver ?? tx.receiver_sys, 10, 6)}`
    }
  }

  const highlight = tx => {
    selected = tx
    const highlighted = !!list.current.querySelector(`.tx[key="${tx.id}"].sel`)
    list.current.querySelectorAll('.tx.sel, .tx.hl').forEach(el => el.classList.remove('sel', 'hl'))

    if (!highlighted) {
      list.current.querySelector(`.tx[key="${tx.id}"]`)?.classList.add('sel')
      list.current.querySelector(`.tx[key="${tx.consumes}"]`)?.classList.add('hl')
      list.current.querySelector(`.tx[key="${tx.merges}"]`)?.classList.add('hl')
    }

    if (!highlighted && !!tx.note) {
      notext.current.textContent = 'Note: ' + tx.note
      note.current.classList.add('visible')

      if (!tx.consumed && !tx.merged && !tx.is_state && tx.meta.type === 'outgoing') {
        rescindbtn.current.style = 'display: block'
      } else {
        rescindbtn.current.style = 'display: none'
      }
    } else {
      note.current.classList.remove('visible')
    }
  }

  const rescind = async () => {
    rescindmodal().controls.open(selected)
    await waitForOne(rescindmodal(), 'close')

    const txs = await service.history()
    list.current.controls.init(txs)
    selected = txs.find(tx => tx.id === selected.id) || null;
    if (selected) {
      highlight(selected)
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
        display: flex;
        align-items: center;
        justify-content: center;
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

        span {
          display: block;
          flex: 1;
        }

        i-con {
          width: 4ch;
        }
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
      <div class='note' ref=${note}>
        <span ref=${notext}></span>
        <i-con src='arrow-uturn-left' dark thick ref=${rescindbtn} onclick=${rescind}></i-con>
      </div>
    </glas-modal>
  `
})
