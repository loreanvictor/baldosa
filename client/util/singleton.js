import { define } from 'https://esm.sh/minicomp'


export const singleton = (name, fn, host = document.body) => {
  define(name, fn)
  let instance

  return () => {
    instance = instance ?? host.querySelector(name)

    if (!instance) {
      instance = document.createElement(name)
      instance.style.setProperty('display', 'none')
      host.appendChild(instance)
      setTimeout(() => instance.style.setProperty('display', ''), 200)
    }

    return instance
  }
}
