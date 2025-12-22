import { html } from 'rehtm'

import { replaceWithGhost, replaceWithLive } from '../util/ghost.js'
import { register, registerCompleter } from '../registry.js'
import { currentTerm } from '../context.js'
import { TermError } from '../error.js'

import '../components/textual.js'

import { resolve, filesearch, write } from './fs.js'

export const makeNotes = (term) => {
  const live = {}
  window.notes = live
  const id = `note-loader-${Math.random().toString(16).slice(2, 10)}`

  const createel = () => document.createElement('div')

  const bind = async (file, note) => {
    live[file.id] = note
    const fs = await term().fs()

    const observer = new MutationObserver(async () => {
      const content = note.innerHTML
      await fs.writefile(file, content, id)
    })

    observer.observe(note, { childList: true, subtree: true, characterData: true })

    fs.watch(file, {
      onWrite: ({ content, author }) => {
        if (author !== id) {
          note.innerHTML = content.replaceAll('<_>', '<x->').replaceAll('</_>', '</x->')
        }
      },
      onRemove: () => {
        delete live[file.id]
        observer.disconnect()
      },
    })
  }

  const islive = (file) => file.id in live
  const load = async (file) => {
    let note = live[file.id]
    if (!note) {
      note = createel()
      note.setAttribute('note', file.id)
      const fs = await term().fs()
      const content = await fs.readfile(file)
      note.innerHTML = content.replaceAll('<_>', '<x->').replaceAll('</_>', '</x->')
      await bind(file, note)
    }

    return note
  }

  const note = async (path) => {
    const t = term()
    const fs = await t.fs()
    let file = await resolve(path, t)

    if (!file) {
      file = await write(path, '', id, t)
    }

    return await load(file)
  }

  return { islive, load, note }
}

const cat = async (path) => {
  const term = currentTerm()
  const file = await resolve(path, term)
  if (!file) {
    throw new TermError(`file "${path}" not found.`)
  }

  const note = await term.notes.load(file)

  if (note) {
    note.isConnected && replaceWithGhost(note)
    term.append(note)
    ;[...note.childNodes].forEach((child) => replaceWithLive(child))
  } else {
    throw new TermError(`note "${path}" not found.`)
  }
}

cat.desc = 'displays a note.'
cat.man = (term) => {
  term.log('usage:')
  term.log('cat <note>')
  term.log('returns content of a note. notes can be used using > operator to save result of previous commands.')
  term.log(html`<t-warn>IMPORTANT: notes only last for current session.<t-warn></t-warn></t-warn>`)
}
register('cat', cat)
registerCompleter('cat', filesearch)
