const srcMap = {
  'chunks': 'https://cohost.org/static/f59b84127fa7b6c48b6c.png',
  'eggbug-classic': 'https://cohost.org/static/41454e429d62b5cb7963.png',
  'eggbug': 'https://cohost.org/static/17aa2d48956926005de9.png',
  'sixty': 'https://cohost.org/static/9a6014af31fb1ca65a1f.png',
  'unyeah': 'https://cohost.org/static/5cf84d596a2c422967de.png',
  'yeah': 'https://cohost.org/static/014b0a8cc35206ef151d.png',
  'eggbug-asleep': 'https://cohost.org/static/ebbf360236a95b62bdfc.png',
  'eggbug-devious': 'https://cohost.org/static/c4f3f2c6b9ffb85934e7.png',
  'eggbug-heart-sob': 'https://cohost.org/static/b59709333449a01e3e0a.png',
  'eggbug-nervous': 'https://cohost.org/static/d2753b632211c395538e.png',
  'eggbug-pensive': 'https://cohost.org/static/ae53a8b5de7c919100e6.png',
  'eggbug-pleading': 'https://cohost.org/static/11c5493261064ffa82c0.png',
  'eggbug-relieved': 'https://cohost.org/static/3633c116f0941d94d237.png',
  'eggbug-shocked': 'https://cohost.org/static/b25a9fdf230219087003.png',
  'eggbug-smile-hearts': 'https://cohost.org/static/d7ec7f057e6fb15a94cc.png',
  'eggbug-sob': 'https://cohost.org/static/9559ff8058a895328d76.png',
  'eggbug-tuesday': 'https://cohost.org/static/90058099e741e483208a.png',
  'eggbug-uwu': 'https://cohost.org/static/228d3a13bd5f7796b434.png',
  'eggbug-wink': 'https://cohost.org/static/3bc3a1c5272e2ceb8712.png',
  'host-aww.png': 'https://cohost.org/static/9bb403f3822c6457baf6.png',
  'host-cry.png': 'https://cohost.org/static/530f8cf75eac87716702.png',
  'host-evil.png': 'https://cohost.org/static/cb9a5640d7ef7b361a1a.png',
  'host-frown.png': 'https://cohost.org/static/99c7fbf98de865cc9726.png',
  'host-joy.png': 'https://cohost.org/static/53635f5fe850274b1a7d.png',
  'host-love.png': 'https://cohost.org/static/c45b6d8f9de20f725b98.png',
  'host-nervous.png': 'https://cohost.org/static/e5d55348f39c65a20148.png',
  'host-plead.png': 'https://cohost.org/static/fa883e2377fea8945237.png',
  'host-shock.png': 'https://cohost.org/static/bfa6d6316fd95ae76803.png',
  'host-stare.png': 'https://cohost.org/static/a09d966cd188c9ebaa4c.png',
  'chutils': 'https://raw.githubusercontent.com/enchanted-sword/ch-utils/ab4a94b12432f028c9b60af3d777cdaa92f69711/src/icons/icon.svg'
};
const emojiRegex = new RegExp(`(?:^|[^"'\`]):(${Object.keys(srcMap).join('|')}):(?:$|[^"'\`])`, 'g');
const emoji = (_, emoji) => `<img style="height: var(--emoji-scale, 1em); display: inline-block; vertical-align: middle; object-fit: cover; aspect-ratio: 1 / 1; margin: 0;" alt=":${emoji}:" title=":${emoji}:" src="${srcMap[emoji]}">`;

const mentionRegex = /((?:^|[^a-zA-Z0-9_!#$%&*@＠\\/]|(?:^|[^a-zA-Z0-9_+~.-\\/])))([@＠])([a-zA-Z0-9-]{3,})((?:^|[^a-zA-Z0-9_!#$%&*@＠\\/]|(?:^|[^a-zA-Z0-9_+~.-\\/])))/g;
const mention = (_, startChar,symbol, handle, endChar) => `${startChar}<a style="text-decoration:none;font-weight:bold" href="/${handle}" target="_blank">${symbol + handle}</a>${endChar}`;

export const preprocess = str => str.trim().replace(emojiRegex, emoji);
const renderer = {
  code: text => `<div style="scrollbar-color:initial" class="co-prose prose overflow-hidden break-words"><pre><code>${text}</code></pre></div>`,
  text: text => text.replace(mentionRegex, mention)
};
const postprocess = html => DOMPurify.sanitize(html.replace(/^\s+|\s+$/g, ''));
marked.use({
  renderer,
  hooks: { preprocess, postprocess },
  gfm: true,
  breaks: true
});

/**
 * parses strings of markdown into sanitized HTML strings with custom emoji support
 * @param {string} str - markdown
 * @returns {string} parsed markdown
 */
export const parseMd = str => marked.parse(str);

export const parseMdNoBr = str => marked.parse(str, { breaks: false });