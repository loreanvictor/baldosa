// TODO: ensure security on this
export const openlink = (link) => {
  if (link) {
    const opened = window.open(link, '_blank')
    !opened && (location.href = link)
  }
}
