const fs = require('fs')
const src = fs.readFileSync('src/views/CalendarView.vue', 'utf8')
const start = src.indexOf('<template>') + '<template>'.length
const end = src.indexOf('<script setup>')
const tpl = src.slice(start, end)
const voids = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'])
let i = 0
let line = 1
let col = 1
const stack = []

function adv(ch) {
  if (ch === '\n') {
    line++
    col = 1
  } else {
    col++
  }
}

while (i < tpl.length) {
  if (tpl.startsWith('<!--', i)) {
    while (i < tpl.length && !tpl.startsWith('-->', i)) adv(tpl[i++])
    for (let k = 0; k < 3 && i < tpl.length; k++) adv(tpl[i++])
    continue
  }

  if (tpl[i] === '<') {
    let j = i + 1
    let closing = false
    if (tpl[j] === '/') {
      closing = true
      j++
    }

    if (/[A-Za-z]/.test(tpl[j] || '')) {
      let name = ''
      while (/[A-Za-z0-9_-]/.test(tpl[j] || '')) name += tpl[j++]

      let k = j
      let inQ = null
      while (k < tpl.length) {
        const c = tpl[k]
        if (inQ) {
          if (c === inQ) inQ = null
        } else {
          if (c === '"' || c === "'") inQ = c
          else if (c === '>') break
        }
        k++
      }

      if (k >= tpl.length) {
        console.log('unterminated tag starting', name, 'at', line, col)
        process.exit(0)
      }

      const raw = tpl.slice(i, k + 1)
      const selfClose = /\/\s*>$/.test(raw)
      if (closing) {
        const top = stack.pop()
        if (!top || top.name !== name) {
          console.log('mismatch close', name, 'at', line, col, 'top', top)
          process.exit(0)
        }
      } else if (!selfClose && !voids.has(name.toLowerCase())) {
        stack.push({ name, line, col })
      }

      while (i <= k) adv(tpl[i++])
      continue
    }
  }

  adv(tpl[i++])
}

if (stack.length) {
  console.log('unclosed tags:')
  console.log(stack.slice(-10))
} else {
  console.log('all tags balanced')
}
