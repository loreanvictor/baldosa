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

import './suggest/button.js'

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
  const clearbtn = ref()

  const form = ref()
  const image = ref()
  const title = ref()
  const subtitle = ref()
  const url = ref()
  const suggest = ref()
  const description = ref()

  const clear = () => {
    title.current?.controls.clear()
    subtitle.current?.controls.clear()
    url.current?.controls.clear()
    description.current?.controls.clear()
    image.current?.controls.clear()
    clearbtn.current.setAttribute('disabled', 'true')
  }

  const updateClearBtn = () => {
    if (
      image.current.controls.loaded() ||
      title.current.value ||
      subtitle.current.value ||
      url.current.value ||
      description.current.value
    ) {
      clearbtn.current.removeAttribute('disabled')
    } else {
      clearbtn.current.setAttribute('disabled', '')
    }
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

      updateClearBtn()
    },
    close: () => modal.current.controls.close(),
    clear,
  })

  const check = () => {
    const valid =
      image.current?.validity?.valid &&
      title.current?.validity?.valid &&
      subtitle.current?.validity?.valid &&
      url.current?.validity?.valid &&
      description.current?.validity?.valid

    if (!valid) {
      btn.current.setAttribute('disabled', '')
    } else {
      btn.current.removeAttribute('disabled')
    }

    if (url.current?.validity?.valid && url.current?.value !== '') {
      suggest.current.removeAttribute('disabled')
      suggest.current.setAttribute('url', url.current.value)
    } else {
      suggest.current.setAttribute('disabled')
    }

    return valid
  }

  const onSuggest = async ({ detail: suggestion }) => {
    if (url.current?.validity?.valid && url.current?.value !== '') {
      try {
        if (!image.current.controls.loaded() && suggestion.image) {
          image.current.controls.loadUrl(suggestion.image)
        }
        if (!title.current.value && suggestion.title) {
          title.current.controls.set(suggestion.title)
          await updateDraft(tile, { title: suggestion.title })
        }
        if (!subtitle.current.value && suggestion.subtitle) {
          subtitle.current.controls.set(suggestion.subtitle)
          await updateDraft(tile, { subtitle: suggestion.subtitle })
        }
        if (!description.current.value && suggestion.description) {
          description.current.controls.set(suggestion.description)
          await updateDraft(tile, { description: suggestion.description })
        }
      } catch (err) {
        console.error(err)
      }
    }
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
    updateClearBtn()
  }

  const prepAndSubmit = async () => {
    const content = {
      image: await image.current?.controls.export(),
      title: title.current?.value,
      subtitle: subtitle.current?.value,
      url: url.current?.value,
      description: description.current?.value,
    }

    Object.keys(content).forEach((key) => !content[key] && delete content[key])

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
      btnicon.current.style = 'transform: rotate(-90deg)'
      coords.current.style.display = 'block'
    } else {
      btnlabel.current.textContent = 'Scroll Down'
      btnicon.current.style = ''
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

      [role='group'] {
        display: flex;
        gap: 1ch;
        primary-button {
          flex: 1;
        }
      }

      small {
        font-size: 0.8em;
        opacity: 0.5;
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
      <span slot="title">Bid on Tile</span>
      <form ref=${form} onscroll=${manageSubmitBtn}>
        <small-hint onclick=${showHelp}>
          Choose what you want published to this tile and place your bid. If your win, your content is displayed for a
          day.
        </small-hint>
        <image-input required ref=${image} oncheck=${check} oninput=${({ detail }) => input('image', detail)}>
          <div slot="placeholder">
            <i-con src="image" dark fill style="width: 92px"></i-con><br />
            Pick the tile's image
          </div>
        </image-input>
        <text-input
          label="Title"
          required
          maxlength="100"
          ref=${title}
          oncheck=${check}
          oninput=${({ detail }) => input('title', detail)}
        ></text-input>
        <text-input
          label="Subtitle"
          ref=${subtitle}
          maxlength="200"
          oncheck=${check}
          oninput=${({ detail }) => input('subtitle', detail)}
        >
          <span slot="hint">Displayed on the grid, under title</span>
        </text-input>
        <text-input
          label="URL"
          maxlength="500"
          type="url"
          pattern="https://.+"
          ref=${url}
          oncheck=${check}
          style="margin-top: -3ex; flex-grow: 1"
          oninput=${({ detail }) => input('url', detail)}
        >
          <span slot="hint">Sometimes URLs can be used to autofill the rest ...</span>
          <suggest-bid-content-btn slot="action" ref=${suggest} onsuggest=${onSuggest}></suggest-bid-content-btn>
        </text-input>

        <text-area
          label="Description"
          maxlength="900"
          style="margin-top: -3ex"
          ref=${description}
          oncheck=${check}
          oninput=${({ detail }) => input('description', detail)}
        >
          <span slot="hint">Supports markdown</span>
        </text-area>
      </form>
      <btn-group hide-disabled>
        <secondary-button hide-disabled onclick=${() => clear()} ref=${clearbtn} disabled>
          <i-con slot="icon" src="trash-can" dark thick></i-con>
        </secondary-button>
        <primary-button ref=${btn} onclickdirty=${scrollOrSubmit}>
          <span style="margin: 0 .5ex" ref=${btnlabel}>Scroll Down</span>
          <span ref=${coords} style="display: none"></span>
          <i-con src="arrow-down" light thick slot="icon" ref=${btnicon}></i-con>
        </primary-button>
      </btn-group>
    </glass-modal>
  `
})
