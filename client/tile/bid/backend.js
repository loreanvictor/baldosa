import { conf } from '../../config.js'
import { authenticated, authenticatedIfPossible } from '../../account/auth/index.js'

import { backendURL as walletBackendURL } from '../../account/wallet/backend.js'

export const backendURL = () => `${conf('BANK_URL') ?? 'https://bank.baldosa.city'}/bids`

export const info = async (tile) => {
  const res = await fetch(
    `${backendURL()}/${tile.x}:${tile.y}`,
    authenticatedIfPossible({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  )

  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`Error fetching bid info: ${msg}`)
  }

  return await res.json()
}

export const pay = async (tile, amount) => {
  const res = await fetch(
    `${walletBackendURL()}/offer`,
    await authenticated({
      method: 'POST',
      body: JSON.stringify({
        amount,
        receiver_sys: `tile:${tile.x}:${tile.y}`,
        note: 'Bid for tile',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  )

  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`Error paying for tile: ${msg}`)
  }

  return await res.json()
}

export const init = async (tile, transaction) => {
  const res = await fetch(
    `${backendURL()}/${tile.x}:${tile.y}/init`,
    await authenticated({
      method: 'POST',
      body: JSON.stringify(transaction),
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  )

  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`Error initializing bid: ${msg}`)
  }

  return await res.json()
}

export const upload = async (url, fields, image, progress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ url: `${url}/${fields.key}`, key: fields.key })
      } else {
        reject(new Error(`Error uploading file: ${xhr.statusText}`))
      }
    }

    xhr.onerror = () => {
      reject(new Error('Network error while uploading file'))
    }

    progress &&
      (xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && progress) {
          const percentComplete = (event.loaded / event.total) * 100
          progress(percentComplete)
        }
      })

    const formData = new FormData()
    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value)
    }
    formData.append('file', image)

    xhr.open('POST', url, true)
    xhr.send(formData)
  })
}

export const post = async (tile, transaction, content, uploaded) => {
  const res = await fetch(
    `${backendURL()}/${tile.x}:${tile.y}`,
    await authenticated({
      method: 'POST',
      body: JSON.stringify({
        title: content.title,
        subtitle: content.subtitle,
        description: content.description,
        url: content.url,
        image: uploaded.key,
        transaction_id: transaction.id,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  )

  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`Error posting bid: ${msg}`)
  }

  return await res.json()
}
