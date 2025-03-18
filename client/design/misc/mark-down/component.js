import { define, onAttribute } from 'https://esm.sh/minicomp'
import { ref, html } from 'https://esm.sh/rehtm'


// TODO: at some point, if this madness continues, we would need a tiny markdown parser
//       instead of this hack. for example [this lib](https://www.npmjs.com/package/very-small-parser)
//       might be handy.
const almostMarked = (md) => {
  return md
    // Handle triple-backtick code blocks first (multiline)
    //    We capture the code in ([\s\S]*?) so it spans multiple lines, too.
    .replace(/(^|\n)```([\s\S]*?)```($|\n)/g, (match, start, code, end) => {
      // Keep the triple backticks as raw text, but wrap them for styling
      return `${start}<span class="codeblock">${code}</span>${end}`;
    })
    // Headings: lines starting with 1-6 hashes, e.g. "# Something"
    .replace(/^(\#{1,6})([ \t]+.*)$/gm, (_, hashes, text) => 
      `<span class="heading h${hashes.length}">${hashes}${text}</span>`)
    // Links: [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    // Bold: **text**
    .replace(/\*\*(.*?)\*\*/g, '<span class="bold">$1</span>')
    // Italic: *text* or _text_
    .replace(/(\*|_)(.*?)\1/g, '<span class="italic">$1$2$1</span>')
    // Inline code: `text`
    .replace(/`([^`]+)`/g, '<span class="code">`$1`</span>')
    // Blockquote: lines starting with >
    .replace(/^>(.*)$/gm, (_, content) => 
      `<span class="blockquote"><span class="marker">></span>${content}</span>`)
    // Unordered list: lines starting with *, +, or -
    .replace(/^(\*|\-|\+) (.*)$/gm, '<span class="list unordered"><span class="marker">$1</span>$2</span>')
    // Ordered list: lines starting with numbers + dot
    .replace(/^(\d+)\. (.*)$/gm, '<span class="list ordered"><span class="marker">$1.</span>$2</span>')
    // Strikethrough: ~~text~~
    .replace(/~~(.*?)~~/g, '<span class="strikethrough">~~$1~~</span>')
    // Code blocks: ```some code```
    // (very naive triple-backtick capture)
    .replace(/(^|\n)(```)([\s\S]*?)(```)(\n|$)/g, 
      (match, p1, b1, code, b2, p5) => 
        `${p1}<span class="codeblock">${b1}${code}${b2}</span>${p5}`
    )
    // new lines
    .replace(/\n/g, '<br>')
}

define('mark-down', () => {
  const container = ref()

  onAttribute('src', async (src) => {
    if (src) {
      const res = await fetch(src)
      const text = await res.text()
      container.current.innerHTML = almostMarked(text)
    }
  })

  return html`
    <link rel='stylesheet' href='./client/design/misc/mark-down/styles.css' />
    <div ref=${container}></div>
  `
})
