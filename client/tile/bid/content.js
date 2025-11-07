import { attachControls, useDispatch } from 'minicomp'
import { html, ref } from 'rehtm'

import { singleton } from '../../util/singleton.js'

import '../../design/overlays/modal/component.js'
import '../../design/buttons/button/components.js'
import '../../design/display/textual.js'
import '../../design/inputs/text/component.js'
import '../../design/inputs/text-area/component.js'
import '../../design/display/icon/component.js'
import '../../design/inputs/image/component.js'

import { loadDraft, updateDraft } from './draft.js'
import { showHelp } from './help.js'


export const modal = singleton('bid-content-modal', () => {
  const submit = useDispatch('submit')
  const close = useDispatch('close')

  let tile

  const modal = ref()
  const btn = ref()
  const btnlabel = ref()
  const btnicon = ref()
  const coords = ref()

  const form = ref()
  const image = ref()
  const title = ref()
  const subtitle = ref()
  const url = ref()
  const description = ref()

  const clear = () => {
    title.current?.controls.clear()
    subtitle.current?.controls.clear()
    url.current?.controls.clear()
    description.current?.controls.clear()
    image.current?.controls.clear()
  }

  attachControls({
    open: async (_tile) => {
      tile = _tile
      coords.current.textContent = `Tile ${tile.x}, ${tile.y}`
      modal.current.controls.open()

      const draft = await loadDraft(tile)

      if (draft) {
        draft.image && image.current?.controls.set(draft.image)
        draft.title && title.current?.controls.set(draft.title)
        draft.subtitle && subtitle.current?.controls.set(draft.subtitle)
        draft.url && url.current?.controls.set(draft.url)
        draft.description && description.current?.controls.set(draft.description)
      }
    },
    close: () => modal.current.controls.close(),
    clear,
  })

  const check = () => {
    const valid = image.current?.validity?.valid &&
      title.current?.validity?.valid &&
      subtitle.current?.validity?.valid &&
      url.current?.validity?.valid &&
      description.current?.validity?.valid

    if (!valid) {
      btn.current.setAttribute('disabled', '')
    } else {
      btn.current.removeAttribute('disabled')
    }

    return valid
  }

  const untouch = () => {
    image.current?.controls.untouch()
    title.current?.controls.untouch()
    subtitle.current?.controls.untouch()
    url.current?.controls.untouch()
    description.current?.controls.untouch()
  }

  const input = async (src, detail) => {
    await updateDraft(tile, { [src]: detail })
  }

  const prepAndSubmit = async () => {
    const content = {
      image: await image.current?.controls.export(),
      title: title.current?.value,
      subtitle: subtitle.current?.value,
      url: url.current?.value,
      description: description.current?.value,
    }

    untouch()
    submit({ tile, content })
  }

  const formScrolledToEnd = () => {
    const { scrollTop, scrollHeight, clientHeight } = form.current
    return scrollTop + clientHeight >= scrollHeight - 1
  }

  const scrollOrSubmit = async () => {
    if (formScrolledToEnd() && check()) {
      await prepAndSubmit()
    } else {
      form.current.scrollTo({ top: 1024, behavior: 'smooth' })
    }
  }

  const manageSubmitBtn = () => {
    if (formScrolledToEnd()) {
      btnlabel.current.textContent = 'Bid on'
      btnicon.current.style='transform: rotate(-90deg)'
      coords.current.style.display = 'block'
    } else {
      btnlabel.current.textContent = 'Scroll Down'
      btnicon.current.style=''
      coords.current.style.display = 'none'
    }
  }

  return html`
    <style>
      form {
        padding: 2px;
        max-height: 75dvh;
        overflow-y: auto;
        scrollbar-width: none;
      }

      [role=group] {
        display: flex;
        gap: 1ch;
        primary-button {
          flex: 1;
        }
      }

      small {
        font-size: 0.8em;
        opacity: .5;
        /* margin: 1ch 0; */
        margin-top: 2ch;
        margin-bottom: -1ch;
        display: block;
        text-align: right;
      }

      i-con {
        transition: transform 0.2s ease-in-out;
      }
    </style>
    <glass-modal ref=${modal} onclose=${() => (untouch(), close())}>
      <span slot='title'>Bid on Tile</span>
      <form ref=${form} onscroll=${manageSubmitBtn}>
        <small-hint onclick=${showHelp}>
          Choose what you want published to this tile and place your bid.
          If your win, your content is displayed for a day.
        </small-hint>
        <image-input required ref=${image} oncheck=${check} oninput=${({ detail }) => input('image', detail)}>
          <div slot='placeholder'>
            <i-con src='image' dark fill style='width: 92px'></i-con><br/>
            Pick the tile's image
          </div>
        </image-input>
        <text-input label='Title' required ref=${title} oncheck=${check}
          oninput=${({ detail }) => input('title', detail)}></text-input>
        <text-input label='Subtitle' ref=${subtitle} oncheck=${check}
          oninput=${({ detail }) => input('subtitle', detail)}>
          <span slot='hint'>Displayed on the grid, under title</span>
        </text-input>
        <text-input label='URL' ref=${url} oncheck=${check} style='margin-top: -3ex'
          oninput=${({ detail }) => input('url', detail)}></text-input>
        <text-area label='Description' ref=${description} oncheck=${check}
          oninput=${({ detail }) => input('description', detail)}>
          <span slot='hint'>Supports markdown</span>
        </text-area>
      </form>
      <primary-button ref=${btn} onclickdirty=${scrollOrSubmit}>
        <span style='margin: 0 .5ex' ref=${btnlabel}>Scroll Down</span>
        <span ref=${coords} style='display: none'></span>
        <i-con src='arrow-down' light thick slot='icon' ref=${btnicon}></i-con>
      </primary-button>
    </glass-modal>
  `
})
