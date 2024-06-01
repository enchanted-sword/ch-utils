import { batchTrpc } from './utils/apiFetch.js';
import { followCard, tagCard } from './utils/elements.js';
import { mutationManager } from './utils/mutation.js';
import { noact } from './utils/noact.js';
import { debounce } from './utils/jsTools.js';

const customClass = 'ch-utils-quickSearch';
const customAttribute = 'data-quick-search';
const buttonSelector = '[href="https://cohost.org/rc/search"]';

const onSearch = async ({ target: { value } }) => {
  const [{ projects }, { result }] = await batchTrpc(
    ['projects.searchByHandle', 'tags.query'],
    { 
      0: { query: value, skipMinimum: false },
      1: { query: value }
    }
  );
  
  const projectCards = await Promise.all(projects.map(async project => await followCard(`${customClass}-result`, project)));
  document.getElementById(`${customClass}-projects`).replaceChildren(...projectCards);

  const tags = result.map(({ content }) => content);
  const tagCards = await Promise.all(tags.map(async tag => await tagCard(`${customClass}-result`, tag)));
  document.getElementById(`${customClass}-tags`).replaceChildren(...tagCards);
};

const searchWindow = noact({
  tag: 'dialog',
  className: `${customClass} h-full w-full max-h-screen max-w-screen flex-col items-center overflow-x-hidden overflow-y-auto justify-stretch gap-6 bg-transparent px-0 py-16 z-50 fixed top-0 text-inherit open:flex lg:px-6`,
  style: 'background: rgb(25 25 25 / .9)',
  onclick: event => {
    try {
      event.stopPropagation();
      if (event.target.matches(`dialog, .${customClass}-close`)) searchWindow.removeAttribute('open');
    } catch {null}
  },
  children: [{
    className: 'max-w-screen rounded-lg bg-notWhite p-3 text-notBlack',
    children: [{
      className: 'flex flex-col gap-4',
      children: [
        {
          className: 'flex flex-row justify-between items-center',
          children: [
            {
              tag: 'h1',
              className: 'h2',
              children: ['search']
            },
            {
              tag: 'svg',
              className: `${customClass}-close co-link-button h-6 w-6 cursor-pointer`,
              fill: 'none',
              viewBox: '0 0 24 24',
              'stroke-width': 1.5,
              stroke: 'rgb(var(--color-cherry))',
              'aria-hidden': true,
              children: [{
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
                d: 'M6 18L18 6M6 6l12 12'
              }]
            }
          ]
        },
        {
          tag: 'input',
          className: 'w-full',
          type: 'text',
          name: 'q1',
          placeholder: 'search for pages and tags!',
          oninput: debounce(onSearch)
        },
        {
          className: `${customClass}-placeHolder h5`,
          children: ['enter a query to see results!']
        },
        {
          id: `${customClass}-results`,
          children: [
            {
              className: 'mt-4',
              children: [
                {
                  tag: 'h2',
                  className: 'h5',
                  children: ['pages']
                },
                {
                  id: `${customClass}-projects`,
                  className: 'flex w-full flex-col gap-4',
                }
              ]
            },
            {
              tag: 'hr',
              className: 'my-4'
            },
            {
              children: [
                {
                  tag: 'h2',
                  className: 'h5',
                  children: ['tags']
                },
                {
                  id: `${customClass}-tags`,
                  className: 'mt-4 flex flex-col justify-between gap-3'
                }
              ]
            }
          ]
        }
      ]
    }]
  }]
});

const showDialog = event => {
  event.preventDefault();
  searchWindow.setAttribute('open', '');
};
const closeDialog = event => {if (event.key === 'Escape' && searchWindow.hasAttribute('open')) searchWindow.removeAttribute('open');}
const addPopovers = buttons => {
  for (const button of buttons) {
    button.setAttribute(customAttribute, '');
    button.addEventListener('click', showDialog);
  }
}

export const main = async () => {
  document.getElementById('app').append(searchWindow);
  document.addEventListener('keydown', closeDialog)
  mutationManager.start(buttonSelector, addPopovers);
};

export const clean = async () => {
  searchWindow.remove();
  document.removeEventListener('keydown', closeDialog);
  mutationManager.stop(addPopovers);
  document.querySelectorAll(`[${customAttribute}]`).forEach(button => {
    button.removeEventListener('click', showDialog);
    button.removeAttribute(customAttribute);
  });
};
