import { define, currentNode, onAttribute, useDispatch, onConnected, ATTRIBUTE_REMOVED } from 'minicomp'
import { ref, html } from 'rehtm'


define('text-input', () => {
  const oncheck = useDispatch('check', { bubbles: true })
  const self = currentNode()
  const label = ref()
  const input = ref()

  onAttribute('name', n => n && (input.current.setAttribute('name', n), input.current.setAttribute('autocomplete', n)))
  onAttribute('label', l => label.current.textContent = l)
  onAttribute('required', r => r && r !== ATTRIBUTE_REMOVED ?
    input.current.setAttribute('required', '') : input.current.removeAttribute('required'))
  onAttribute('type', t => input.current.setAttribute('type', t ?? 'text'))
  onAttribute('minlength', m => m && input.current.setAttribute('minlength', m))
  onAttribute('maxlength', m => m && input.current.setAttribute('maxlength', m))
  onAttribute('pattern', p => p && input.current.setAttribute('pattern', p))

  const check = () => {
    self.value = input.current.value
    self.validity = input.current.validity
    self.setAttribute('valid', self.validity.valid)
    oncheck(self.validity)
  }

  onConnected(check)

  return html`
    <link rel='stylesheet' href='./client/design/input/text/styles.css' />
    <input type='text' placeholder='input' ref=${input}
      onfocus=${() => input.current.classList.add('touched')}
      oninput=${check}/>
    <label ref=${label}></label>
    <slot name='hint'></slot>
  `
})
