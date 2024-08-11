import { getOptions } from './utils/jsTools.js';
import { activeProject } from './utils/user.js';
import { mutationManager } from './utils/mutation.js';

let nsfwButtonQuery = 'article .co-18-plus + div button'

const clickShowPost = elems => {
  for (const elem of elems) {
    if (elem.textContent === 'show post') {
      elem.click();
    }
  }
};

export const main = async () => {
  let {handles} = await getOptions('showNsfw')
  handles = handles.split(',').map(h => h.replaceAll(/[@ \n]/g, ''))

  const currentHandle = activeProject.handle

  if (handles.includes(currentHandle)) {
    mutationManager.start(nsfwButtonQuery, clickShowPost)
  }
};

export const clean = async () => mutationManager.stop(clickShowPost);

