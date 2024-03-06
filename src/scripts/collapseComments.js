import { mutationManager } from './utils/mutation.js';
import { getOptions } from './utils/jsTools.js';

const commentBoxSelector = '.co-comment-box:has(article)';
const customClass = 'ch-utils-collapseable';

let collapseByDefault;

const onToggle = ({ target }) => {
  if (target.dataset.displayState === 'expanded') {
    target.dataset.displayState = 'collapsed';
    target.innerText = 'expand comment';
  } else {
    target.dataset.displayState = 'expanded';
    target.innerText = 'collapse comment';
  }
  $(target).toggleClass('co-filled-button');
  $(target).toggleClass('co-outline-button');
}

const newToggle = () => {
  const toggle = $(`
    <button class="${customClass} co-outline-button flex items-center justify-center rounded-lg border-2px-[14px] py-[6px] text-sm font-bold">
      collapse comment
    </button>
  `);
  toggle[0].dataset.displayState = 'expanded';
  toggle.on('click', onToggle);
  return toggle;
}

const addToggles = boxes => {
  for (const box of boxes) {
    const toggle = newToggle();
    $(box).prepend(toggle);

    if (collapseByDefault) {
      toggle.trigger('click');
    }
  }
};

export const main = async () => {
  ({ collapseByDefault } = await getOptions('collapseComments'));
  mutationManager.start(commentBoxSelector, addToggles);
};

export const clean = async () => {
  mutationManager.stop(addToggles);
  $(`.${customClass}`).remove();
};

