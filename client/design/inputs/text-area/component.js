import {
  define, currentNode, attachControls,
  onAttribute, useDispatch, onConnected, ATTRIBUTE_REMOVED
} from 'minicomp'
import { ref, html } from 'rehtm'


define('text-area', () => {
  const oncheck = useDispatch('check', { bubbles: true })
  const oninput = useDispatch('input', { bubbles: true })
  const self = currentNode()
  const label = ref()
  const area = ref()

  onAttribute('name', n => n && (area.current.setAttribute('name', n), area.current.setAttribute('autocomplete', n)))
  onAttribute('label', l => label.current.textContent = l)
  onAttribute('required', r => r && r !== ATTRIBUTE_REMOVED ?
    area.current.setAttribute('required', '') : area.current.removeAttribute('required'))
  onAttribute('minlength', m => m && area.current.setAttribute('minlength', m))
  onAttribute('maxlength', m => m && area.current.setAttribute('maxlength', m))

  const check = () => {
    self.value = area.current.value
    self.validity = area.current.validity
    self.setAttribute('valid', self.validity.valid)
    oncheck(self.validity)
  }

  const input = (event) => {
    event.stopPropagation()
    check()
    oninput(area.current.value)
  }

  onConnected(check)
  const untouch = () => area.current.classList.remove('touched')

  attachControls({
    untouch,
    set: v => (area.current.value = v, check()),
    clear: () => {
      area.current.value = ''
      self.validity = {}
      self.removeAttribute('valid')
      untouch()
      oninput(area.current.value)
      check()
    }
  })

  return html`
    <link rel='stylesheet' href='./client/design/inputs/text-area/styles.css' />
    <textarea placeholder='input' ref=${area}
      onfocus=${() => area.current.classList.add('touched')}
      oninput=${input}></textarea>
    <label ref=${label}></label>
    <slot name='hint'></slot>
  `
})
