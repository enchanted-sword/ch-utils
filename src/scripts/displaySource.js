import { noact } from './utils/noact.js';
import { postFunction } from './utils/mutation.js';
import { getViewModel } from './utils/react.js';
import { displayPrefs } from './utils/apiFetch.js';
import { getOptions } from './utils/jsTools.js';

const { collapseLongThreads } = await displayPrefs();

let theme, showBoth;

const customClass = 'ch-utils-displaySource';
const customAttribute = 'data-display-source';

const newIcon = () => noact({
  className: customClass,
  type: 'button',
  dataset: { active: false },
  onclick: function () { this.dataset.active === 'true' ? this.dataset.active = false : this.dataset.active = true; },
  children: [
    {
      className: 'h-6 w-6 co-action-button',
      stroke: 'currentColor',
      viewBox: '0 0 18 18',
      children: [
        {
          style: "font-variation-settings:'wght' 600;fill:none;paint-order:stroke fill markers",
          d: 'm 5.26034,4.897889 c -0.1293,0.0412 -4.0513,3.877 -4.0513,3.877 l 4.0513,3.8771'
        },
        {
          style: "font-variation-settings:'wght' 600;fill:none;paint-order:stroke fill markers",
          d: 'm 12.94714,12.561789 c 0.1293,-0.0412 4.0513,-3.877 4.0513,-3.877 l -4.0513,-3.8771'
        },
        {
          style: "font-variation-settings:'wght' 600;fill:none;paint-order:stroke fill markers",
          d: 'm 7.32904,15.147289 3.4621,-12.3648'
        }
      ]
    }
  ]
});
const newSourceDisplay = blocks => noact({
  className: customClass,
  dataset: { theme },
  children: blocks.map(block => {
    switch (block.type) {
      case 'ask': return {
        className: 'ch-utils-displaySource-box',
        children: [{
          tag: 'pre',
          children: [{
            tag: 'code',
            children: [
              `${block.ask.anon ? 'anonymous' : `@${block.ask.askingProject.handle}`} asked:`,
              { 'tag': 'br' },
              block.ask.content
            ]
          }]
        }]
      };
      case 'markdown': return {
        tag: 'pre',
        class: 'language-markup',
        children: [{
          tag: 'code',
          innerHTML: [Prism.highlight(block.markdown.content, Prism.languages.markup, 'markup')]
        }]
      };
      case 'attachment': return {
        className: 'ch-utils-displaySource-box',
        children: [{
          tag: 'pre',
          children: [{
            tag: 'code',
            children: [
              `${block.attachment.kind} attachment:`,
              { 'tag': 'br' },
              block.attachment.fileURL
            ]
          }]
        }]
      }
      default: return '';
    }
  })
});

const addButtons = async branches => {
  for (const branch of branches) {
    branch.setAttribute(customAttribute, showBoth ? 'showBoth' : 'switch');
    let { blocks } = await getViewModel(branch);

    let header = branch.querySelector('.co-post-header');
    if (!header) header = branch.parentElement.querySelector('.co-thread-header');
    header.append(newIcon());

    branch.parentElement.insertBefore(newSourceDisplay(blocks), branch.nextElementSibling); // why isn't insertAfter a thing?
  }
}

export const main = async () => {
  ({ theme, showBoth } = await getOptions('displaySource'));
  Prism.plugins.customClass.prefix('prism-');

  postFunction.start(addButtons, `:not([${customAttribute}])`);
};
export const clean = async () => {
  $(`.${customClass}`).remove();
  $(`[${customAttribute}]`).removeAttr(customAttribute);

  postFunction.stop(addButtons);
};