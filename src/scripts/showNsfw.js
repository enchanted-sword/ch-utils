import { getOptions } from './utils/jsTools.js';

let intervalId;

function showPosts(handles) {
  for (let handle of handles) {
    if ($('header .aspect-square + span').text() === '@' + handle) {
      for (let elem of $('article .co-18-plus + div button')) {
        if (elem.textContent === 'show post') {
          elem.click()
        }
      }
    }
  }
}

export async function main () {
  let {handles} = await getOptions('showNsfw')
  handles = handles.split(',').map(h => h.replaceAll(/[@ \n]/g, ''))
  intervalId = setInterval(() => showPosts(handles), 500);
};

export async function clean () {
  clearInterval(intervalId)
};

