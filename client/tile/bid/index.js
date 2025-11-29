import { broadcast } from '../../util/broadcast.js'
import { waitoverlay } from '../../design/overlays/wait-overlay.js'
import { balance, history } from '../../account/wallet/index.js'

import { info, pay, init, upload, post } from './backend.js'

import { modal as contentmodal } from './content.js'
import { modal as bidmodal } from './bid.js'
import { modal as successmodal } from './success.js'
import { showHelpIfNeeded } from './help.js'

export const bidOn = async (tile) => {
  contentmodal().controls.open(tile)
  setTimeout(() => showHelpIfNeeded(), 500)
  attachListeners()
}

const payIfNeeded = async (tile, amount) => {
  const txhistory = await history()
  const receiver = `tile:${tile.x}:${tile.y}`

  const candidate = txhistory.find((tx) => tx.receiver_sys === receiver && tx.consumed_value === amount && !tx.consumed)

  // TODO: check if the candidate transaction is not already
  //       earmarked by a bid. generally speaking, if the user
  //       has a pending bid on this tile, we should not be here.

  if (candidate) {
    return candidate
  } else {
    const { offer, rest } = await pay(tile, amount)
    return offer
  }
}

let attached = false
const attachListeners = () => {
  if (attached) return
  attached = true

  contentmodal().addEventListener('submit', async ({ detail }) => {
    const { content, tile } = detail
    const [b, i] = await Promise.all([balance(), info(tile)])
    bidmodal().controls.open(tile, b, i, content)
  })

  bidmodal().addEventListener('submit', async ({ detail }) => {
    const { tile, amount, content, info } = detail

    waitoverlay().controls.open('Issueing Transaction ...')
    const tx = await payIfNeeded(tile, amount)

    waitoverlay().controls.show('Fetching Upload Information ...')
    const { upload_url, upload_fields } = await init(tile, tx)

    waitoverlay().controls.show('Uploading Image ...')
    const uploaded = await upload(upload_url, upload_fields, content.image, (p) =>
      waitoverlay().controls.show(`Uploading Image ... ${Math.round(p)}%`),
    )

    waitoverlay().controls.show('Placing Bid ...')
    const bid = await post(tile, tx, content, uploaded)

    waitoverlay().controls.close()
    contentmodal().controls.clear()
    contentmodal().controls.close()
    bidmodal().controls.close()

    if (!bid.published_at) {
      bid.next_auction = info.next_auction
    }

    const local = { ...bid, content: { ...bid.content, localimg: content.image } }
    broadcast('bid:submitted', local)

    if (bid.published_at) {
      broadcast('tile:published', local)
    }

    successmodal().controls.open(bid)
  })
}
