import { define, currentNode, attachControls, onAttribute, useDispatch, onConnected, ATTRIBUTE_REMOVED } from 'minicomp'
import { ref, html } from 'rehtm'

define('text-area', () => {
  const oncheck = useDispatch('check', { bubbles: true })
  const oninput = useDispatch('input', { bubbles: true })
  const self = currentNode()
  const label = ref()
  const area = ref()

  onAttribute('name', (n) => n && (area.current.setAttribute('name', n), area.current.setAttribute('autocomplete', n)))
  onAttribute('label', (l) => (label.current.textContent = l))
  onAttribute('required', (r) =>
    r && r !== ATTRIBUTE_REMOVED ? area.current.setAttribute('required', '') : area.current.removeAttribute('required'),
  )
  onAttribute('minlength', (m) => m && area.current.setAttribute('minlength', m))
  onAttribute('maxlength', (m) => m && area.current.setAttribute('maxlength', m))

  const check = () => {
    self.value = area.current.value
    self.validity = area.current.validity
    self.setAttribute('valid', self.validity.valid)
    oncheck(self.validity)
  }

  const input = (event) => {
    event.stopPropagation()
    check()
    acceptSuggestion()
    oninput(area.current.value)
  }

  onConnected(check)
  const untouch = () => area.current.classList.remove('touched')

  const set = (v) => ((area.current.value = v), check())

  let suggestionRollback
  const suggest = (v) => {
    suggestionRollback = area.current.value ?? ''
    set(v)
    area.current.setAttribute('suggested-content', '')
  }

  const clearSuggestion = () => {
    suggestionRollback = undefined
    area.current?.removeAttribute('suggested-content')
  }

  const acceptSuggestion = clearSuggestion

  const rollbackSuggestion = () => {
    if (suggestionRollback !== undefined) {
      set(suggestionRollback)
      suggestionRollback = undefined
      area.current.removeAttribute('suggested-content')
    }
  }

  attachControls({
    untouch,
    set,
    suggest,
    contentSuggested: () => area.current.hasAttribute('suggested-content'),
    clear: () => {
      area.current.value = ''
      self.validity = {}
      self.removeAttribute('valid')
      clearSuggestion()
      untouch()
      oninput(area.current.value)
      check()
    },
  })

  return html`
    <link rel="stylesheet" href="./client/design/inputs/text-area/styles.css" />
    <textarea
      placeholder="input"
      ref=${area}
      onfocus=${() => area.current.classList.add('touched')}
      oninput=${input}
    ></textarea>
    <label ref=${label}></label>
    <i-con src="arrow-uturn-left" dark thick onclick=${() => rollbackSuggestion()}></i-con>
    <slot name="hint"></slot>
  `
})
