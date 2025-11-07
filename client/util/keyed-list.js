import { define, currentNode, onProperty, attachControls } from 'minicomp'


define('keyed-list', () => {
  const self = currentNode()

  let each
  onProperty('each', e => each = e)

  const init = list => {
    self.innerHTML = ''
    list.forEach(item => add(item))
  }

  const add = (value, before) => {
    const $item = each(value)

    let $before
    if (before && ($before = self.querySelector(`[key="${before}"]`))) {
      self.insertBefore($item, $before)
    } else {
      self.appendChild($item)
    }
  }

  const prepend = (value) => {
    const $item = each(value)
    self.prepend($item)
  }

  const move = (key, before) => {
    const $item = self.querySelector(`[key="${key}"]`)
    let $before
    if (before && ($before = self.querySelector(`[key="${before}"]`))) {
      self.insertBefore($item, $before)
    } else {
      self.appendChild($item)
    }
  }

  const remove = key => {
    self.querySelector(`[key="${key}"]`)?.remove()
  }

  const collapse = async (key, duration = 150) => {
    const $item = self.querySelector(`[key="${key}"]`)
    if (!$item) {
      return
    }

    const height = $item.getBoundingClientRect().height
    $item.style.overflow = 'hidden'
    $item.style.maxHeight = `${height}px`
    $item.style.transition = `max-height ${duration}ms ease-out`

    return new Promise(resolve => {
      requestAnimationFrame(() => {
        $item.style.maxHeight = 0
        $item.addEventListener('transitionend', () => {
          remove(key)
          resolve()
        }, { once: true })
      })
    })
  }

  attachControls({ init, add, prepend, remove, move, collapse })

  return `
    <slot></slot>
  `
})
