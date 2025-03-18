const anchorPoint = element => {
  const rect = element.getBoundingClientRect()
  const hdir = rect.left > window.innerWidth / 2 ? 'right' : 'left'
  const vdir = rect.top > window.innerHeight / 2 ? 'bottom' : 'top'

  return {
    hdir, vdir,
    hkey: hdir === 'right' ? 'marginRight' : 'marginLeft',
    vkey: vdir === 'bottom' ? 'marginBottom' : 'marginTop',
    hval: `${hdir === 'right' ? window.innerWidth - rect.right : rect.left}px`,
    vval: `calc(${vdir === 'bottom' ? window.innerHeight - rect.top : rect.bottom}px + 1ch)`,
  }
}


export const anchor = (dialog, target) => {
  const { vdir, hkey, hval, vkey, vval } = anchorPoint(target)
  dialog.classList.add('anchored')
  dialog.style[hkey] = hval
  dialog.style[vkey] = vval
  dialog.classList.toggle('bottom', vdir === 'bottom')
}


export const unanchor = dialog => {
  dialog.classList.remove('anchored')
  dialog.classList.remove('anchored')
  dialog.classList.remove('bottom')
  dialog.style.marginRight = ''
  dialog.style.marginLeft = ''
  dialog.style.marginTop = ''
  dialog.style.marginBottom = ''
}
