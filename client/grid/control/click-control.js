import { define, useDispatch } from 'https://esm.sh/minicomp'
import { observe } from '../../util/observe.js'


define('click-control', ({ target }) => {
  const onClick = useDispatch('click')

  observe(target, 'click', () => onClick())

  let touchstart
  let touchtimer
  let dbltimer
  const clear = () => (clearTimeout(touchtimer), touchtimer = undefined)

  observe(target, 'touchstart', (event) => {
    if (dbltimer) {
      clearTimeout(dbltimer)
      dbltimer = undefined
    } else {
      clearTimeout(touchtimer)
      touchtimer = setTimeout(clear, 200)
      touchstart = { x: event.touches[0].clientX, y: event.touches[0].clientY }
    }
  }, { passive: true })

  observe(target, 'touchend', (event) => {
    if (touchtimer) {
      const touchend = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }
      const dx = touchend.x - touchstart.x
      const dy = touchend.y - touchstart.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < 10) {
        dbltimer = setTimeout(() => {
          dbltimer = undefined
          onClick()
        }, 200)
      }
      clear()
    }
  }, { passive: true })

  return ''
})
