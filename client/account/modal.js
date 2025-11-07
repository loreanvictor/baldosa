import { onConnected, attachControls } from 'minicomp'
import { ref, html } from 'rehtm'

import '../design/overlays/modal/component.js'
import '../design/buttons/button/components.js'
import '../design/display/icon/component.js'

import { onBroadcast } from '../util/broadcast.js'
import { singleton } from '../util/singleton.js'
import { modal as uc } from '../util/under-construction.js'
import { init, login, register, logout, user } from './auth/index.js'
import { authenticate as emaillogin } from './email/index.js'
import { modal as wallet } from './wallet/modal.js'
import { modal as tiles } from './tiles/modal.js'
import { modal as bids } from './bids/modal.js'
import { modal as settings } from './settings/modal.js'
import { modal as terms } from './terms.js'
import { modal as about } from './about.js'



export const modal = singleton('account-modal', () => {
  init()

  const modal = ref()
  const userinfo = ref()
  const loggedout = ref()
  const loggedin = ref()

  const update = () => {
    if (user()) {
      loggedout.current.style.display = 'none'
      loggedin.current.style.display = ''
      userinfo.current.style.display = ''
      userinfo.current.querySelector('p').textContent = user().name ?? 'Anonymous User'
      userinfo.current.querySelector('small').textContent = user().email
    } else {
      loggedout.current.style.display = ''
      loggedin.current.style.display = 'none'
      userinfo.current.style.display = 'none'
      userinfo.current.querySelector('p').textContent = ''
      userinfo.current.querySelector('small').textContent = ''
    }
  }

  onConnected(update)
  onBroadcast('account:login', update)
  onBroadcast('account:logout', update)
  onBroadcast('tile:goto', () => modal.current.controls.close())

  attachControls({ open: () => modal.current.controls.open() })

  return html`
    <style>
      .userinfo {
        color: #9e9e9e;
        margin-bottom: 2ch;

        p {
          font-weight: 100;
          font-size: 1.4rem;
          margin-bottom: 0;
        }
      }
    </style>
    <glass-modal ref=${modal} aside>
      <span slot='title'>Account</span>
      <div ref=${userinfo} class='userinfo'>
        <p></p><small></small>
      </div>
      <action-list ref=${loggedin} island>
        <secondary-button row onclick=${() => wallet().controls.open()}>
          <i-con src='coin' dark thick slot='icon'></i-con>
          Wallet
        </secondary-button>
        <secondary-button row onclick=${() => bids().controls.open()}>
          <i-con src='bid' dark thick slot='icon'></i-con>
          Bids
        </secondary-button>
        <secondary-button row onclick=${() => tiles().controls.open()}>
          <i-con src='four-squares' dark thick slot='icon'></i-con>
          Tiles
        </secondary-button>
        <secondary-button row onclick=${() => settings().controls.open()}>
          <i-con src='gear' dark thick slot='icon'></i-con>
          Settings
        </secondary-button>
        <secondary-button row onclick=${() => logout()}>
          <i-con src='circle-arrow' dark thick slot='icon'></i-con>
          Logout
        </secondary-button>
      </action-list>
      <action-list ref=${loggedout} island>
        <primary-button row onclick=${() => login()}>
          <i-con src='key' dark thick slot='icon'></i-con>
          Login
        </primary-button>
        <secondary-button row onclick=${() => register()}>
          <i-con src='person-plus' dark thick slot='icon'></i-con>
          Create New Account
        </secondary-button>
        <secondary-button row onclick=${() => emaillogin()}>
          <i-con src='envelop' dark thick slot='icon'></i-con>
          Sign in with Email
        </secondary-button>
      </action-list>
      <br/>
      <action-list island>
        <secondary-button row faded onclick=${() => about().controls.open()}>
          <i-con src='baldosa' dark fill slot='icon'></i-con>
          About Baldosa
        </secondary-button>
        <secondary-button row faded onclick=${() => terms().controls.open()}>
          <i-con src='scroll' dark thick slot='icon'></i-con>
          Terms and Conditions
        </secondary-button>
      </action-list>
      <br/>
      <small style='text-align: right; opacity: .35; display: block'>
        © 2024 - 2025 Baldosa. All rights reserved.
      </small>
    </glass-modal>
  `
})
