import { activeProject, managedProjects } from './utils/user.js';

const customClass = 'ch-utils-editor';
const uri = browser.runtime.getURL('');

const listener = event => {
  if (event.origin + '/' !== uri) return;
  console.log(event);
  if (event.data === 'frameInit') {
    event.source.postMessage({ activeProject, managedProjects }, uri);
  }
};

const editorFrame = Object.assign(document.createElement('iframe'), {
  src: browser.runtime.getURL('/scripts/editor.html'),
  className: customClass
});

export const main = async () => {
  window.addEventListener('message', listener);
  document.body.appendChild(editorFrame);
};
export const clean = async () => {
  window.removeEventListener('message', listener);
  editorFrame.remove();
};