import { define, onConnected } from 'minicomp'
import { ref, html } from 'rehtm'

import { onBroadcast } from '../../../util/broadcast.js'
import { modal as uc } from '../../../util/under-construction.js'
import '../../../util/keyed-list.js'

import '../../../design/overlays/modal/component.js'
import '../../../design/buttons/button/components.js'
import '../../../design/layout/swipe-card/component.js'
import '../../../design/display/icon/component.js'

import { all, remove } from './index.js'


define('passkey-list', () => {
  const list = ref()
  const opts = ref()

  const removeKey = async (key) => {
    opts.current.controls.close()
    await remove(key)
    await list.current.controls.collapse(key.id)
  }

  const load = async () => {
    const keys = await all()
    list.current.controls.init(keys)
  }

  onConnected(load)
  onBroadcast('account:login', load)
  onBroadcast('passkey:added', passkey => list.current.controls.add(passkey))

  let selected
  const select = (key, anchor) => {
    selected = key
    opts.current.controls.open({ anchor })
  }

  const viewlogs = key => {
    // TODO: implement passkey usage logs
    uc().controls.open()
  }

  return html`
    <style>
      swipe-card {
        i-con[slot=image] {
          width: 70%;
          margin: 15%;
          --color: var(--blue-fg);
        }
        small { opacity: .35 }
        [slot=left], [slot=right] {
          display: flex;
          align-items: center;
          i-con { width: 32px; }
        }
        [slot=left] {
          color: var(--red-fg, red);
          --color: var(--red-fg, red);
        }
        [slot=left] i-con { margin-left: 1ch }
        [slot=right] i-con {margin-right: 1ch }
      }
    </style>
    <keyed-list ref=${list} each=${key => {
      const date = new Date(key.created_at)

      return html`
        <swipe-card key=${key.id} left="sticky" right="sticky"
          onswipeleft=${() => removeKey(key)}
          onswiperight=${() => viewlogs(key)}>
          <i-con src='key' dark fill slot='image'></i-con>
          ${key.key_name}
          <br/>
          <small>${date.toDateString()} ${date.toLocaleTimeString()}</small>
          <div slot='actions'>
            <secondary-button onclick=${(event) => select(key, event.target.closest('secondary-button'))}>
              <i-con src='ellipsis' dark thick slot='icon' style='opacity: .35'></i-con>
            </secondary-button>
          </div>
          <div slot='left'>Delete <i-con src='trash-can' dark thick></i-con></div>
          <div slot='right'><i-con src='receipt' dark thick></i-con> Usage Logs</div>
        </swipe-card>
      `
    }}>
    </keyed-list>
    <glass-modal ref=${opts} noheader>
      <action-list>
        <secondary-button onclick=${() => removeKey(selected)} row danger>
          Delete Passkey
          <i-con src='trash-can' dark thick slot='icon'></i-con>
        </secondary-button>
        <secondary-button row onclick=${() => viewlogs(selected)}>
          View Usage Logs
          <i-con src='receipt' dark thick slot='icon'></i-con>
        </secondary-button>
        <secondary-button row faded onclick=${() => opts.current.controls.close()}>
          Cancel
        </secondary-button>
      </action-list>
    </glass-modal>
  `
})
