import { html } from 'rehtm'

import { register } from './registry.js'
import { currentTerm } from './context.js'
import { TermError } from './error.js'
import './textual.js'

export const makeNotes = () => {
  const notes = {}

  const note = (name, create) => {
    if (!(name in notes) && create) {
      const holder = document.createElement('div')
      holder.setAttribute('note', name)
      notes[name] = holder
    }

    return notes[name]
  }

  const list = () => Object.keys(notes).sort((a, b) => a.localeCompare(b))
  const remove = (key) => {
    delete notes[key]
  }
  const bind = (key, el) => (notes[key] = el)

  return { note, list, remove, bind }
}

const cat = (name) => {
  const term = currentTerm()
  const note = term.notes.note(name)

  if (note) {
    if (note.isConnected) {
      const ghost = note.cloneNode(true)
      ghost.style.filter = 'grayscale(1)'
      ghost.style.webkitFilter = 'grayscale(1)'
      ghost.style.opacity = 0.5
      note.replaceWith(ghost)
    }

    term.append(note)
  } else {
    throw new TermError(`note "${name}" not found.`)
  }
}

cat.desc = 'retrieves a note.'
cat.man = (term) => {
  term.log('usage:')
  term.log('cat <note>')
  term.log('returns content of a note. notes can be used using > operator to save result of previous commands.')
  term.log(html`<t-warn>IMPORTANT: notes only last for current session.<t-warn></t-warn></t-warn>`)
}
register('cat', cat)

const ls = () => {
  const term = currentTerm()

  const holder = html`<div style="display: grid; grid-template-columns: 1fr 1fr 1fr"></div>`
  term.target(holder)
  term.notes.list().forEach((key) => term.append(html`<t-cp>${key}</t-cp>`))
  term.target()
  term.log(holder)
}

ls.desc = 'list notes.'
ls.man = (term) => {
  term.log('returns current list of notes. notes can be used using > operator to save result of previous commands.')
  term.log(html`<t-warn>IMPORTANT: notes only last for current session.<t-warn></t-warn></t-warn>`)
}
register('ls', ls)

const rm = (name) => {
  const term = currentTerm()

  if (name === '*') {
    term.notes.list().forEach((note) => term.notes.remove(note))
    term.log(html`<t-succ>all notes removed.</t-succ>`)
  } else {
    term.notes.remove(name)
    term.log(html`<t-succ>note "${name}" removed.</t-succ>`)
  }
}

rm.desc = 'removes a note.'
rm.man = (term) => {
  term.log('usage:')
  term.log('rm <note>')
  term.log('rm *')
  term.log(
    'removes given note (or all notes if `*` is passed). notes can be used using > operator to save result of previous commands.',
  )
  term.log(html`<t-warn>IMPORTANT: notes only last for current session.<t-warn></t-warn></t-warn>`)
}
register('rm', rm)

const mv = (old, name) => {
  const term = currentTerm()

  const note = term.notes.note(old)
  if (note) {
    term.notes.remove(old)
    term.notes.bind(name, note)
  } else {
    throw new TermError(`note "${old}" not found.`)
  }
}

mv.desc = 'renames a note.'
mv.man = (term) => {
  term.log('usage:')
  term.log('mv <note> <new-name>')
  term.log('renames given note. notes can be used using > operator to save result of previous commands.')
  term.log(html`<t-warn>IMPORTANT: notes only last for current session.<t-warn></t-warn></t-warn>`)
}
register('mv', mv)
