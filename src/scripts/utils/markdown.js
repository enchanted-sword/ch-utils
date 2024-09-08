const { Marked } = marked;

let IFRAMELY_KEY;
let keyStore = document.getElementById('site-config');
if (keyStore) {
  keyStore = JSON.parse(keyStore.textContent);
  ({ IFRAMELY_KEY } = keyStore);
}

const illegalHandles = [
  'rc',
  'api',
  'www',
  'help',
  'admin',
  'support',
  'internal',
  'status',
  'mail',
  'mobile',
  'search',
  'static',
];

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
const emojiRegex = new RegExp(`(?:^|[^"'\`]):(${Object.keys(srcMap).join('|')}):(?:$|[^"'\`])`, 'gi');
const emoji = (_, emoji) => `<img style="height: var(--emoji-scale, 1em); display: inline-block; vertical-align: middle; object-fit: cover; aspect-ratio: 1 / 1; margin: 0;" alt=":${emoji}:" title=":${emoji}:" src="${srcMap[emoji]}">`;

const mentionRegex = /(?:^|\s)([@＠])([a-zA-Z0-9-]{3,})/gi
const mention = (match, symbol, handle) => match.replace(symbol + handle, illegalHandles.includes(handle) ?  symbol + handle : `<a style="text-decoration:none;font-weight:bold" href="/${handle}" target="_blank">${symbol + handle}</a>`);

/**
 * cohost markdown sandboxing
 * - no position:fixed
 * - no css variable declarations
 * - no <style> or <textarea> elements
 * - form inputs are disabled
 * - classes are stripped
 */

const fixedRegex = /style="[^"]*([\\]*p[\\]*o[\\]*s[\\]*i[\\]*t[\\]*i[\\]*o[\\]*n:\s*[\\]*f[\\]*i[\\]*x[\\]*e[\\]*d;?)[^"]*"/gi;
const fixedReplacer = (match, rule) => match.replace(rule, '');
const varRegex = /style="[^"]*(--[\w-]+:[^;]*)[^"]*"/gi;
const varReplacer = (match, rule) => match.replace(rule, '');
const classRegex = /class="[^"]*"/g;
const styleSheetRegex = /<style[^>]*>[^<]*(?:<\/style>)?/gi;
const inputRegex = /<input[^>]*>[^<]*(?:<\/input>)?/gi;
const buttonRegex = /<button[^>]*>([^<]*)(?:<\/button>)?/gi;
const textareaRegex = /<textarea[^>]*>[^<]*(?:<\/textarea>)?/gi;

const preprocess = str => str.trim().replace(emojiRegex, emoji);
const tokenizer = {
  html: src => false,
};
const renderer = {
  code({ text }) {return `<div style="scrollbar-color:initial" class="co-prose prose overflow-hidden break-words"><pre><code>${text}</code></pre></div>`},
  text({ text, tokens }) {
    console.log(tokens);
    if (tokens) text = this.parser.parseInline(tokens);
    return text.replace(mentionRegex, mention);
  },
  heading({ tokens, depth }) {return `<h${depth} class="font-bold">${this.parser.parseInline(tokens)}</h${depth}>`}
};
function link({ text, href }) {
  if (text === href) return `
    <div class="co-embed">
      <div class="renderIfVisible">
        <div>
          <div>
            <div
              style="left: 0px; width: 100%; height: 160px; position: relative; border-radius: 3px; box-shadow: rgba(0, 0, 0, 0.06) 0px 8px 18px; overflow: hidden; padding-bottom: 0px;">
              <iframe
                src="https://iframely.net/api/iframe?app=1&amp;url=${encodeURIComponent(href)}&amp;key=${IFRAMELY_KEY}"
                style="top: 0; left: 0; width: 100%; height: 100%; position: absolute; border: 0;" allowfullscreen=""
                tabindex="0"></iframe></div>
          </div>
        </div>
      </div>
      <div class="co-ui-text mt-0 p-3 text-right"><a href="${href}" target="_blank" rel="noopener nofollow" tabindex="0">${text}</a></div>
    </div>
  `;
  else return `<a href="${href}">${text}</a>`;
}
const prepostprocess = html => html.replace(/^\s+|\s+$/g, '')
  .replace(styleSheetRegex, '')
  .replace(varRegex, varReplacer)
  .replace(fixedRegex, fixedReplacer).replace(classRegex, '')
  .replace(inputRegex, '<input type="checkbox" disabled="" tabindex="0">')
  .replace(buttonRegex, '<p>$1</p>')
  .replace(textareaRegex, '');
const postprocess = html => DOMPurify.sanitize(prepostprocess(html));

const standard = new Marked();
standard.use({
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
export const parseMd = str => standard.parse(str);

/**
 * standard parser sans gfm breaks
 * @param {string} str - markdown
 * @returns {string} parsed markdown, sans breaks
 */
const breakless = new Marked();
breakless.use({
  renderer,
  hooks: { preprocess, postprocess },
  gfm: true,
  breaks: false
});

export const parseMdNoBr = str => breakless.parseInline(str);

/**
 * parses markdown and turns links into iframely embeds
 * @param {string} str - markdown
 * @returns {string} parsed markdown, with embeds
 */
const embedful = new Marked();
embedful.use({
  renderer: Object.assign(renderer, { link }),
  hooks: {
    preprocess,
    postprocess: html => DOMPurify.sanitize(prepostprocess(html), { ADD_TAGS: ['iframe'], ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'] }),
  },
  gfm: true,
  breaks: true
});

export const parseMdEmbed = str => embedful.parse(str);