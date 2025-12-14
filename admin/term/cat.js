import { register } from './registry.js'
import { currentTerm } from './context.js'

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

  return { note }
}

const cat = (name) => {
  const term = currentTerm()
  const note = term.notes.note(name)

  if (note) {
    term.append(note)
  }
}

cat.desc = 'recalls a note.'
cat.man = (term) => {
  term.log('usage:')
  term.log('first, create a note via doing `<cmd> > <note>`.')
  term.log('then, you can recall the note using `cat <note>`.')
  term.log('IMPORTANT: notes are not persisted and only last for current session.')
}
register('cat', cat)
