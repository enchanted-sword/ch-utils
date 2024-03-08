const emojiRegex = /:(chunks|eggbug-classic|eggbug|sixty|unyeah|yeah):/g;
const srcMap = {
  chunks: 'https://cohost.org/static/f59b84127fa7b6c48b6c.png',
  'eggbug-classic': 'https://cohost.org/static/41454e429d62b5cb7963.png',
  eggbug: 'https://cohost.org/static/17aa2d48956926005de9.png',
  sixty: 'https://cohost.org/static/9a6014af31fb1ca65a1f.png',
  unyeah: 'https://cohost.org/static/5cf84d596a2c422967de.png',
  yeah: 'https://cohost.org/static/014b0a8cc35206ef151d.png'
};
const emoji = (match, p1) => `<img style="max-width: 24px; max-height: 24px; display: inline-block;" alt=":${p1}:" src="${srcMap[p1]}">`;

export const parseMd = str => DOMPurify.sanitize(marked.parse(str.replace(emojiRegex, emoji)));