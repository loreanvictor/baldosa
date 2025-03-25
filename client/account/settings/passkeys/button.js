import { define, useDispatch } from 'minicomp'
import { ref, html } from 'rehtm'

import '../../../design/button/components.js'
import '../../../design/misc/icon/component.js'
import '../../../design/glass/toast/component.js'

import { add } from './index.js'


define('add-passkey-button', ({ row }) => {
  const toast = ref()

  const _doadd = async () => {
    await add()
    toast.current.controls.open()
  }

  return html`
    <secondary-button row=${row} onclick=${_doadd}>
      <i-con src='key' dark thick slot='icon'></i-con>
      Add Passkey for this Browser
    </secondary-button>
    <glass-toast ref=${toast}>Passkey Added!</glass-toast>
  `
})
