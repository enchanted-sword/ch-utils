import { apiFetch } from './utils/apiFetch.js';
import { followCard } from './utils/elements.js';
import { noact } from './utils/noact.js';
import { getOptions } from './utils/jsTools.js';

const boxSelector = '.co-themed-box';
const headerSelector = '.co-themed-box > h1';
const customClass = 'ch-utils-followers';

const limit = 100; // API no longer returns more than 100

const countElement = $('<span>', { class: `follow-count ${customClass}` });
const loader = $(`<span class='counter-loading ${customClass}'>(counting<span class='loader'></span>)</span>`);
const loaderButtonPlaceholder = $(`
  <button class="${customClass} load-all flex h-12 max-w-xs items-center justify-center rounded-lg bg-foreground px-6 text-lg text-text hover:bg-foreground-600 active:bg-foreground-700 disabled:bg-foreground-200">
    <span class="spinner"></span>
  </button>
`);
const loaderButton = followers => noact({
  className: `${customClass} load-all flex h-12 max-w-xs items-center justify-center rounded-lg bg-foreground px-6 text-lg text-text hover:bg-foreground-600 active:bg-foreground-700 disabled:bg-foreground-200`,
  onclick: async ({ target }) => {
    target.innerHTML = '<span class="spinner"></span>';
    await Promise.all(followers.map(async project => {
      if ($(`.co-project-handle[href='https://cohost.org/${project.handle}']`).length) return;
      $('.co-themed-box .mt-6').append(followCard(customClass, project));
    }));
    $('.max-w-xs').css('display', 'none');
  },
  children: ['load all']
});

const countFollowers = async () => {
  let offset = 0;
  let projects = [];
  let total = [];

  ({ projects } = await apiFetch('/v1/projects/followers', { method: 'GET', queryParams: { offset, limit } }));
  total.push(...projects);

  while (projects.length === limit) {
    offset += projects.length;
    ({ projects } = await apiFetch('/v1/projects/followers', { method: 'GET', queryParams: { offset, limit } }));
    total.push(...projects);
  }
  
  return total;
};

export const main = async () => {
  const { count, loadAll } = await getOptions('followers');
  if (location.pathname !== '/rc/project/followers' || (!count && !loadAll)) return;

  if (count) {
    $(headerSelector).prepend(countElement);
    $(headerSelector).append(loader);
  }
  if (loadAll) $(boxSelector).append(loaderButtonPlaceholder);

  const followers = await countFollowers();

  if (count) {
    countElement.text(followers.length);
    loader.remove();
  }
  if (loadAll) loaderButtonPlaceholder.replaceWith(loaderButton(followers));
};

export const clean = async () => $(`.${customClass}`).remove();