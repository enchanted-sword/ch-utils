import { getOptions } from './utils/jsTools.js';
import { activeProject } from './utils/user.js';
import { mutationManager } from './utils/mutation.js';

let nsfwButtonQuery = 'article .co-18-plus + div button'

function clickShowPost() {
  for (let elem of elems) {
    if (elem.textContent === 'show post') {
      elem.click()
    }
  }
}

export async function main () {
  let {handles} = await getOptions('showNsfw')
  handles = handles.split(',').map(h => h.replaceAll(/[@ \n]/g, ''))

  const currentHandle = activeProject.handle

  if (handles.includes(currentHandle)) {
    mutationManager.start(nsfwButtonQuery, clickShowPost)
  }
};

export async function clean () {
  mutationManager.stop(clickShowPost)
};

