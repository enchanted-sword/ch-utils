import { getOptions } from "./utils/jsTools";

function showPosts(handles) {
  for (let handle of handles) {
    if (document.querySelector('header span').textContent === '@' + handle) {
      for (let elem of document.querySelectorAll('article .co-18-plus + div button')) {
        if (elem.textContent === 'show post') {
          elem.click()
        }
      }
    }
  }
}

let intervalId;

export async function main () {
  let handles = await getOptions('handles')
  handles = handles.split(',').map(h => h.replaceAll(/[@ \n]/g, ''))
  console.log(handles);
  intervalId = setInterval(() => showPosts(handles), 500);
};

export async function clean () {
  clearInterval(intervalId)
};

