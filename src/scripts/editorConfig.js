import { noact } from './utils/noact.js';
import { batchTrpc } from './utils/apiFetch.js';

// monaco config
require.config({ paths: { vs: '../lib/vs' } });
require(['vs/editor/editor.main'], function () {
  var editor = monaco.editor.create(document.getElementById('container'), {
    value: ['<p>', '\tgo ahead, make a post', '</p>'].join('\n'),
    language: 'text/html',
    theme: 'vs-dark'
  });

  window.onresize = function () {
    editor.layout();
  };
});

// add functionality to the editor
const customClass = 'ch-utils-editorInner';
const hideMenuDelay = 500;
const uri = 'https://cohost.org';
let activeProject, managedProjects;

const listener = event => {
  if (event.origin !== uri) return;
  console.log(event.data);
  if (typeof event.data === 'object' && 'activeProject' in event.data) {
    ({ activeProject, managedProjects } = event.data);
    addEditorUtils();
  }
};

console.log(batchTrpc(['projects.searchByHandle'], { 0: { query: 'dragongirl', skipMinimum: false } }));

window.addEventListener('message', listener);
window.parent.postMessage('frameInit', uri);

const addEditorUtils = () => {
  const toggleState = event => {
    const target = event.target.closest('[data-headlessui-state]');
    const state = target.dataset.headlessuiState;
  
    if (state === 'open') {
      target.dataset.headlessuiState = '';
      target['aria-expanded'] = '';
    } else {
      target.dataset.headlessuiState = 'open';
      target['aria-expanded'] = true;
    }
  };
  const selectableProject = (project, activeProjectId) => {
    const { projectId, handle, avatarURL } = project;
    const selected = projectId === activeProjectId ? true : false;
  
    return {
      tag: 'li',
      className: 'flex h-10 cursor-pointer flex-row items-center gap-3 px-2 py-1 hover:bg-foreground-100 hover:text-foreground-800 lg:first-of-type:rounded-t-lg lg:last-of-type:rounded-b-lg',
      selectorId: 'projectSelector',
      role: 'option',
      tabindex: -1,
      'aria-selected': selected,
      dataset: { headlessuiSelected: selected },
      onclick: () => {
        const selector = document.getElementById('projectSelector');
        const avatar = selector.querySelector('img');
        selector.activeProject = project;
        selector.click();
        avatar.src = `${avatarURL}?dpr=2&amp;width=80&amp;height=80&amp;fit=cover&amp;auto=webp`;
        avatar.alt = `@${handle}`;
      },
      children: [
        {
          className: 'flex-0 mask relative aspect-square h-8 w-8',
          children: [{
            className: 'mask mask-roundrect h-full w-full object-cover',
            src: `${project.avatarURL}?dpr=2&amp;width=80&amp;height=80&amp;fit=cover&amp;auto=webp`,
            alt: project.handle
          }]
        },
        {
          tag: 'span',
          children: [`@${project.handle}`]
        }
      ]
    }
  };
  
  const projectSelector = noact({
    className: `${customClass} flex flex-row relative items-center justify-between gap-4`,
    children: [
      {
        className: 'group flex flex-row items-center gap-1',
        id: 'projectSelector',
        'aria-haspopup': 'listbox',
        'aria-expanded': false,
        dataset: { headlessuiState: '' },
        activeProject,
        onclick: toggleState,
        children: [
          {
            className: 'flex-row items-center gap-3 rounded-l-lg px-2 py-1 group-hover:bg-foreground-600 ui-open:bg-foreground-700 lg:flex',
            children: [{
              className: 'flex-0 mask relative aspect-square h-8 w-8',
              children: [{
                className: 'mask mask-roundrect h-full w-full object-cover',
                src: `${activeProject.avatarURL}?dpr=2&amp;width=80&amp;height=80&amp;fit=cover&amp;auto=webp`,
                alt: activeProject.handle
              }]
            }]
          },
          {
            className: 'rounded-r-lg p-2 group-hover:bg-foreground-600 ui-open:bg-foreground-700 lg:block',
            children: [{
              className: 'ch-utils-editorInner-caret h-6 w-6 transition-transform ui-open:rotate-180',
              viewBox: '0 0 24 24',
              'aria-hidden': true,
              fill: 'currentColor',
              children: [{
                'fill-rule': 'evenodd',
                'clip-rule': 'evenodd',
                d: 'M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z'
              }]
            }]
          }
        ]
      },
      {
        tag: 'ul',
        className: 'ch-utils-editorInner-list lg:cohost-shadow-light dark:lg:cohost-shadow-dark left-0 top-8 !overflow-y-auto truncate bg-foreground !outline-none absolute lg:max-h-[calc(100vh_-_100px)] lg:divide-none rounded-lg bg-notWhite text-notBlack',
        'aria-orientation': 'vertical',
        role: 'listbox',
        tabindex: 0,
        children: managedProjects.map(project => selectableProject(project, activeProject.projectId))
      }
    ]
  });

  document.querySelector('header').append(projectSelector);
  document.addEventListener('click', ({ target }) => {
    !target.matches('#projectSelector, #projectSelector *') && (document.getElementById('projectSelector').dataset.headlessuiState = '', hideMenuDelay);
  });
};