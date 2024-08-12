import { getOptions } from './utils/jsTools.js';
import { activeProject } from './utils/user.js';
import { mutationManager } from './utils/mutation.js';

const customAttribute = 'data-show-nsfw';
let nsfwButtonQuery = `article > div > div:not([${customAttribute}]) .co-18-plus + div button`;

const clickShowPost = elems => elems.map(elem => {
  elem.closest('article > div > div').setAttribute(customAttribute, '');
  if (elem.textContent === 'show post')  elem.click();
});

export const main = async () => {
  let { handles } = await getOptions('showNsfw')
  handles = handles.split(',').map(h => h.replaceAll(/[@ \n]/g, ''));
  const currentHandle = activeProject.handle;

  if (handles.includes(currentHandle)) mutationManager.start(nsfwButtonQuery, clickShowPost);
};

export const clean = async () => {
  mutationManager.stop(clickShowPost);
  $(`[${customAttribute}]`).removeAttr(customAttribute);
}

