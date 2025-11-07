import { define, onAttribute, useDispatch, currentNode } from 'minicomp'
import { html, ref } from 'rehtm'


// TODO: validation state

define('check-box', () => {
  const self = currentNode()
  const input = ref()
  const check = useDispatch('check')

  onAttribute('checked', c => input.current.checked = c)
  const oncheck = () => {
    self.checked = input.current.checked
    check(self.checked)
  }

  return html`
    <link rel="stylesheet" href="./client/design/inputs/checkbox/styles.css" />
    <label>
      <input type="checkbox" ref=${input} oninput=${oncheck}/>
      <img src='./client/assets/icons/check-dark-thick.svg' />
      <span><slot></slot></span>
    </label>
  `
})
