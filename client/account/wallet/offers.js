import { define, onConnected } from 'minicomp'
import { html, ref } from 'rehtm'

import { midtrim } from '../../util/format.js'
import '../../util/keyed-list.js'

import '../../design/overlays/modal/component.js'
import '../../design/overlays/toast/component.js'
import '../../design/layout/swipe-card/component.js'
import '../../design/buttons/button/components.js'
import '../../design/display/icon/component.js'
import '../../design/display/textual.js'

import * as service from './index.js'


define('offer-list', () => {
  const list = ref()
  const opts = ref()
  const deets = ref()
  const toast = ref()
  let selected

  onConnected(async () => {
    list.current.controls.init(await service.offers())
  })

  const select = (offer, element) => {
    selected = offer
    opts.current.controls.open({ anchor: element })
  }

  const details = offer => {
    selected = offer
    deets.current.querySelector('h1 span').textContent = `${offer.meta.total}`
    deets.current.querySelector('p label[name=sender]').textContent =
      `from ${midtrim(offer.sender || offer.sender_sys, 10, 6)}`
    deets.current.querySelector('p label[name=note]').textContent = offer.note ? 'Note: ' + offer.note : ''
    deets.current.querySelector('p small').textContent = offer.meta.time.toLocaleString()
    deets.current.controls.open()
  }

  const accept = async offer => {
    await service.accept(offer)
    deets.current.controls.close()
    list.current.controls.collapse(offer.id)
    toast.current.controls.open()
  }

  return html`
    <style>
      swipe-card {
        [slot=image] {
          --color: var(--blue-fg, blue);
        }

        p {
          label {
            font-size: 1.5rem;
            i-con {
              width: 26px;
              opacity: .35;
              margin-left: -6px;
              vertical-align: -2px;
            }
          }
          margin: 0;
          small {
            opacity: .35;
          }
        }

        [slot=left], [slot=right] {
          display: flex;
          align-items: center;
          i-con { width: 32px; }
        }
        [slot=right] {
          color: var(--blue-fg, blue);
          --color: var(--blue-fg, blue);
        }
        [slot=left] i-con { margin-left: 1ch }
        [slot=right] i-con {margin-right: 1ch }
      }

      .details {
        h1 {
          margin: 0;
          span {
            font-size: 3rem;
          }
          i-con {
            vertical-align: -.25rem;
            opacity: .35;
          }
        }
        p {
          margin: 0;
        }
        [name=note] {
          opacity: .75;
        }
        small {
            opacity: .35;
        }
      }
    </style>
    <keyed-list ref=${list} each=${offer => {
      return html`
        <swipe-card key=${offer.id} right="slide"
          onswiperight=${() => accept(offer)}
          onswipeleft=${() => details(offer)}>
          <div slot='image'>
            <i-con src='arrow-right' dark thick></-icon>
          </div>
          <p>
            <label>${offer.meta.total} <i-con src='coin' dark fill></i-con></label><br/>
            <small>from ${trim(offer.sender || offer.sender_sys)}</small>
          </p>
          <div slot='actions'>
            <secondary-button onclick=${(event) => select(offer, event.target.closest('secondary-button'))}>
              <i-con src='ellipsis' dark thick slot='icon' style='opacity: .35'></i-con>
            </secondary-button>
          </div>
          <div slot='left'>Details <i-con src='receipt' dark thick></i-con></div>
          <div slot='right'><i-con src='arrow-right-join' dark thick></i-con> Accept Offer</div>
        </swipe-card>
      `
    }}>
    </keyed-list>
    <glass-modal ref=${opts} noheader>
      <action-list>
        <secondary-button onclick=${() => accept(selected)} row>
          Accept Offer
          <i-con src='arrow-right-join' dark thick slot='icon'></i-con>
        </secondary-button>
        <secondary-button onclick=${() => details(selected)} row>
          View Details
          <i-con src='receipt' dark thick slot='icon'></i-con>
        </secondary-button>
        <secondary-button onclick=${() => opts.current.controls.close()} row faded>
          Cancel
        </secondary-button>
      </action-list>
    </glass-modal>
    <glass-modal ref=${deets} class='details' noheader>
      <div style='overflow: hidden'>
        <h1><span></span><i-con src='coin' dark fill></i-con></h1>
        <p>
          <label name='sender'></label><br/>
          <label name='note'></label><br/>
          <small></small>
        </p>
        <h-r></h-r>
        <primary-button onclick=${() => accept(selected)}>
          Accept Offer
          <i-con src='arrow-right-join' thick slot='icon'></i-con>
        </primary-button>
      </div>
    </glass-modal>
    <glass-toast ref=${toast}>
      Offer successfully accepted!
    </glass-toast>
  `
})
