import {
  define,
  on,
  currentNode,
  attachControls,
  onAttribute,
  useDispatch,
  onConnected,
  onCleanup,
  ATTRIBUTE_REMOVED,
} from 'minicomp'
import { ref, html } from 'rehtm'

import '../../display/icon/component.js'

define('text-input', () => {
  const oncheck = useDispatch('check', { bubbles: true })
  const oninput = useDispatch('input', { bubbles: true })
  const self = currentNode()
  const label = ref()
  const input = ref()
  const rollbackbtn = ref()
  const actionslot = ref()

  onAttribute(
    'name',
    (n) => n && (input.current.setAttribute('name', n), input.current.setAttribute('autocomplete', n)),
  )
  onAttribute('label', (l) => (label.current.textContent = l))
  onAttribute('required', (r) =>
    r && r !== ATTRIBUTE_REMOVED
      ? input.current.setAttribute('required', '')
      : input.current.removeAttribute('required'),
  )
  onAttribute('type', (t) => input.current.setAttribute('type', t ?? 'text'))
  onAttribute('minlength', (m) => m && input.current.setAttribute('minlength', m))
  onAttribute('maxlength', (m) => m && input.current.setAttribute('maxlength', m))
  onAttribute('pattern', (p) => p && input.current.setAttribute('pattern', p))

  const check = () => {
    self.value = input.current.value
    self.validity = input.current.validity
    self.setAttribute('valid', self.validity.valid)
    oncheck(self.validity)
  }

  const handleinput = (event) => {
    event.stopPropagation()
    acceptSuggestion()
    check()
    oninput(input.current.value)
  }

  onConnected(check)
  const untouch = () => input.current.classList.remove('touched')

  let observer
  const onActionSlot = () => {
    const slotted = actionslot.current.assignedElements({ flatten: true }).at(0)
    if (slotted) {
      observer?.disconnect()
      observer = new MutationObserver(() => {
        if (!slotted.hasAttribute('disabled')) {
          actionslot.current.toggleAttribute('action-enabled', true)
        } else {
          actionslot.current.removeAttribute('action-enabled')
        }
      })
      observer.observe(slotted, { attributes: true, attributeFilter: ['disabled'] })
    }
  }

  onCleanup(() => observer?.disconnect())

  const set = (v) => ((input.current.value = v), check())

  let suggestionRollback
  const suggest = (v) => {
    suggestionRollback = input.current.value ?? ''
    set(v)
    oninput(v)
    input.current.setAttribute('suggested-content', '')
    rollbackbtn.current.setAttribute('src', 'arrow-uturn-left')
  }

  const clearSuggestion = () => {
    suggestionRollback = undefined
    input.current?.removeAttribute('suggested-content')
    rollbackbtn.current.setAttribute('src', 'x')
  }

  const acceptSuggestion = clearSuggestion

  const contentSuggested = () => suggestionRollback !== undefined
  const rollbackSuggestion = () => {
    if (contentSuggested()) {
      set(suggestionRollback)
      clearSuggestion()
    }
  }

  const rollback = () => (contentSuggested() ? rollbackSuggestion() : (set(''), oninput('')))

  attachControls({
    untouch,
    set,
    suggest,
    contentSuggested: () => input.current.hasAttribute('suggested-content'),
    clear: () => {
      input.current.value = ''
      untouch()
      self.validity = {}
      self.removeAttribute('valid')
      clearSuggestion()
      oninput(input.current.value)
      check()
    },
  })

  return html`
    <link rel="stylesheet" href="./client/design/inputs/text/styles.css" />
    <div holder>
      <div input>
        <input
          type="text"
          placeholder="input"
          ref=${input}
          onfocus=${() => input.current.classList.add('touched')}
          oninput=${handleinput}
        />
        <label ref=${label}></label>
        <i-con src="x" ref=${rollbackbtn} dark thick onclick=${() => rollback()}></i-con>
      </div>
      <div action>
        <slot name="action" ref=${actionslot} onslotchange=${onActionSlot}></slot>
      </div>
    </div>
    <slot name="hint"></slot>
  `
})
